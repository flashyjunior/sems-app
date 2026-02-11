/**
 * DPAP Risk Scoring Engine - Test Suite
 * 
 * Example test cases demonstrating risk calculation for various scenarios
 * Run with: npm test -- riskScoringEngine.test.ts
 */

import {
  calculateRiskScores,
  hasContraindication,
  getRiskDescription,
  getRiskColor,
} from '../riskScoringEngine';

describe('Risk Scoring Engine', () => {
  describe('Paediatric Risk Scenarios', () => {
    test('should flag paediatric dosing', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'paediatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThanOrEqual(30);
      expect(scores.category).toBe('low'); // Just paediatric + antibiotic
      expect(scores.flags).toContain('PAEDIATRIC_DOSING');
    });

    test('should return high risk for paediatric with contraindication', () => {
      const event = {
        drugId: 'CIPRO-500', // Contraindicated in children
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'paediatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThan(60);
      expect(scores.category).toBe('high');
      expect(scores.flags).toContain('PAEDS_CONTRAINDICATION');
    });

    test('should flag very low weight in neonates', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'paediatric' as const,
        patientWeightKg: 3.5, // Neonatal weight
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.flags).toContain('VERY_LOW_WEIGHT_NEONATAL');
      expect(scores.score).toBeGreaterThan(40);
    });
  });

  describe('Geriatric Risk Scenarios', () => {
    test('should flag geriatric dosing', () => {
      const event = {
        drugId: 'METF-500',
        drugIsControlled: false,
        drugIsAntibiotic: false,
        patientAgeGroup: 'geriatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThanOrEqual(20);
      expect(scores.flags).toContain('GERIATRIC_DOSING');
    });

    test('should return high risk for geriatric with contraindication', () => {
      const event = {
        drugId: 'DICLOF-50', // Contraindicated in elderly
        drugIsControlled: false,
        drugIsAntibiotic: false,
        patientAgeGroup: 'geriatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.category).toBe('high');
      expect(scores.flags).toContain('GERIATRIC_CONTRAINDICATION');
    });

    test('should increase risk for elderly on controlled drugs', () => {
      const event = {
        drugId: 'MORPHINE-10', // Controlled + risky in elderly
        drugIsControlled: true,
        drugIsAntibiotic: false,
        patientAgeGroup: 'geriatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThan(50);
      expect(scores.category).toBeOneOf(['high', 'critical']);
      expect(scores.flags).toContain('GERIATRIC_CONTROLLED_COMBO');
    });
  });

  describe('Controlled Substance Risk', () => {
    test('should flag controlled medicines', () => {
      const event = {
        drugId: 'MORPHINE-10',
        drugIsControlled: true,
        drugIsAntibiotic: false,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThanOrEqual(25);
      expect(scores.flags).toContain('CONTROLLED_SUBSTANCE');
    });
  });

  describe('STG Compliance Risk', () => {
    test('should heavily penalize STG deviations', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: false, // NOT compliant
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThanOrEqual(35);
      expect(scores.flags).toContain('STG_DEVIATION');
    });

    test('should include override reason in flags', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: false,
        overrideFlag: true,
        overrideReason: 'Patient allergy to standard treatment',
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThan(50);
      expect(scores.flags).toContain('STG_DEVIATION');
      expect(scores.flags).toContain('USER_OVERRIDE');
    });
  });

  describe('Pregnancy Risk', () => {
    test('should flag pregnancy contraindications', () => {
      const event = {
        drugId: 'TETRA-500', // Contraindicated in pregnancy
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: true,
        isPrescription: true,
        stgCompliant: false,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThan(60);
      expect(scores.category).toBeOneOf(['high', 'critical']);
      expect(scores.flags).toContain('PREGNANCY_CONTRAINDICATION');
    });
  });

  describe('Combined Risk Factors', () => {
    test('should return critical for multiple high-risk factors', () => {
      const event = {
        drugId: 'MORPHINE-10', // Controlled + contraindicated
        drugIsControlled: true,
        drugIsAntibiotic: false,
        patientAgeGroup: 'paediatric' as const,
        patientWeightKg: 2.5, // Very low weight
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: false,
        overrideFlag: true,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeGreaterThanOrEqual(80);
      expect(scores.category).toBe('critical');
      expect(scores.flags.length).toBeGreaterThan(4);
    });

    test('should calculate low risk for safe dispensing', () => {
      const event = {
        drugId: 'PARA-500', // Common, safe drug
        drugIsControlled: false,
        drugIsAntibiotic: false,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: false,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.score).toBeLessThan(20);
      expect(scores.category).toBe('none');
      expect(scores.flags.length).toBe(0);
    });
  });

  describe('Antibiotic Stewardship', () => {
    test('should flag antibiotics', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.flags).toContain('ANTIBIOTIC_STEWARDSHIP_FLAG');
    });

    test('should increase risk for paediatric antibiotics', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'paediatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);

      expect(scores.flags).toContain('PAEDS_ANTIBIOTIC_COMBO');
      expect(scores.score).toBeGreaterThan(30);
    });
  });

  describe('Risk Categories', () => {
    test('should categorize as none for score < 20', () => {
      const event = {
        drugId: 'PARA-500',
        drugIsControlled: false,
        drugIsAntibiotic: false,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: false,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);
      expect(scores.category).toBe('none');
    });

    test('should categorize as low for score 20-39', () => {
      const event = {
        drugId: 'METF-500',
        drugIsControlled: false,
        drugIsAntibiotic: false,
        patientAgeGroup: 'geriatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);
      expect(scores.category).toBe('low');
    });

    test('should categorize as medium for score 40-59', () => {
      const event = {
        drugId: 'AMOX-500',
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'adult' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: false,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);
      expect(scores.score).toBeGreaterThanOrEqual(40);
      expect(scores.score).toBeLessThan(60);
      expect(scores.category).toBe('medium');
    });

    test('should categorize as high for score 60-79', () => {
      const event = {
        drugId: 'CIPRO-500', // Contraindicated in paediatric
        drugIsControlled: false,
        drugIsAntibiotic: true,
        patientAgeGroup: 'paediatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: true,
        overrideFlag: false,
      };

      const scores = calculateRiskScores(event);
      expect(scores.score).toBeGreaterThanOrEqual(60);
      expect(scores.score).toBeLessThan(80);
      expect(scores.category).toBe('high');
    });

    test('should categorize as critical for score >= 80', () => {
      const event = {
        drugId: 'MORPHINE-10',
        drugIsControlled: true,
        drugIsAntibiotic: false,
        patientAgeGroup: 'paediatric' as const,
        patientIsPregnant: false,
        isPrescription: true,
        stgCompliant: false,
        overrideFlag: true,
      };

      const scores = calculateRiskScores(event);
      expect(scores.score).toBeGreaterThanOrEqual(80);
      expect(scores.category).toBe('critical');
    });
  });

  describe('Helper Functions', () => {
    test('hasContraindication should detect paediatric contraindications', () => {
      expect(hasContraindication('CIPRO-500', 'paediatric', false)).toBe(true);
      expect(hasContraindication('AMOX-500', 'paediatric', false)).toBe(false);
    });

    test('hasContraindication should detect geriatric contraindications', () => {
      expect(hasContraindication('METF-500', 'geriatric', false)).toBe(true);
      expect(hasContraindication('PARA-500', 'geriatric', false)).toBe(false);
    });

    test('hasContraindication should detect pregnancy contraindications', () => {
      expect(hasContraindication('WARFARIN-5', 'adult', true)).toBe(true);
      expect(hasContraindication('PARA-500', 'adult', true)).toBe(false);
    });

    test('getRiskDescription should return appropriate descriptions', () => {
      expect(getRiskDescription('none')).toContain('No identified risk');
      expect(getRiskDescription('critical')).toContain('CRITICAL');
    });

    test('getRiskColor should return color codes', () => {
      expect(getRiskColor('none')).toBe('#10b981'); // Green
      expect(getRiskColor('critical')).toBe('#7f1d1d'); // Dark red
    });
  });
});

// Helper for test assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        `expected ${received} to be one of ${expected.join(', ')}`,
    };
  },
});
