/**
 * DPAP Event Enricher
 * 
 * Enriches raw dispensing events with master data from the database:
 * - Drug classifications (antibiotic, controlled, etc.)
 * - Drug codes and generic names
 * - Contraindications
 * - Standard Treatment Guidelines (STG) compliance
 */

import { DispensingEventInput } from './eventProcessor';
import { EnrichedEvent } from './riskScoringEngine';
// Note: This module is server-side only and relies on Prisma. Do not import it into client bundles.
import prisma from '@/lib/prisma';
import { logWarn, logInfo } from '@/lib/logger';

/**
 * Drug master data interface
 */
export interface DrugMaster {
  id: string;
  code: string;
  genericName: string;
  brandNames: string[];
  class: string; // e.g., 'antibiotic', 'nsaid', 'controlled'
  isControlled: boolean;
  isAntibiotic: boolean;
  contraindications: {
    paediatric: boolean;
    geriatric: boolean;
    pregnancy: boolean;
  };
  stgCriteria?: {
    contraindicated: boolean;
    requiresIndication: boolean;
  };
}

/**
 * Mock drug database - In production, this would be loaded from PostgreSQL
 */
const drugDatabase: Record<string, DrugMaster> = {
  'AMOX-500': {
    id: 'AMOX-500',
    code: 'AMOX-500',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Polymox'],
    class: 'antibiotic',
    isControlled: false,
    isAntibiotic: true,
    contraindications: {
      paediatric: false,
      geriatric: false,
      pregnancy: false,
    },
    stgCriteria: {
      contraindicated: false,
      requiresIndication: true,
    },
  },
  'PARA-500': {
    id: 'PARA-500',
    code: 'PARA-500',
    genericName: 'Paracetamol',
    brandNames: ['Panadol', 'Tylenol'],
    class: 'analgesic',
    isControlled: false,
    isAntibiotic: false,
    contraindications: {
      paediatric: false,
      geriatric: false,
      pregnancy: false,
    },
  },
  'METF-500': {
    id: 'METF-500',
    code: 'METF-500',
    genericName: 'Metformin',
    brandNames: ['Glucophage'],
    class: 'antidiabetic',
    isControlled: false,
    isAntibiotic: false,
    contraindications: {
      paediatric: true,
      geriatric: true,
      pregnancy: false,
    },
    stgCriteria: {
      contraindicated: false,
      requiresIndication: false,
    },
  },
  'CIPRO-500': {
    id: 'CIPRO-500',
    code: 'CIPRO-500',
    genericName: 'Ciprofloxacin',
    brandNames: ['Ciprobay'],
    class: 'antibiotic',
    isControlled: false,
    isAntibiotic: true,
    contraindications: {
      paediatric: true,
      geriatric: false,
      pregnancy: true,
    },
    stgCriteria: {
      contraindicated: false,
      requiresIndication: true,
    },
  },
  'ART-200': {
    id: 'ART-200',
    code: 'ART-200',
    genericName: 'Artesunate',
    brandNames: ['Arlunam'],
    class: 'antimalarial',
    isControlled: false,
    isAntibiotic: false,
    contraindications: {
      paediatric: false,
      geriatric: false,
      pregnancy: false,
    },
  },
  'MORPHINE-10': {
    id: 'MORPHINE-10',
    code: 'MORPHINE-10',
    genericName: 'Morphine',
    brandNames: ['MS Contin'],
    class: 'opioid',
    isControlled: true,
    isAntibiotic: false,
    contraindications: {
      paediatric: true,
      geriatric: true,
      pregnancy: true,
    },
    stgCriteria: {
      contraindicated: false,
      requiresIndication: true,
    },
  },
};

/**
 * Enrich raw event with drug master data
 */
export async function enrichEvent(
  input: DispensingEventInput
): Promise<Partial<EnrichedEvent>> {
  const drug = await getDrugMaster(input.drugId);

  if (!drug) {
    console.warn(`[DPAP] Drug not found in master data: ${input.drugId}`);
    // Return minimal enrichment if drug not found
    return {
      drugId: input.drugId,
      drugClass: 'unknown',
      drugIsControlled: input.isControlledDrug ?? false,
      drugIsAntibiotic: false,
    };
  }

  return {
    drugId: drug.id,
    drugCode: drug.code,
    drugGenericName: drug.genericName,
    drugClass: drug.class,
    drugIsControlled: drug.isControlled,
    drugIsAntibiotic: drug.isAntibiotic,
  };
}

/**
 * Get drug from master database
 * In production, this would query PostgreSQL
 */
async function getDrugMaster(drugId: string, createdByUserId?: number): Promise<DrugMaster | null> {
  // Try to find by primary id
  try {
    const found = await prisma.drug.findUnique({ where: { id: drugId } });
    if (found) {
      return mapPrismaDrugToMaster(found);
    }

    // Try to find by genericName or tradeName contains
    const byName = await prisma.drug.findFirst({
      where: {
        OR: [
          { genericName: { contains: drugId, mode: 'insensitive' } },
          { tradeName: { has: drugId } },
        ],
      },
    });

    if (byName) return mapPrismaDrugToMaster(byName);

    // Not found - attempt to classify and auto-create a minimal Drug master
    logWarn('Auto-creating minimal Drug master for missing drug', { drugId });

    // Basic heuristics to infer category / antibiotic / controlled
    const heur = classifyDrug(drugId);

    const minimal = await prisma.drug.create({
      data: {
        genericName: drugId,
        tradeName: [],
        strength: '',
        route: 'oral',
        category: heur.category,
        stgReference: null,
        contraindications: [],
        pregnancyCategory: null,
        warnings: [],
      },
    });

    // Also create a TempDrug entry for admin review
    try {
      await prisma.tempDrug.create({
        data: {
          genericName: drugId,
          tradeName: [],
          strength: '',
          route: 'oral',
          category: 'unknown',
          stgReference: null,
          contraindications: [],
          pregnancyCategory: null,
          warnings: [],
          createdByPharmacistId: createdByUserId ? String(createdByUserId) : undefined,
          status: 'pending',
        },
      });
      logInfo('Queued TempDrug for review', { genericName: drugId });
    } catch (e) {
      logWarn('Failed to create TempDrug review item', { error: String(e), drugId });
    }

    // Map and attach heuristics
    const mapped = mapPrismaDrugToMaster(minimal);
    mapped.isAntibiotic = heur.isAntibiotic;
    mapped.isControlled = heur.isControlled;
    return mapped;
  } catch (error) {
    logWarn('Error fetching or creating drug master', { drugId, error: String(error) });
    return null;
  }
}

/**
 * Very small heuristics to guess drug classification from identifier/name
 */
function classifyDrug(name: string): { isAntibiotic: boolean; isControlled: boolean; category: string } {
  const lower = name.toLowerCase();
  let isAntibiotic = false;
  let isControlled = false;
  let category = 'unknown';

  const antibioticKeywords = ['cillin', 'cin', 'floxacin', 'azole', 'mycin', 'cef'];
  const controlledKeywords = ['morph', 'oxycod', 'fent', 'methad', 'codein', 'opioid'];

  for (const k of antibioticKeywords) if (lower.includes(k)) isAntibiotic = true;
  for (const k of controlledKeywords) if (lower.includes(k)) isControlled = true;

  if (isAntibiotic) category = 'antibiotic';
  if (isControlled) category = 'opioid';

  return { isAntibiotic, isControlled, category };
}

function mapPrismaDrugToMaster(d: any): DrugMaster {
  return {
    id: d.id,
    code: d.id,
    genericName: d.genericName,
    brandNames: Array.isArray(d.tradeName) ? d.tradeName : [],
    class: d.category || 'unknown',
    isControlled: false,
    isAntibiotic: false,
    contraindications: {
      paediatric: false,
      geriatric: false,
      pregnancy: false,
    },
    stgCriteria: undefined,
  } as DrugMaster;
}

/**
 * Check if dispensing follows STG guidelines
 */
export async function checkSTGCompliance(
  drugId: string,
  ageGroup: 'paediatric' | 'adult' | 'geriatric',
  isPregnant: boolean = false
): Promise<boolean> {
  const drug = await getDrugMaster(drugId);

  if (!drug) {
    // Cannot verify STG compliance without drug data
    return false;
  }

  // Check contraindications
  if (
    (ageGroup === 'paediatric' && drug.contraindications.paediatric) ||
    (ageGroup === 'geriatric' && drug.contraindications.geriatric) ||
    (isPregnant && drug.contraindications.pregnancy)
  ) {
    return false;
  }

  // TODO: Check for required indication (antibiotic stewardship)
  // This would require indication code passed from form

  return true;
}

/**
 * Get contraindication warnings for a drug + patient combination
 */
export async function getContraindicationWarnings(
  drugId: string,
  ageGroup: 'paediatric' | 'adult' | 'geriatric',
  isPregnant: boolean = false
): Promise<string[]> {
  const warnings: string[] = [];
  const drug = await getDrugMaster(drugId);

  if (!drug) {
    return warnings;
  }

  if (ageGroup === 'paediatric' && drug.contraindications.paediatric) {
    warnings.push(`WARNING: ${drug.genericName} is contraindicated in children`);
  }

  if (ageGroup === 'geriatric' && drug.contraindications.geriatric) {
    warnings.push(`WARNING: ${drug.genericName} is contraindicated in elderly patients`);
  }

  if (isPregnant && drug.contraindications.pregnancy) {
    warnings.push(`WARNING: ${drug.genericName} is contraindicated in pregnancy`);
  }

  if (drug.stgCriteria?.requiresIndication && drug.isAntibiotic) {
    warnings.push(`STEWARDSHIP: Antibiotic use should be indicated`);
  }

  return warnings;
}

/**
 * Get alternative drugs for a given drug + condition
 * Useful for suggesting STG-compliant alternatives
 */
export async function getSuggestedAlternatives(
  drugId: string,
  ageGroup: 'paediatric' | 'adult' | 'geriatric'
): Promise<DrugMaster[]> {
  const drug = await getDrugMaster(drugId);

  if (!drug) {
    return [];
  }

  // Find drugs in same class without contraindications
  const alternatives = Object.values(drugDatabase).filter(
    (d) =>
      d.class === drug.class &&
      d.id !== drug.id &&
      !getContraindications(d, ageGroup).hasConcern
  );

  return alternatives;
}

/**
 * Helper to check contraindications for a drug/age combo
 */
function getContraindications(
  drug: DrugMaster,
  ageGroup: 'paediatric' | 'adult' | 'geriatric'
): {
  hasConcern: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (ageGroup === 'paediatric' && drug.contraindications.paediatric) {
    reasons.push('Contraindicated in children');
  }

  if (ageGroup === 'geriatric' && drug.contraindications.geriatric) {
    reasons.push('Contraindicated in elderly');
  }

  return {
    hasConcern: reasons.length > 0,
    reasons,
  };
}

/**
 * Get all drugs in a class (for grouping/statistics)
 */
export async function getDrugsByClass(drugClass: string): Promise<DrugMaster[]> {
  return Object.values(drugDatabase).filter((d) => d.class === drugClass);
}

/**
 * Search drugs by name or code
 */
export async function searchDrugs(query: string): Promise<DrugMaster[]> {
  const lowerQuery = query.toLowerCase();

  return Object.values(drugDatabase).filter(
    (d) =>
      d.code.toLowerCase().includes(lowerQuery) ||
      d.genericName.toLowerCase().includes(lowerQuery) ||
      d.brandNames.some((b) => b.toLowerCase().includes(lowerQuery))
  );
}
