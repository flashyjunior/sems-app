'use client';

import { useState, useEffect } from 'react';
import { searchService } from '@/services/search';
import { printService } from '@/services/print';
import { syncService } from '@/services/sync';
import { db, addDispenseRecord } from '@/lib/db';
import { useAppStore } from '@/store/app';
import { Printer, Save, X } from 'lucide-react';
import type { Drug, DoseCalculation, DispenseRecord, DoseRegimen } from '@/types';

interface DrugVariantOption {
  drug: Drug;
  regimens?: any[];
}

interface DrugRegimenOption {
  drug: Drug;
  regimen: any;
}

interface DrugVariantsSelectorProps {
  onComplete: () => void;
  onBack: () => void;
  patientData?: {
    name?: string;
    phoneNumber?: string;
    age: number;
    weight: number;
    pregnancyStatus?: 'yes' | 'no' | 'unknown';
    allergies?: string[];
  };
}

export function DrugVariantsSelector({ 
  onComplete, 
  onBack,
  patientData: initialPatientData
}: DrugVariantsSelectorProps) {
  const [patientData, setPatientData] = useState<{
    name?: string;
    phoneNumber?: string;
    age: number;
    weight: number;
    pregnancyStatus?: 'yes' | 'no' | 'unknown';
    allergies: string[];
  }>(() => ({
    name: initialPatientData?.name,
    phoneNumber: initialPatientData?.phoneNumber,
    age: initialPatientData?.age ?? 0,
    weight: initialPatientData?.weight ?? 0,
    pregnancyStatus: initialPatientData?.pregnancyStatus ?? 'no',
    allergies: initialPatientData?.allergies ?? [],
  }));
  const [searchQuery, setSearchQuery] = useState('');
  const [regimenOptions, setRegimenOptions] = useState<DrugRegimenOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<DrugVariantOption | null>(null);
  const [selectedRegimen, setSelectedRegimen] = useState<any>(null);
  const [editedDose, setEditedDose] = useState<DoseCalculation | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingState, setProcessingState] = useState<'none' | 'printing' | 'saving'>('none');
  const [matchingPatients, setMatchingPatients] = useState<Array<{
    name: string;
    phoneNumber?: string;
    age: number;
    weight: number;
    pregnancyStatus: 'yes' | 'no' | 'unknown';
  }>>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const user = useAppStore((s) => s.user);
  const addRecentDispense = useAppStore((s) => s.addRecentDispense);
  const notifyRecordSaved = useAppStore((s) => s.notifyRecordSaved);
  const clearWorkflow = useAppStore((s) => s.clearWorkflow);

  // Sync patient data when the prop changes
  useEffect(() => {
    if (initialPatientData) {
      setPatientData({
        name: initialPatientData.name,
        phoneNumber: initialPatientData.phoneNumber,
        age: initialPatientData.age ?? 0,
        weight: initialPatientData.weight ?? 0,
        pregnancyStatus: initialPatientData.pregnancyStatus ?? 'no',
        allergies: initialPatientData.allergies ?? [],
      });
    }
  }, [initialPatientData?.name, initialPatientData?.phoneNumber, initialPatientData?.age, initialPatientData?.weight, initialPatientData?.pregnancyStatus]);

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
          
          if (nameLower.includes(searchLower) || phoneLower.includes(searchLower)) {
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
      allergies: patientData.allergies,
    });
    setMatchingPatients([]);
    setShowPatientDropdown(false);
  };

  // Search for drug regimens
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setRegimenOptions([]);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const drugs = await searchService.searchDrugs(searchQuery);
        const allRegimens: DrugRegimenOption[] = [];
        
        for (const drug of drugs) {
          const regimens = await db.doseRegimens
            .where('drugId')
            .equals(drug.id)
            .toArray();
          
          if (regimens && regimens.length > 0) {
            regimens.forEach((regimen) => {
              allRegimens.push({
                drug,
                regimen,
              });
            });
          }
        }

        setRegimenOptions(allRegimens.slice(0, 20));
        setShowDropdown(true);
      } catch (err) {
        setError(`Search failed: ${String(err)}`);
        console.error('Drug search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Generate dose from selected regimen
  const handleSelectRegimen = async (option: DrugRegimenOption) => {
    setSelectedVariant({
      drug: option.drug,
      regimens: [option.regimen],
    });
    setSelectedRegimen(option.regimen);
    setShowDropdown(false);

    try {
      // Create a dose object with the regimen's information
      const doseMgValue = typeof option.regimen.doseMg === 'string' 
        ? parseFloat(option.regimen.doseMg) 
        : (option.regimen.doseMg || 0);
      
      const dose: DoseCalculation = {
        drugId: option.drug.id,
        drugName: option.drug.genericName,
        strength: option.drug.strength,
        doseMg: doseMgValue,
        frequency: option.regimen.frequency || '',
        duration: option.regimen.duration || '7 days',
        route: option.drug.route,
        instructions: option.regimen.instructions || '',
        stgCitation: `STG ${option.drug.stgReference}`,
        warnings: option.drug.warnings || [],
        requiresPinConfirm: false,
      };

      setEditedDose(dose);
      setError('');
    } catch (err) {
      setError(`Failed to load regimen details: ${String(err)}`);
      console.error('Error loading regimen:', err);
    }
  };

  // Handle printing - Save to DB and print
  const handlePrintOnly = async () => {
    if (!editedDose || !user || !selectedVariant) {
      setError('Missing required data for printing');
      return;
    }

    const patientDataForPrint = {
      ...patientData,
      allergies: patientData.allergies || [],
    };

    setProcessingState('printing');
    setError('');

    try {
      // Print label
      const printResult = await printService.printLabel(
        editedDose,
        patientDataForPrint,
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
        drugId: selectedVariant.drug.id,
        drugName: editedDose.drugName,
        dose: {
          ...editedDose,
          pregnancyStatus: patientData.pregnancyStatus,
          allergies: patientData.allergies || [],
        } as DoseCalculation,
        safetyAcknowledgements: [],
        printedAt: printSuccess ? Date.now() : undefined,
        synced: false,
        deviceId: getDeviceId(),
        auditLog: [
          {
            timestamp: Date.now(),
            action: 'dispense_recorded',
            actor: user.id,
            details: { 
              drugId: selectedVariant.drug.id,
              source: 'variant_selector',
              patientDetails: {
                name: patientData.name,
                age: patientData.age,
                weight: patientData.weight,
                pregnancyStatus: patientData.pregnancyStatus,
                allergies: patientData.allergies
              }
            },
          },
        ],
      };

      // Save to local database
      try {
        console.log('Saving dispense record with patient data:', {
          patientName: record.patientName,
          patientAge: record.patientAge,
          patientWeight: record.patientWeight,
          patientPhoneNumber: record.patientPhoneNumber,
          pregnancyStatus: record.dose?.pregnancyStatus,
          allergies: record.dose?.allergies,
        });
        
        await addDispenseRecord(record);
        console.log('Dispense record saved successfully');
      } catch (err) {
        console.error('Failed to save dispense record:', err);
        setError(`Failed to save record: ${String(err)}`);
        setProcessingState('none');
        return;
      }

      // Add to recent dispenses
      addRecentDispense(record);

      // Notify that a record was saved
      notifyRecordSaved();

      // Notify sync service
      syncService.refreshStatus();

      // Clear and reset after successful print
      setSearchQuery('');
      setSelectedVariant(null);
      setEditedDose(null);
      setSelectedRegimen(null);
      onComplete();
    } catch (err) {
      setError(`Print error: ${String(err)}`);
      console.error('Print error:', err);
    } finally {
      setProcessingState('none');
    }
  };

  // Handle print and save - Save to DB, print, and save new drug variant
  const handlePrintAndSave = async () => {
    if (!editedDose || !user || !selectedVariant) {
      setError('Missing required data');
      return;
    }

    const patientDataForPrint = {
      ...patientData,
      allergies: patientData.allergies || [],
    };

    setProcessingState('saving');
    setError('');

    try {
      // Print label
      const printResult = await printService.printLabel(
        editedDose,
        patientDataForPrint,
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
        drugId: selectedVariant.drug.id,
        drugName: editedDose.drugName,
        dose: {
          ...editedDose,
          pregnancyStatus: patientData.pregnancyStatus,
          allergies: patientData.allergies || [],
        },
        safetyAcknowledgements: [],
        printedAt: printSuccess ? Date.now() : undefined,
        synced: false,
        deviceId: getDeviceId(),
        auditLog: [
          {
            timestamp: Date.now(),
            action: 'dispense_recorded',
            actor: user.id,
            details: { 
              drugId: selectedVariant.drug.id,
              source: 'variant_selector',
              patientDetails: {
                name: patientData.name,
                age: patientData.age,
                weight: patientData.weight,
                pregnancyStatus: patientData.pregnancyStatus,
                allergies: patientData.allergies
              }
            },
          },
        ],
      };

      // Save to local database
      try {
        console.log('Saving dispense record with patient data:', {
          patientName: record.patientName,
          patientAge: record.patientAge,
          patientWeight: record.patientWeight,
          patientPhoneNumber: record.patientPhoneNumber,
          pregnancyStatus: record.dose?.pregnancyStatus,
          allergies: record.dose?.allergies,
        });
        
        await addDispenseRecord(record);
        console.log('Dispense record saved successfully');
      } catch (err) {
        console.error('Failed to save dispense record:', err);
        setError(`Failed to save record: ${String(err)}`);
        setProcessingState('none');
        return;
      }

      // Add to recent dispenses
      addRecentDispense(record);

      // Notify that a record was saved
      notifyRecordSaved();

      // **ALWAYS SAVE TO TEMP**: When user clicks "Print & Save", save the current dose to temp tables for admin review
      // Primary: Check if there were actual edits (change detection)
      // Fallback: If no edits detected but user clicked Print & Save, still save to temp tables
      if (editedDose && selectedVariant) {
        try {
          // PRIMARY CHECK: Detect if any fields were edited
          const doseMgChanged = String(editedDose.doseMg).trim() !== String(selectedRegimen?.doseMg || '').trim();
          const frequencyChanged = String(editedDose.frequency).trim() !== String(selectedRegimen?.frequency || '').trim();
          const durationChanged = String(editedDose.duration).trim() !== String(selectedRegimen?.duration || '').trim();
          const routeChanged = String(editedDose.route).trim() !== String(selectedRegimen?.route || '').trim();
          const instructionsChanged = String(editedDose.instructions).trim() !== String(selectedRegimen?.instructions || '').trim();
          
          const doseEdited = doseMgChanged || frequencyChanged || durationChanged || routeChanged || instructionsChanged;
          const drugNameChanged = editedDose.drugName && editedDose.drugName !== selectedVariant.drug.genericName;
          const hasEdits = drugNameChanged || doseEdited;

          console.log('=== SAVING TO TEMP TABLES (Print & Save clicked) ===');
          console.log('Change Detection Results:');
          console.log('  doseMgChanged:', doseMgChanged);
          console.log('  frequencyChanged:', frequencyChanged);
          console.log('  durationChanged:', durationChanged);
          console.log('  routeChanged:', routeChanged);
          console.log('  instructionsChanged:', instructionsChanged);
          console.log('  drugNameChanged:', drugNameChanged);
          console.log('  hasEdits:', hasEdits);
          
          // Save to TEMPORARY drugs table (pending admin approval)
          // This happens REGARDLESS of whether changes were detected (fallback mechanism)
          const tempDrugData = {
            id: `temp-drug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            genericName: editedDose.drugName || selectedVariant.drug.genericName,
            tradeName: selectedVariant.drug.tradeName || [],
            strength: editedDose.strength || selectedVariant.drug.strength,
            route: editedDose.route || selectedVariant.drug.route || 'oral',
            category: selectedVariant.drug.category,
            stgReference: selectedVariant.drug.stgReference || '',
            contraindications: selectedVariant.drug.contraindications || [],
            pregnancyCategory: selectedVariant.drug.pregnancyCategory,
            warnings: selectedVariant.drug.warnings,
            createdByPharmacistId: String(user.id),
            status: 'pending' as const,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Save to local temp database (IndexedDB)
          console.log('Saving to local IndexedDB tempDrugs table:', tempDrugData);
          const tempDrugId = await db.tempDrugs.add(tempDrugData as any);
          console.log('✓ Saved to IndexedDB with ID:', tempDrugId);
          // Note: Syncing will happen automatically via sync service when internet is available

          // Create new temp dose regimen
          const tempRegimen = {
            id: `temp-regimen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tempDrugId: String(tempDrugId),
            drugId: selectedVariant.drug.id,
            ageGroup: selectedRegimen?.ageGroup || 'adult',
            doseMg: String(editedDose.doseMg || selectedRegimen?.doseMg || '0'),
            frequency: String(editedDose.frequency || selectedRegimen?.frequency || ''),
            duration: String(editedDose.duration || selectedRegimen?.duration || ''),
            maxDoseMgDay: selectedRegimen?.maxDoseMgDay || null,
            route: String(editedDose.route || selectedRegimen?.route || 'oral'),
            instructions: String(editedDose.instructions || selectedRegimen?.instructions || ''),
            createdByPharmacistId: String(user.id),
            status: 'pending' as const,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Save to local temp database (IndexedDB)
          console.log('Saving to local IndexedDB tempDrugRegimens table:', tempRegimen);
          const tempRegimenId = await db.tempDrugRegimens.add(tempRegimen as any);
          console.log('✓ Saved to IndexedDB with ID:', tempRegimenId);
          // Note: Syncing will happen automatically via sync service when internet is available

          console.log('=== TEMP SAVE COMPLETE ===');
          setSuccess(hasEdits ? 'Drug edits saved for admin review' : 'Dose saved for admin review');
        } catch (err) {
          console.error('Failed to save to temp tables:', err);
          setError(`Failed to save for review: ${String(err)}`);
          // Continue anyway - dispense record was already saved
        }
      }

      // Notify sync service
      syncService.refreshStatus();

      // Clear and reset
      setSearchQuery('');
      setSelectedVariant(null);
      setEditedDose(null);
      setSelectedRegimen(null);
      setError('');
      clearWorkflow();

      onComplete();
    } catch (err) {
      setError(`Failed to save record: ${String(err)}`);
      console.error('Save error:', err);
    } finally {
      setProcessingState('none');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {editedDose && (
          <button
            onClick={() => {
              setEditedDose(null);
              setSelectedVariant(null);
              setSelectedRegimen(null);
              setSearchQuery('');
            }}
            className="text-gray-400 hover:text-gray-600 ml-auto"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Drug Search - Full Width */}
      <div className="space-y-2">
        <div className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-1">Search Drug</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedVariant(null);
              setSelectedRegimen(null);
              setEditedDose(null);
            }}
            onFocus={() => regimenOptions.length > 0 && setShowDropdown(true)}
            placeholder="Type drug name (e.g., Amox)..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
          {loading && (
            <div className="absolute right-3 top-10">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && regimenOptions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="max-h-80 overflow-y-auto">
                {regimenOptions.map((option, idx) => {
                  const regimen = option.regimen;
                  const ageGroupLabel = regimen.ageGroup === 'pediatric' ? '(Pediatric)' : 
                                       regimen.ageGroup === 'neonatal' ? '(Neonatal)' : 
                                       regimen.ageGroup === 'geriatric' ? '(Geriatric)' : '(Adult)';
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectRegimen(option)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none"
                    >
                      <div className="font-semibold text-gray-900 text-sm">
                        {option.drug.genericName} {option.drug.strength}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {ageGroupLabel} • {regimen.frequency || 'N/A'} • {regimen.duration || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Route: {option.drug.route} • Dose: {regimen.doseMg || 'N/A'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {searchQuery && !loading && regimenOptions.length === 0 && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
              No drugs found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Edit Dose - Full Width */}
      {editedDose && selectedVariant && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Edit Dose</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left: Form Fields (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Drug Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Drug Name</label>
                  <input
                    type="text"
                    value={editedDose.drugName || ''}
                    onChange={(e) =>
                      setEditedDose({
                        ...editedDose,
                        drugName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Drug name..."
                  />
                </div>

                {/* Strength */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={editedDose.strength || ''}
                    onChange={(e) =>
                      setEditedDose({
                        ...editedDose,
                        strength: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>

                {/* Dose & Frequency */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Dose</label>
                    <input
                      type="number"
                      value={editedDose.doseMg || ''}
                      onChange={(e) =>
                        setEditedDose({
                          ...editedDose,
                          doseMg: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={editedDose.frequency || ''}
                      onChange={(e) =>
                        setEditedDose({
                          ...editedDose,
                          frequency: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="e.g., TDS"
                    />
                  </div>
                </div>

                {/* Route & Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Route</label>
                    <input
                      type="text"
                      value={editedDose.route || ''}
                      onChange={(e) =>
                        setEditedDose({
                          ...editedDose,
                          route: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={editedDose.duration || ''}
                      onChange={(e) =>
                        setEditedDose({
                          ...editedDose,
                          duration: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={editedDose.instructions || ''}
                    onChange={(e) =>
                      setEditedDose({
                        ...editedDose,
                        instructions: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={2}
                  />
                </div>

                {/* STG Citation */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">STG Ref</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900">
                    {editedDose.stgCitation}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Warnings (1/3 width) */}
            <div>
              {(editedDose.warnings?.length || 0) > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <div className="font-semibold text-yellow-900 text-sm mb-2">Warnings</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {editedDose.warnings?.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-yellow-800">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePrintOnly}
              disabled={processingState !== 'none'}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {processingState === 'printing' ? 'Printing...' : 'Print'}
            </button>
            <button
              onClick={handlePrintAndSave}
              disabled={processingState !== 'none'}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {processingState === 'saving' ? 'Saving...' : 'Print & Save'}
            </button>
          </div>
        </div>
      )}

      {/* Placeholder when no drug selected */}
      {!editedDose && (
        <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 font-medium">Select a drug to begin</p>
            <p className="text-sm text-gray-500 mt-1">Search for a drug above and select a dosage option</p>
          </div>
        </div>
      )}

      {/* Footer Button */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function getDeviceId(): string {
  const key = 'sems_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}



