'use client';

import { useAppStore } from '@/store/app';
import { printService } from '@/services/print';
import { db, addDispenseRecord } from '@/lib/db';
import type { DispenseRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function completDispense() {
  const user = useAppStore.getState().user;
  const currentPatient = useAppStore.getState().currentPatient;
  const currentDose = useAppStore.getState().currentDose;
  const clearWorkflow = useAppStore.getState().clearWorkflow;

  if (!user || !currentPatient || !currentDose) {
    throw new Error('Incomplete dispense data');
  }

  try {
    // Print label
    const printSuccess = await printService.printLabel(
      currentDose,
      currentPatient,
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
      patientName: currentPatient.name,
      patientAge: currentPatient.age,
      patientWeight: currentPatient.weight,
      drugId: currentDose.drugId,
      drugName: currentDose.drugName,
      dose: currentDose,
      safetyAcknowledgements: [],
      printedAt: printSuccess ? Date.now() : undefined,
      synced: false,
      deviceId: getDeviceId(),
      auditLog: [
        {
          timestamp: Date.now(),
          action: 'dispense_recorded',
          actor: user.id,
          details: { drugId: currentDose.drugId },
        },
      ],
    };

    // Save to local database
    await addDispenseRecord(record);

    // Add to recent dispenses
    const addRecentDispense = useAppStore.getState().addRecentDispense;
    addRecentDispense(record);

    // Clear workflow for next dispense
    clearWorkflow();

    return record;
  } catch (error) {
    console.error('Failed to complete dispense:', error);
    throw error;
  }
}

function getDeviceId(): string {
  const key = 'sems_device_id';
  let deviceId = localStorage.getItem(key);

  if (!deviceId) {
    // Generate unique device ID on first run
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }

  return deviceId;
}
