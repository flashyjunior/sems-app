/**
 * DPAP Risk Scoring Engine
 * 
 * Calculates risk scores for dispensing events based on:
 * - Patient demographics (age group, weight, pregnancy)
 * - Drug characteristics (controlled, antibiotic, contraindications)
 * - Dispensing context (STG compliance, override flag)
 * 
 * Risk Score Range: 0-100
 * Categories: none (0-19), low (20-39), medium (40-59), high (60-79), critical (80+)
 */
/**
 * DPAP Risk Scoring Engine
 * 
 * Calculates risk scores for dispensing events based on:
 * - Patient demographics (age group, weight, pregnancy)
 * - Drug characteristics (controlled, antibiotic, contraindications)
 * - Dispensing context (STG compliance, override flag)
 * 
 * Risk Score Range: 0-100
 * Categories: none (0-19), low (20-39), medium (40-59), high (60-79), critical (80+)
 */

// Medical contraindication rules by drug ID and patient age group
const PAEDIATRIC_CONTRAINDICATIONS: Record<string, boolean> = {
  'STREP-1000': true,    // Streptomycin (ototoxic in children)
  'TETRA-500': true,     // Tetracycline (tooth discoloration)
  'CIPRO-500': true,     // Ciprofloxacin (cartilage damage risk)
  'ASPIRIN-325': true,   // Aspirin in fever/viral illness (Reye's syndrome risk)
  // Add more as needed from Ghana STG guidelines
};

const GERIATRIC_CONTRAINDICATIONS: Record<string, boolean> = {
  'DICLOF-50': true,     // Diclofenac (GI bleed risk in elderly)
  'METF-500': true,      // Metformin (renal impairment risk)
  'BENZO-2': true,       // Benzodiazepines (fall risk)
  'TRICYC-25': true,     // Tricyclic antidepressants (orthostatic hypotension)
  // Add more from Ghana guidelines
};

const PREGNANCY_CONTRAINDICATIONS: Record<string, boolean> = {
  'ACE-10': true,        // ACE inhibitors
  'WARFARIN-5': true,    // Warfarin
  'METHO-50': true,      // Methotrexate
  'TETRA-500': true,     // Tetracycline
  'CIPRO-500': true,     // Fluoroquinolones
};

export interface RiskScores {
  score: number;
  category: 'none' | 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
}

export interface EnrichedEvent {
  drugId: string;
  drugCode?: string;
  drugGenericName?: string;
  drugClass?: string; // e.g., 'antibiotic', 'controlled', 'nsaid'
  drugIsControlled: boolean;
  drugIsAntibiotic: boolean;
  patientAgeGroup: 'paediatric' | 'adult' | 'geriatric';
  patientWeightKg?: number;
  patientIsPregnant?: boolean;
  isPrescription: boolean;
  stgCompliant: boolean;
  overrideFlag: boolean;
  overrideReason?: string;
}

/**
 * Main risk scoring function
 * Evaluates multiple risk factors and returns overall score and category
 */
export function calculateRiskScores(event: EnrichedEvent): RiskScores {
  let riskScore = 0;
  const flags: string[] = [];

  // ============================================
  // 1. PAEDIATRIC RISK (Ages 0-12 years)
  // ============================================
  if (event.patientAgeGroup === 'paediatric') {
    riskScore += 30;
    flags.push('PAEDIATRIC_DOSING');

    // Contraindication in children
    if (event.drugId in PAEDIATRIC_CONTRAINDICATIONS) {
      riskScore += 40;
      flags.push('PAEDS_CONTRAINDICATION');
    }

    // Very low weight (neonates < 5kg)
    if (event.patientWeightKg && event.patientWeightKg < 5) {
      riskScore += 20;
      flags.push('VERY_LOW_WEIGHT_NEONATAL');
    }

    // Suspension/liquid formulation considerations
    // (higher error risk due to concentration variability)
    if (event.drugClass === 'suspension' || event.drugCode?.includes('SUSP')) {
      riskScore += 10;
      flags.push('LIQUID_FORMULATION_RISK');
    }
  }

  // ============================================
  // 2. GERIATRIC RISK (Ages 65+ years)
  // ============================================
  else if (event.patientAgeGroup === 'geriatric') {
    riskScore += 20;
    flags.push('GERIATRIC_DOSING');

    // Contraindication in elderly
    if (event.drugId in GERIATRIC_CONTRAINDICATIONS) {
      riskScore += 30;
      flags.push('GERIATRIC_CONTRAINDICATION');
    }

    // Polypharmacy consideration
    // (would need patient med history - flagged for AI)
    // TODO: Check against patient's other medications
  }

  // ============================================
  // 3. CONTROLLED SUBSTANCE RISK
  // ============================================
  if (event.drugIsControlled) {
    riskScore += 25;
    flags.push('CONTROLLED_SUBSTANCE');
  }

  // ============================================
  // 4. STG DEVIATION RISK
  // ============================================
  if (!event.stgCompliant) {
    riskScore += 35;
    flags.push('STG_DEVIATION');

    // Provide reason if available
    if (event.overrideReason) {
      flags.push(`OVERRIDE_REASON: ${event.overrideReason}`);
    }
  }

  // ============================================
  // 5. USER OVERRIDE FLAG
  // ============================================
  if (event.overrideFlag) {
    riskScore += 20;
    flags.push('USER_OVERRIDE');
  }

  // ============================================
  // 6. ANTIBIOTIC CONSIDERATIONS
  // ============================================
  if (event.drugIsAntibiotic) {
    // Antibiotic without clinical indication
    // (would require indication code - flagged for future)
    // This is important for antibiotic stewardship
    // TODO: Validate antibiotic has indication

    // For now, just flag all antibiotics for stewardship tracking
    flags.push('ANTIBIOTIC_STEWARDSHIP_FLAG');
  }

  // ============================================
  // 7. PREGNANCY RISK
  // ============================================
  if (event.patientIsPregnant) {
    riskScore += 15;
    flags.push('PREGNANT_PATIENT');

    // Contraindication in pregnancy
    if (event.drugId in PREGNANCY_CONTRAINDICATIONS) {
      riskScore += 40;
      flags.push('PREGNANCY_CONTRAINDICATION');
    }
  }

  // ============================================
  // 8. COMBINING MULTIPLE RISK FACTORS
  // ============================================
  // Paediatric + antibiotic = higher risk (resistance concerns, stewardship)
  if (event.patientAgeGroup === 'paediatric' && event.drugIsAntibiotic) {
    riskScore += 10;
    flags.push('PAEDS_ANTIBIOTIC_COMBO');
  }

  // Geriatric + multiple comorbidities proxy
  // (increase risk for controlled substances in elderly)
  if (event.patientAgeGroup === 'geriatric' && event.drugIsControlled) {
    riskScore += 15;
    flags.push('GERIATRIC_CONTROLLED_COMBO');
  }

  // ============================================
  // CALCULATE FINAL CATEGORY
  // ============================================
  const category: RiskScores['category'] =
    riskScore >= 80
      ? 'critical'
      : riskScore >= 60
      ? 'high'
      : riskScore >= 40
      ? 'medium'
      : riskScore >= 20
      ? 'low'
      : 'none';

  return {
    score: riskScore,
    category,
    flags,
  };
}

/**
 * Check if a drug is commonly contraindicated in a demographic
 */
export function hasContraindication(
  drugId: string,
  ageGroup: 'paediatric' | 'adult' | 'geriatric',
  isPregnant: boolean = false
): boolean {
  if (ageGroup === 'paediatric' && drugId in PAEDIATRIC_CONTRAINDICATIONS) {
    return true;
  }

  if (ageGroup === 'geriatric' && drugId in GERIATRIC_CONTRAINDICATIONS) {
    return true;
  }

  if (isPregnant && drugId in PREGNANCY_CONTRAINDICATIONS) {
    return true;
  }

  return false;
}

/**
 * Get human-readable risk description
 */
export function getRiskDescription(category: RiskScores['category']): string {
  const descriptions: Record<string, string> = {
    none: 'No identified risk factors',
    low: 'Low risk - monitoring recommended',
    medium: 'Medium risk - clinical review suggested',
    high: 'High risk - pharmacist review required',
    critical: 'CRITICAL risk - immediate intervention needed',
  };

  return descriptions[category] || 'Unknown risk category';
}

/**
 * Get risk level color for UI display
 */
export function getRiskColor(category: RiskScores['category']): string {
  const colors: Record<string, string> = {
    none: '#10b981',    // Green
    low: '#3b82f6',     // Blue
    medium: '#f59e0b',  // Amber
    high: '#ef4444',    // Red
    critical: '#7f1d1d', // Dark red
  };

  return colors[category] || '#6b7280';
}
