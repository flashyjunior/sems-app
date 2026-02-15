import 'dotenv/config';
import { processDispensingEvent } from '../src/services/analytics/serverProcessor.ts';

async function main(){
  try{
    const payload = {
      dispenseRecordId: 'test-dispense-1770894385584',
      timestamp: new Date().toISOString(),
      pharmacyId: '1',
      userId: 1,
      drugId: 'drug-001',
      drugName: 'Paracetamol',
      genericName: 'Paracetamol',
      patientAgeGroup: 'adult',
      isPrescription: true,
      isControlledDrug: false,
      isAntibiotic: false,
      stgCompliant: true,
      overrideFlag: false,
      patientIsPregnant: false,
    } as any;

    const res = await processDispensingEvent(payload);
    console.log('created event:', res);
    process.exit(0);
  }catch(e){
    console.error('error', e);
    process.exit(1);
  }
}

main();
