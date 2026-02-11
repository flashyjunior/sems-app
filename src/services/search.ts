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
    if (!query.trim()) {
      return db.drugs.toArray();
    }

    try {
      // First, search local IndexedDB
      if (!this.fuse) await this.initialize();
      const localResults = this.fuse!.search(query).map((result) => result.item);

      // Then, also search backend API for drugs that might not be synced locally
      const backendResults = await this.searchBackendDrugs(query);

      // Combine results, removing duplicates
      const allResults = [...localResults];
      const localIds = new Set(localResults.map(d => d.id));
      
      for (const drug of backendResults) {
        if (!localIds.has(drug.id)) {
          allResults.push(drug);
        }
      }

      return allResults;
    } catch (error) {
      console.error('[SearchService] Error searching drugs:', error);
      // Fallback to local search only
      if (!this.fuse) await this.initialize();
      return this.fuse!.search(query).map((result) => result.item);
    }
  }

  private async searchBackendDrugs(query: string): Promise<Drug[]> {
    try {
      const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/api/drugs`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (!response.ok) {
        console.warn('[SearchService] Failed to fetch drugs from backend:', response.status);
        return [];
      }

      const data = await response.json();
      const allDrugs = data.data || data;

      // Filter drugs based on query
      const queryLower = query.toLowerCase();
      return allDrugs.filter(
        (drug: Drug) =>
          drug.genericName?.toLowerCase().includes(queryLower) ||
          drug.tradeName?.some((name: string) => name.toLowerCase().includes(queryLower)) ||
          drug.category?.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('[SearchService] Error searching backend drugs:', error);
      return [];
    }
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
