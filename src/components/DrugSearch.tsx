'use client';

import { useState, useEffect } from 'react';
import { searchService } from '@/services/search';
import type { Drug } from '@/types';

interface DrugSearchProps {
  onSelect: (drug: Drug) => void;
}

export function DrugSearch({ onSelect }: DrugSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const drugs = await searchService.searchDrugs(query);
        setResults(drugs.slice(0, 10)); // Limit to 10 results
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Drug
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Drug name, trade name, or condition..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
          {results.map((drug) => (
            <button
              key={drug.id}
              onClick={() => {
                onSelect(drug);
                setQuery('');
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 focus:outline-none"
            >
              <div className="font-semibold text-gray-900">
                {drug.genericName}
              </div>
              <div className="text-sm text-gray-600">
                {drug.strength} • {drug.tradeName.join(', ')}
              </div>
              <div className="text-xs text-gray-500">{drug.route}</div>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && !loading && (
        <p className="text-gray-500 text-sm text-center py-4">
          No drugs found
        </p>
      )}
    </div>
  );
}
