import Fuse from 'fuse.js';
import { db } from '@/lib/db';
import type { Drug } from '@/types';

export class SearchService {
  private fuse: Fuse<Drug> | null = null;

  async initialize() {
    const drugs = await db.drugs.toArray();
    this.fuse = new Fuse(drugs, {
      keys: ['genericName', 'tradeName', 'category'],
      threshold: 0.3, // Allow typos
      includeScore: true,
    });
  }

  async searchDrugs(query: string): Promise<Drug[]> {
    if (!this.fuse) await this.initialize();

    if (!query.trim()) {
      return db.drugs.toArray();
    }

    const results = this.fuse!.search(query);
    return results.map((result) => result.item);
  }

  async searchByCondition(condition: string): Promise<Drug[]> {
    // Search drugs where condition matches category or STG reference
    const drugs = await db.drugs
      .filter(
        (drug) =>
          drug.category?.toLowerCase().includes(condition.toLowerCase()) ||
          drug.stgReference
            ?.toLowerCase()
            .includes(condition.toLowerCase())
      )
      .toArray();
    return drugs;
  }

  async getDrugDetails(drugId: string) {
    const drug = await db.drugs.get(drugId);
    if (!drug) return null;

    const regimens = await db.doseRegimens
      .where('drugId')
      .equals(drugId)
      .toArray();

    return {
      drug,
      regimens,
    };
  }

  async groupDrugsByCategory(): Promise<Record<string, Drug[]>> {
    const drugs = await db.drugs.toArray();
    const grouped: Record<string, Drug[]> = {};

    drugs.forEach((drug) => {
      const category = drug.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(drug);
    });

    return grouped;
  }
}

export const searchService = new SearchService();
