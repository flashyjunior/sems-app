'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { doseCalculationService } from '@/services/dose';
import { printService } from '@/services/print';
import { syncService } from '@/services/sync';
import { db, addDispenseRecord } from '@/lib/db';
import { DrugSearch } from './DrugSearch';
import { ChevronDown } from 'lucide-react';
import type { Drug, PatientInput, DispenseRecord } from '@/types';

interface DispenseFormProps {
  onDispenseComplete: () => void;
}

export function DispenseForm({ onDispenseComplete }: DispenseFormProps) {
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [patientData, setPatientData] = useState<PatientInput>({
    age: 0,
    weight: 0,
    pregnancyStatus: 'no',
    allergies: [],
  });
  const [dose, setDose] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matchingPatients, setMatchingPatients] = useState<Array<{
    name: string;
    age: number;
    weight: number;
    pregnancyStatus: 'yes' | 'no' | 'unknown';
  }>>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const currentPatient = useAppStore((s) => s.currentPatient);
  const setCurrentPatient = useAppStore((s) => s.setCurrentPatient);
  const setCurrentDose = useAppStore((s) => s.setCurrentDose);
  const user = useAppStore((s) => s.user);
  const clearWorkflow = useAppStore((s) => s.clearWorkflow);
  const addRecentDispense = useAppStore((s) => s.addRecentDispense);

  // Search for matching patients by name
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setMatchingPatients([]);
      return;
    }

    try {
      const allRecords = await db.dispenseRecords.toArray();
      const uniquePatients = new Map<string, {
        name: string;
        age: number;
        weight: number;
        pregnancyStatus: 'yes' | 'no' | 'unknown';
        timestamp?: number;
      }>();

      allRecords.forEach((record) => {
        if (record.patientName) {
          const lowerName = record.patientName.toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          
          // Match if the patient name contains the search term
          if (lowerName.includes(searchLower)) {
            // Use patient name as key to get the most recent entry
            const existingPatient = uniquePatients.get(record.patientName);
            if (!existingPatient || (record.timestamp || 0) > (existingPatient.timestamp || 0)) {
              uniquePatients.set(record.patientName, {
                name: record.patientName,
                age: record.patientAge || 0,
                weight: record.patientWeight || 0,
                pregnancyStatus: 'unknown',
                timestamp: record.timestamp,
              });
            }
          }
        }
      });

      setMatchingPatients(Array.from(uniquePatients.values()));
      setShowPatientDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handlePatientNameChange = (value: string) => {
    setPatientData({ ...patientData, name: value });
    searchPatients(value);
  };

  const selectPatient = (patient: typeof matchingPatients[0]) => {
    setPatientData({
      ...patientData,
      name: patient.name,
      age: patient.age,
      weight: patient.weight,
      pregnancyStatus: patient.pregnancyStatus,
    });
    setMatchingPatients([]);
    setShowPatientDropdown(false);
  };

  const handlePrintAndComplete = async () => {
    if (!user || !dose || !selectedDrug) {
      setError('Missing required data for dispense');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Print label
      const printSuccess = await printService.printLabel(
        dose,
        patientData,
        user.username
      );

      if (!printSuccess) {
        console.warn('Print failed but continuing with record save');
      }

      // Create dispense record
      const record: DispenseRecord = {
        id: `dispense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        pharmacistId: user.id,
        pharmacistName: user.username,
        patientName: patientData.name || 'Unknown',
        patientAge: patientData.age,
        patientWeight: patientData.weight,
        drugId: selectedDrug.id,
        drugName: dose.drugName,
        dose,
        safetyAcknowledgements: [],
        printedAt: printSuccess ? Date.now() : undefined,
        synced: false,
        deviceId: getDeviceId(),
        auditLog: [
          {
            timestamp: Date.now(),
            action: 'dispense_recorded',
            actor: user.id,
            details: { drugId: selectedDrug.id },
          },
        ],
      };

      // Save to local database
      await addDispenseRecord(record);

      // Add to recent dispenses
      addRecentDispense(record);

      // Notify sync service of status change so navbar updates
      syncService.refreshStatus();

      // Show success and reset
      setSelectedDrug(null);
      setDose(null);
      setError('');
      clearWorkflow();

      onDispenseComplete();
    } catch (err) {
      setError(`Failed to complete dispense: ${String(err)}`);
      console.error('Dispense error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDose = async () => {
    if (!selectedDrug || !patientData.age || !patientData.weight) {
      setError('Please select a drug and enter patient age and weight');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const calculated = await doseCalculationService.calculateDose(
        selectedDrug.id,
        patientData
      );

      if (!calculated) {
        setError(
          `No dosing information available for ${selectedDrug.genericName} at age ${patientData.age} and weight ${patientData.weight}kg. ` +
          'This patient may fall outside the defined treatment guidelines or the database may need to be re-initialized.'
        );
        return;
      }

      setDose(calculated);
      setCurrentPatient(patientData);
      setCurrentDose(calculated);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      // Extract and simplify the error message for the user
      if (errorMsg.includes('No applicable dosing regimen found')) {
        const match = errorMsg.match(/for (.*?) \(age:/);
        const drugName = match ? match[1] : selectedDrug.genericName;
        setError(
          `No dosing guidelines found for ${drugName} with patient parameters (age: ${patientData.age}y, weight: ${patientData.weight}kg). ` +
          'Please verify the patient information or contact clinical support.'
        );
      } else if (errorMsg.includes('Drug not found')) {
        setError('This drug is not available in the system. Please try another drug or verify the database is initialized.');
      } else {
        setError(`Dose calculation error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (dose) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Dose Calculation
          </h3>
        </div>

        {dose.warnings.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="font-semibold text-yellow-900 mb-2">Warnings</div>
            <ul className="list-disc pl-5 space-y-1">
              {dose.warnings.map((w: string, i: number) => (
                <li key={i} className="text-sm text-yellow-800">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-600">Drug</div>
            <div className="text-2xl font-bold text-gray-900">
              {dose.drugName} {dose.strength}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Dose</div>
              <div className="text-xl font-semibold text-gray-900">
                {dose.doseMg} mg
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Frequency</div>
              <div className="text-xl font-semibold text-gray-900">
                {dose.frequency}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Route</div>
              <div className="text-lg font-semibold text-gray-900">
                {dose.route}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {dose.duration}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <div className="text-xs text-gray-600">{dose.stgCitation}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedDrug(null);
              setDose(null);
              setError('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handlePrintAndComplete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
          >
            {loading ? 'Processing...' : 'Print & Complete'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">New Dispense</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <DrugSearch onSelect={setSelectedDrug} />

      {selectedDrug && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-semibold text-gray-900">
            {selectedDrug.genericName} {selectedDrug.strength}
          </div>
          <div className="text-sm text-gray-600">
            {selectedDrug.tradeName.join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name (Optional)
          </label>
          <input
            type="text"
            value={patientData.name || ''}
            onChange={(e) => handlePatientNameChange(e.target.value)}
            onFocus={() => patientData.name && matchingPatients.length > 0 && setShowPatientDropdown(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Type patient name to search..."
            autoComplete="off"
          />
          
          {/* Patient dropdown */}
          {showPatientDropdown && matchingPatients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="max-h-48 overflow-y-auto">
                {matchingPatients.map((patient, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectPatient(patient)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-600">
                      Age: {patient.age}y | Weight: {patient.weight}kg
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (years) *
            </label>
            <input
              type="number"
              min="0"
              max="150"
              value={patientData.age || ''}
              onChange={(e) =>
                setPatientData({
                  ...patientData,
                  age: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Age"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg) *
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={patientData.weight || ''}
              onChange={(e) =>
                setPatientData({
                  ...patientData,
                  weight: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Weight"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pregnancy Status
          </label>
          <select
            value={patientData.pregnancyStatus || 'unknown'}
            onChange={(e) =>
              setPatientData({
                ...patientData,
                pregnancyStatus: e.target.value as any,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="unknown">Unknown</option>
            <option value="yes">Pregnant</option>
            <option value="no">Not Pregnant</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculateDose}
        disabled={loading || !selectedDrug}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        {loading ? 'Calculating...' : 'Calculate Dose'}
      </button>
    </div>
  );
}

function getDeviceId(): string {
  const key = 'sems_device_id';
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
}
