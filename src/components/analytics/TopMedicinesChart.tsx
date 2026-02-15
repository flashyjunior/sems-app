/**
 * Top Medicines Chart Component
 * Displays most dispensed medicines visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface TopMedicine {
  drugId: string;
  drugCode: string;
  drugGenericName: string;
  count: number;
  prescriptionCount: number;
  otcCount: number;
  riskCategory: string;
}

interface TopMedicinesChartProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
  limit?: number;
}

export const TopMedicinesChart: React.FC<TopMedicinesChartProps> = ({
  startDate,
  endDate,
  pharmacyId,
  limit = 10,
}) => {
  const [medicines, setMedicines] = useState<TopMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);
        params.set('limit', limit.toString());

        const response = await fetch(`/api/analytics/dispensing/top-medicines?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch top medicines');

        const result = await response.json();
        setMedicines(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [startDate, endDate, pharmacyId, limit]);

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading medicines...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.errorBox, padding: '1rem' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div style={{ ...styles.card, padding: '2rem', textAlign: 'center' }}>
        <p style={styles.secondaryText}>No medicines data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...medicines.map(m => m.count));

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
          💊 Top {medicines.length} Most Dispensed Medicines
        </h3>
        <div>
          <button
            onClick={() => {
              // build CSV
              const headers = ['drugId','drugCode','drugGenericName','count','prescriptionCount','otcCount','riskCategory'];
              const rows = medicines.map(m => [m.drugId, m.drugCode, m.drugGenericName, m.count, m.prescriptionCount, m.otcCount, m.riskCategory]);
              const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `top_medicines_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
            style={{ padding: '0.4rem 0.6rem' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={styles.card}>
        {/* Legend for risk colors */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, background: '#d32f2f', borderRadius: 3 }} />
            <div style={{ fontSize: '0.85rem' }}>Critical</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, background: '#f57c00', borderRadius: 3 }} />
            <div style={{ fontSize: '0.85rem' }}>High</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, background: '#fbc02d', borderRadius: 3 }} />
            <div style={{ fontSize: '0.85rem' }}>Medium</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 12, height: 12, background: '#388e3c', borderRadius: 3 }} />
            <div style={{ fontSize: '0.85rem' }}>Low/None</div>
          </div>
        </div>
        {medicines.map((medicine, index) => {
          const barWidth = (medicine.count / maxCount) * 100;
          const riskColor = 
            medicine.riskCategory === 'critical' ? '#d32f2f' :
            medicine.riskCategory === 'high' ? '#f57c00' :
            medicine.riskCategory === 'medium' ? '#fbc02d' :
            '#388e3c';

          // Use a neutral bar color and surface risk via a badge
          const barColor = '#1976d2';

          return (
            <div key={medicine.drugId} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
              }}>
                <div>
                  <strong>{index + 1}. {medicine.drugGenericName}</strong>
                  <div style={{ fontSize: '0.85rem', color: styles.secondaryText.color }}>
                    Code: {medicine.drugCode} | Risk: {medicine.riskCategory}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{medicine.count} total</div>
                  <div style={{ fontSize: '0.85rem', color: styles.secondaryText.color }}>
                    Rx: {medicine.prescriptionCount} | OTC: {medicine.otcCount}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#e0e0e0',
                height: '24px',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div
                  style={{
                    backgroundColor: barColor,
                    height: '100%',
                    width: `${barWidth}%`,
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: barWidth > 10 ? '8px' : '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                  }}
                >
                  {barWidth > 15 && `${medicine.count}`}
                </div>

                {/* Risk badge on the right */}
                <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                  <span aria-hidden style={{ width: 10, height: 10, background: riskColor, borderRadius: 10, display: 'inline-block', marginRight: 8 }} />
                  <span style={{ fontSize: '0.85rem', color: styles.secondaryText.color, textTransform: 'capitalize' }}>{medicine.riskCategory}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
