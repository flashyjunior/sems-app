'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { doseCalculationService } from '@/services/dose';
import { printService } from '@/services/print';
import { syncService } from '@/services/sync';
import { db, addDispenseRecord } from '@/lib/db';
import { captureDispensingEvent } from '@/services/analytics/eventProcessor';
import { DrugSearch } from './DrugSearch';
import { DrugVariantsSelector } from './DrugVariantsSelector';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import type { Drug, PatientInput, DispenseRecord } from '@/types';

interface DispenseFormProps {
  onDispenseComplete: () => void;
}

export function DispenseForm({ onDispenseComplete }: DispenseFormProps) {
  const [dispensingMode, setDispensingMode] = useState<'mode-select' | 'classic' | 'variants'>('variants');
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [patientData, setPatientData] = useState<PatientInput>({
    age: 0,
    weight: 0,
    pregnancyStatus: 'no',
    allergies: [],
    patientAgeGroup: 'adult',
  });
  const [dose, setDose] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highRiskAlert, setHighRiskAlert] = useState<any>(null);
  const [showHighRiskConfirmation, setShowHighRiskConfirmation] = useState(false);
  const [matchingPatients, setMatchingPatients] = useState<Array<{
    name: string;
    phoneNumber?: string;
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
  const notifyRecordSaved = useAppStore((s) => s.notifyRecordSaved);

  // Search for matching patients by name or phone number
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setMatchingPatients([]);
      return;
    }

    try {
      const allRecords = await db.dispenseRecords.toArray();
      const uniquePatients = new Map<string, {
        name: string;
        phoneNumber?: string;
        age: number;
        weight: number;
        pregnancyStatus: 'yes' | 'no' | 'unknown';
        timestamp?: number;
      }>();

      allRecords.forEach((record) => {
        if (record.patientName || record.patientPhoneNumber) {
          const searchLower = searchTerm.toLowerCase();
          const nameLower = (record.patientName || '').toLowerCase();
          const phoneLower = (record.patientPhoneNumber || '').toLowerCase();
          
          // Match if the patient name or phone number contains the search term
          if (nameLower.includes(searchLower) || phoneLower.includes(searchLower)) {
            // Use patient name as key to get the most recent entry
            const patientKey = record.patientName || record.patientPhoneNumber || 'unknown';
            const existingPatient = uniquePatients.get(patientKey);
            if (!existingPatient || (record.timestamp || 0) > (existingPatient.timestamp || 0)) {
              uniquePatients.set(patientKey, {
                name: record.patientName || '',
                phoneNumber: record.patientPhoneNumber || '',
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
      phoneNumber: patient.phoneNumber,
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
      const printResult = await printService.printLabel(
        dose,
        patientData,
        user.username
      );

      const printSuccess = printResult.success;
      const receiptTimestamp = printResult.timestamp;

      if (!printSuccess) {
        console.warn('Print failed but continuing with record save');
      }

      // Create dispense record
      const record: DispenseRecord = {
        id: `dispense-${receiptTimestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: receiptTimestamp,
        pharmacistId: user.id,
        pharmacistName: user.username,
        patientName: patientData.name || 'Unknown',
        patientPhoneNumber: patientData.phoneNumber || undefined,
        patientAge: patientData.age || null,
        patientWeight: patientData.weight || null,
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

      // NEW: Capture DPAP analytics event
      try {
        const mapAgeGroup = (g: any) => {
          if (!g) return 'adult';
          if (g === 'pediatric') return 'paediatric';
          return g;
        };

        const analyticsEvent = await captureDispensingEvent({
          dispenseRecordId: record.id,
          timestamp: new Date(receiptTimestamp),
          pharmacyId: user?.pharmacy?.id || user?.pharmacyId || 'UNKNOWN_PHARMACY',
          userId: parseInt(user.id, 10),
          drugId: selectedDrug.id,
          drugName: selectedDrug.genericName,
          patientAgeGroup: mapAgeGroup(patientData.patientAgeGroup || 'adult'),
          isPrescription: true,
          isControlledDrug: selectedDrug.category?.toLowerCase().includes('controlled') || false,
          isAntibiotic: selectedDrug.category?.toLowerCase().includes('antibiotic') || false,
          stgCompliant: true,
          overrideFlag: false,
          patientIsPregnant: patientData.pregnancyStatus === 'yes',
        });

        // Check if high-risk
        if (analyticsEvent.highRiskFlag) {
          setHighRiskAlert(analyticsEvent);
          setShowHighRiskConfirmation(true);
          setLoading(false);
          return;
        }
      } catch (analyticsErr) {
        console.warn('Analytics capture failed:', analyticsErr);
        // Continue even if analytics fails
      }

      // Add to recent dispenses
      addRecentDispense(record);

      // Notify that a record was saved so UI refreshes
      notifyRecordSaved();

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
    if (!selectedDrug) {
      setError('Please select a drug');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If age and weight are provided, calculate the dose
      if (patientData.age && patientData.weight) {
        const calculated = await doseCalculationService.calculateDose(
          selectedDrug.id,
          patientData
        );

        if (!calculated) {
          setError(
            `No dosing information available for ${selectedDrug.genericName} at age ${patientData.age} and weight ${patientData.weight}kg. ` +
            'This patient may fall outside the defined treatment guidelines or the database may need to be re-initialized.'
          );
          setLoading(false);
          return;
        }

        // Dose calculation result
        setDose({ ...calculated, dosageForm: calculated.dosageForm || selectedDrug.form || 'tablet' });
        setCurrentPatient(patientData);
        setCurrentDose(calculated);
      } else {
        // If age and weight are not provided, create a basic dose object for manual entry
        // But try to fetch instructions from available regimens in the system
        let defaultInstructions = '';
        try {
          const regimens = await db.doseRegimens
            .where('drugId')
            .equals(selectedDrug.id)
            .toArray();
          
          if (regimens.length > 0) {
            // Use instructions from the first available regimen as a template
            defaultInstructions = regimens[0].instructions || '';
          }
        } catch (err) {
          console.warn('Could not fetch regimen instructions:', err);
        }

        const manualDose = {
          drugId: selectedDrug.id,
          drugName: selectedDrug.genericName,
          strength: selectedDrug.strength,
          dosageForm: selectedDrug.form || 'tablet',
          doseMg: 0,
          frequency: '',
          duration: '',
          route: selectedDrug.route,
          instructions: defaultInstructions,
          stgCitation: `STG ${selectedDrug.stgReference}`,
          warnings: [],
          requiresPinConfirm: false,
        };
        setDose(manualDose);
        setCurrentPatient(patientData);
        setCurrentDose(manualDose);
      }
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
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Dose Calculation - Review & Edit
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">Edit fields as needed, field captions are for reference only</p>
        </div>

        {(dose?.warnings?.length || 0) > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <div className="font-semibold text-yellow-900 text-sm mb-1">Warnings</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {dose?.warnings?.map((w: string, i: number) => (
                <li key={i} className="text-xs text-yellow-800">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-3 space-y-2.5">
          {/* Drug Name - Editable */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-0.5">Drug Name</label>
            <input
              type="text"
              value={`${dose?.drugName || ''} ${dose?.strength || ''}`.trim()}
              onChange={(e) => {
                const parts = e.target.value.split(' ');
                const strength = parts[parts.length - 1];
                const drugName = parts.slice(0, -1).join(' ');
                setDose({ ...dose, drugName: drugName || dose?.drugName, strength: strength || dose?.strength, warnings: dose?.warnings || [] });
              }}
              className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Dose & Frequency */}
          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="max-w-[90px]">
              <label className="block text-xs font-bold text-gray-700 mb-0.5">Dose (mg)</label>
              <input
                type="number"
                value={dose?.doseMg || ''}
                onChange={(e) => setDose({ ...dose, doseMg: parseFloat(e.target.value) || 0, warnings: dose?.warnings || [] })}
                className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                step="0.1"
              />
            </div>

            <div className="max-w-[80px]">
              <label className="block text-xs font-bold text-gray-700 mb-0.5">Qty</label>
              <input
                type="number"
                min={1}
                value={dose?.quantity ?? 1}
                onChange={(e) => setDose({ ...dose, quantity: parseInt(e.target.value) || 1, warnings: dose?.warnings || [] })}
                className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-0.5">Frequency</label>
              <input
                type="text"
                value={dose?.frequency || ''}
                onChange={(e) => setDose({ ...dose, frequency: e.target.value, warnings: dose?.warnings || [] })}
                className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white "
                placeholder="e.g., TDS"
              />
            </div>
          </div>

          {/* Dosage Form field (separate small control) */}
          <div className="mt-2 max-w-xs">
            <label className="block text-xs font-bold text-gray-700 mb-0.5">Form</label>
            <select
              value={dose?.dosageForm || selectedDrug?.form || 'tablet'}
              onChange={(e) => setDose({ ...dose, dosageForm: e.target.value, warnings: dose?.warnings || [] })}
              className="w-40 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="tablet">Tablet</option>
              <option value="capsule">Capsule</option>
              <option value="liquid">Liquid</option>
              <option value="injection">Injection</option>
              <option value="patch">Patch</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Units input removed to avoid coupling with doseMg */}

          {/* Dosage Form selection removed - preserving original behavior */}

          {/* Route & Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-0.5">Route</label>
              <input
                type="text"
                value={dose?.route || ''}
                onChange={(e) => setDose({ ...dose, route: e.target.value, warnings: dose?.warnings || [] })}
                className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white "
                placeholder="e.g., oral"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-0.5">Duration</label>
              <input
                type="text"
                value={dose?.duration || ''}
                onChange={(e) => setDose({ ...dose, duration: e.target.value, warnings: dose?.warnings || [] })}
                className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white "
                placeholder="e.g., 7 days"
              />
            </div>
          </div>

          {/* Instructions - Reduced height */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-0.5">Instructions</label>
            <textarea
              value={dose?.instructions || ''}
              onChange={(e) => setDose({ ...dose, instructions: e.target.value, warnings: dose?.warnings || [] })}
              className="w-full px-3 py-1.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white "
              placeholder="Special instructions"
              rows={1}
            />
          </div>

          {/* STG Citation - Read-only */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">STG Ref</label>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900">
              {dose.stgCitation}
            </div>
          </div>

          {/* Patient Info - Read-only */}
          <div className="border-t pt-2 mt-2">
            <p className="text-xs font-semibold text-gray-700 mb-1.5">Patient</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-gray-600">Name</div>
                <div className="font-medium text-gray-900">{patientData.name || 'N/A'}</div>
              </div>
              <div className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-gray-600">Age</div>
                <div className="font-medium text-gray-900">{patientData.age}y</div>
              </div>
              <div className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-gray-600">Weight</div>
                <div className="font-medium text-gray-900">{patientData.weight}kg</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedDrug(null);
              setDose(null);
              setError('');
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
          >
            Back
          </button>
          <button
            onClick={handlePrintAndComplete}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold"
          >
            {loading ? 'Processing...' : 'Print & Complete'}
          </button>
        </div>
      </div>
    );
  }

  // Runtime guard: prevent dispense workflow when user is not assigned to a pharmacy
  const userPharmacyId = user?.pharmacy?.id || user?.pharmacyId;
  if (!userPharmacyId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Access Denied</h3>
        <p className="text-sm text-gray-700 mb-4">
          You are not assigned to a pharmacy. Creating dispense records is restricted to users linked to a pharmacy.
        </p>
        <p className="text-sm text-gray-600 mb-4">Please ask an administrator to assign you to a pharmacy or use the Settings menu to update your assignment.</p>
        <div className="flex gap-2">
          <button
            onClick={() => { /* no-op: user should navigate via Settings in the app nav */ }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (dispensingMode === 'mode-select') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Dispensing Method</h2>
          <p className="text-gray-600 text-sm mt-2">Select how you want to dispense medication to the patient</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classic Method */}
          <button
            onClick={() => {
              setDispensingMode('classic');
              setPatientData({
                age: 0,
                weight: 0,
                pregnancyStatus: 'no',
                allergies: [],
              });
            }}
            className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Classic Method</h3>
            <p className="text-sm text-gray-600">
              Search for a drug, enter patient details, and calculate dose based on age/weight
            </p>
            <div className="mt-4 text-xs text-gray-500">
              ✅ Detailed calculation
              <br />
              ✅ Patient age & weight required
              <br />
              ✅ Full customization
            </div>
          </button>

          {/* Drug Variants Method */}
          <button
            onClick={() => {
              setDispensingMode('variants');
              setPatientData({
                age: 0,
                weight: 0,
                pregnancyStatus: 'no',
                allergies: [],
              });
            }}
            className="p-6 border-2 border-green-300 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Quick Variants Method</h3>
            <p className="text-sm text-gray-600">
              Search for a drug variant, auto-fill from database, print directly or edit before saving
            </p>
            <div className="mt-4 text-xs text-gray-500">
              ✅ Quick selection
              <br />
              ✅ Pre-configured doses
              <br />
              ✅ Auto-print option
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Drug Variants dispensing mode
  if (dispensingMode === 'variants') {
    return (
      <div className="space-y-4">
        {/* Patient Info Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200 p-3">
          <h3 className="text-sm font-bold text-blue-900 mb-2.5">Patient Information</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-1.5">
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={patientData.name || ''}
                  onChange={(e) => handlePatientNameChange(e.target.value)}
                  onFocus={() => patientData.name && matchingPatients.length > 0 && setShowPatientDropdown(true)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                  placeholder="Name"
                  autoComplete="off"
                />
                
                {/* Patient dropdown */}
                {showPatientDropdown && matchingPatients.length > 0 && (
                  <div className="absolute z-10 w-48 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="max-h-40 overflow-y-auto">
                      {matchingPatients.map((patient, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectPatient(patient)}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-100 border-b border-gray-100 last:border-b-0 transition-colors text-xs"
                        >
                          <div className="font-semibold text-gray-900">{patient.name || patient.phoneNumber}</div>
                          <div className="text-xs text-gray-600">
                            {patient.phoneNumber && <span>{patient.phoneNumber} | </span>}
                            {patient.age}y | {patient.weight}kg
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={patientData.phoneNumber || ''}
                  onChange={(e) => {
                    setPatientData({ ...patientData, phoneNumber: e.target.value });
                    searchPatients(e.target.value);
                  }}
                  onFocus={() => patientData.phoneNumber && matchingPatients.length > 0 && setShowPatientDropdown(true)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                  placeholder="###-###-####"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                >
                  <option value="unknown">Unknown</option>
                  <option value="yes">Pregnant</option>
                  <option value="no">Not Pregnant</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Age Group
                </label>
                <select
                  value={patientData.patientAgeGroup || 'adult'}
                  onChange={(e) =>
                    setPatientData({
                      ...patientData,
                      patientAgeGroup: e.target.value as any,
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                >
                  <option value="paediatric">Paediatric (0-12)</option>
                  <option value="adult">Adult (13-64)</option>
                  <option value="geriatric">Geriatric (65+)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Age (yrs)
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
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Weight (kg)
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
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-blue-400 focus:ring-1 focus:ring-blue-300 text-gray-900 bg-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drug Variant Selector */}
        <DrugVariantsSelector 
          patientData={patientData}
          onComplete={() => {
            setPatientData({
              age: 0,
              weight: 0,
              pregnancyStatus: 'no',
              allergies: [],
            });
            onDispenseComplete();
          }}
          onBack={() => {
            // Reset and close the dispense form
            setPatientData({
              age: 0,
              weight: 0,
              pregnancyStatus: 'no',
              allergies: [],
            });
            onDispenseComplete();
          }}
        />
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

      {/* High-Risk Confirmation Dialog */}
      {showHighRiskConfirmation && highRiskAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md p-6 border-l-4 border-red-600">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-600 w-6 h-6" />
              <h3 className="text-lg font-bold text-red-600">⚠️ High-Risk Dispensing Detected</h3>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Risk Score:</strong> {highRiskAlert.riskScore}/100
              </p>
              <p className="text-sm text-gray-700">
                <strong>Risk Category:</strong> <span className="text-red-600 font-semibold">{highRiskAlert.riskCategory?.toUpperCase()}</span>
              </p>
              {highRiskAlert.riskFlags && highRiskAlert.riskFlags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Flags:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                    {highRiskAlert.riskFlags.map((flag: string) => (
                      <li key={flag}>{flag.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
              <p className="text-xs text-yellow-800">
                <strong>Action Required:</strong> Review the flagged risks carefully before proceeding. This dispensing may require additional verification or supervision.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowHighRiskConfirmation(false);
                  setHighRiskAlert(null);
                  setSelectedDrug(null);
                  setDose(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowHighRiskConfirmation(false);
                  setHighRiskAlert(null);
                  addRecentDispense({} as any); // Record already saved
                  onDispenseComplete();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <DrugSearch onSelect={setSelectedDrug} />

      {selectedDrug && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-semibold text-gray-900">
            {selectedDrug.genericName} {selectedDrug.strength}
          </div>
          <div className="text-sm text-gray-600 mt-1">{selectedDrug.category}</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              value={patientData.name || ''}
              onChange={(e) => handlePatientNameChange(e.target.value)}
              onFocus={() => patientData.name && matchingPatients.length > 0 && setShowPatientDropdown(true)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
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
                      <div className="font-medium text-gray-900">{patient.name || patient.phoneNumber}</div>
                      <div className="text-sm text-gray-600">
                        {patient.phoneNumber && <span>Phone: {patient.phoneNumber} | </span>}
                        Age: {patient.age}y | Weight: {patient.weight}kg
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={patientData.phoneNumber || ''}
              onChange={(e) => {
                setPatientData({ ...patientData, phoneNumber: e.target.value });
                searchPatients(e.target.value);
              }}
              onFocus={() => patientData.phoneNumber && matchingPatients.length > 0 && setShowPatientDropdown(true)}
              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
              placeholder="Search by phone number..."
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (years)
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
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Age"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
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
              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
              placeholder="Weight"
            />
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
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="unknown">Unknown</option>
              <option value="yes">Pregnant</option>
              <option value="no">Not Pregnant</option>
            </select>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
        {loading ? 'Processing...' : 'Proceed'}
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



