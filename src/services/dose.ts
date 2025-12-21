import { db } from '@/lib/db';
import type {
  Drug,
  DoseRegimen,
  PatientInput,
  DoseCalculation,
} from '@/types';

export class DoseCalculationService {
  async calculateDose(
    drugId: string,
    patient: PatientInput
  ): Promise<DoseCalculation | null> {
    try {
      const drug = await db.drugs.get(drugId);
      if (!drug) throw new Error('Drug not found');

      const regimen = await this.findApplicableRegimen(
        drugId,
        patient.age,
        patient.weight
      );

      if (!regimen) {
        throw new Error(
          `No applicable dosing regimen found for ${drug.genericName} ` +
          `(age: ${patient.age}y, weight: ${patient.weight}kg). ` +
          `Database may not be initialized or patient parameters fall outside defined ranges.`
        );
      }

      // Parse dose expression
      const doseMg = this.parseDoseExpression(regimen.doseMg, patient.weight);

      // Check max daily dose
      this.validateMaxDose(doseMg, regimen.maxDoseMgDay, patient.weight);

      // Check contraindications and warnings
      const warnings = this.checkWarnings(drug, patient);

      return {
        drugId: drug.id,
        drugName: drug.genericName,
        strength: drug.strength,
        doseMg,
        frequency: regimen.frequency,
        duration: regimen.duration,
        route: drug.route,
        instructions: regimen.instructions || '',
        stgCitation: `STG ${drug.stgReference}`,
        warnings,
        requiresPinConfirm: warnings.length > 0 || this.isHighRiskDrug(drug),
      };
    } catch (error) {
      console.error('Dose calculation failed:', error);
      return null;
    }
  }

  private async findApplicableRegimen(
    drugId: string,
    age: number,
    weight: number
  ): Promise<DoseRegimen | null> {
    const regimens = await db.doseRegimens
      .where('drugId')
      .equals(drugId)
      .toArray();

    if (!regimens.length) {
      console.warn(
        `No dosing regimens found for drug ${drugId}. Database may not be initialized.`
      );
      return null;
    }

    // Find best match by age and weight
    const matched = regimens.find((r) => {
      const ageOk =
        (!r.ageMin || age >= r.ageMin) && (!r.ageMax || age <= r.ageMax);
      const weightOk =
        (!r.weightMin || weight >= r.weightMin) &&
        (!r.weightMax || weight <= r.weightMax);
      return ageOk && weightOk;
    });

    if (!matched) {
      console.warn(
        `No regimen matches patient: age=${age}, weight=${weight}kg for drug ${drugId}. ` +
        `Available regimens: ${regimens.map((r) => `[age:${r.ageMin}-${r.ageMax}, weight:${r.weightMin}-${r.weightMax}]`).join(', ')}`
      );
    }

    return matched || null;
  }

  private parseDoseExpression(expression: string, weight: number): number {
    // Parse expressions like "5 mg/kg", "10-20 mg", "500 mg"
    const mgPerKgMatch = expression.match(/(\d+(?:\.\d+)?)\s*mg\/kg/i);
    if (mgPerKgMatch) {
      return parseFloat(mgPerKgMatch[1]) * weight;
    }

    const fixedDoseMatch = expression.match(/(\d+(?:\.\d+)?)\s*mg/i);
    if (fixedDoseMatch) {
      return parseFloat(fixedDoseMatch[1]);
    }

    return 0;
  }

  private validateMaxDose(
    doseMg: number,
    maxDayExpression: string | undefined,
    weight: number
  ): void {
    if (!maxDayExpression) return;

    const maxMg = this.parseDoseExpression(maxDayExpression, weight);
    if (doseMg > maxMg) {
      console.warn(`Calculated dose ${doseMg}mg exceeds max ${maxMg}mg`);
    }
  }

  private checkWarnings(drug: Drug, patient: PatientInput): string[] {
    const warnings: string[] = [];

    // Check age contraindications
    if (drug.contraindications?.length) {
      warnings.push(...drug.contraindications);
    }

    // Check pregnancy status
    if (
      patient.pregnancyStatus === 'yes' &&
      (drug.pregnancyCategory === 'D' || drug.pregnancyCategory === 'X')
    ) {
      warnings.push(
        `Contraindicated in pregnancy (Category ${drug.pregnancyCategory})`
      );
    }

    // Check allergies
    if (patient.allergies?.length && drug.warnings) {
      const allergyWarnings = drug.warnings.filter((w) =>
        patient.allergies.some((a) => w.toLowerCase().includes(a.toLowerCase()))
      );
      warnings.push(...allergyWarnings);
    }

    return warnings;
  }

  private isHighRiskDrug(drug: Drug): boolean {
    const highRiskKeywords = [
      'anticoagulant',
      'insulin',
      'chemotherapy',
      'immunosuppressant',
    ];
    return highRiskKeywords.some((keyword) =>
      drug.category?.toLowerCase().includes(keyword)
    );
  }
}

export const doseCalculationService = new DoseCalculationService();
