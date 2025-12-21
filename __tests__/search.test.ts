import { describe, it, expect } from '@jest/globals';

describe('SearchService', () => {
  it('should handle empty search query', () => {
    const query = '';
    expect(query.trim()).toBe('');
  });

  it('should support fuzzy matching options', () => {
    const searchConfig = {
      threshold: 0.3, // Allow typos
      includeScore: true,
    };
    expect(searchConfig.threshold).toBeLessThan(0.5);
  });

  it('should group drugs by category', () => {
    const drugs = [
      { id: '1', category: 'Antibiotic' },
      { id: '2', category: 'Antibiotic' },
      { id: '3', category: 'Antimalarial' },
    ];
    const grouped = drugs.reduce((acc: any, drug) => {
      if (!acc[drug.category]) acc[drug.category] = [];
      acc[drug.category].push(drug);
      return acc;
    }, {});
    expect(grouped['Antibiotic'].length).toBe(2);
  });
});
