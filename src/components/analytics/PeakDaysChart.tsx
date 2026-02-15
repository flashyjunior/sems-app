/**
 * Peak Days Chart Component
 * Displays weekly dispensing distribution heatmap
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface PeakDay {
  day: number;
  dayName: string;
  count: number;
  prescriptions: number;
  avgRiskScore: number;
}

interface PeakDaysChartProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
}

const DayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PeakDaysChart: React.FC<PeakDaysChartProps> = ({
  startDate,
  endDate,
  pharmacyId,
}) => {
  const [peakDays, setPeakDays] = useState<PeakDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeakDays = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);

        const response = await fetch(`/api/analytics/dispensing/peak-days?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch peak days');

        const result = await response.json();
        // Normalize API response: some routes return the array directly as `data`,
        // others return an object like { days: [...] }. Accept both.
        const raw = Array.isArray(result?.data) ? result.data : result?.data?.days || [];
        const normalized = (Array.isArray(raw) ? raw : []).map((d: any) => ({
          day: d.day,
          dayName: DayNames[d.day] || `Day ${d.day}`,
          count: d.count || 0,
          prescriptions: d.prescriptionCount ?? d.prescriptions ?? 0,
          avgRiskScore: d.avgRiskScore ?? 0,
        }));
        setPeakDays(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPeakDays();
  }, [startDate, endDate, pharmacyId]);

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading peak days...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.errorBox, padding: '1rem' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!peakDays || peakDays.length === 0) {
    return (
      <div style={{ ...styles.card, padding: '2rem', textAlign: 'center' }}>
        <p style={styles.secondaryText}>No peak days data available</p>
      </div>
    );
  }

  const counts = peakDays.map(d => d?.count || 0);
  const maxCount = counts.length ? Math.max(...counts) : 0;

  const getHeatmapColor = (count: number, max: number): string => {
    const intensity = count / max;
    
    if (intensity === 0) return '#f5f5f5';
    if (intensity < 0.25) return '#c8e6c9';
    if (intensity < 0.5) return '#81c784';
    if (intensity < 0.75) return '#43a047';
    return '#1b5e20';
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
         📅 Peak Days Distribution
      </h3>

      <div style={styles.card}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {peakDays.map((day) => (
            <div
              key={day.day}
              style={{
                position: 'relative',
                backgroundColor: getHeatmapColor(day.count, maxCount),
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                cursor: 'pointer',
                border: '1px solid #ddd',
                transition: 'transform 0.2s ease',
              }}
              title={`${day.dayName}: ${day.count} events`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: day.count > maxCount * 0.5 ? 'white' : '#333',
              }}>
                {day.dayName.substring(0, 3)}
              </div>
              <div style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                color: day.count > maxCount * 0.5 ? 'white' : '#333',
                marginTop: '0.3rem',
              }}>
                {day.count}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: day.count > maxCount * 0.5 ? 'rgba(255,255,255,0.8)' : '#666',
              }}>
                {day.prescriptions} Rx
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #eee',
          fontSize: '0.9rem',
        }}>
          <div>
            <strong>Legend:</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { color: '#f5f5f5', label: 'No data' },
              { color: '#c8e6c9', label: 'Low' },
              { color: '#81c784', label: 'Medium' },
              { color: '#43a047', label: 'High' },
              { color: '#1b5e20', label: 'Peak' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: color,
                    borderRadius: '4px',
                  }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.9rem',
        }}>
          {/* Safely compute peak activity with defaults */}
          {peakDays && peakDays.length ? (
            (() => {
              const peak = peakDays.reduce((max: PeakDay, d: PeakDay) => (d.count > (max.count || 0) ? d : max), peakDays[0]);
              return (
                <><strong>Peak Activity:</strong> {peak.dayName} ({peak.count} events)</>
              );
            })()
          ) : (
            <><strong>Peak Activity:</strong> N/A</>
          )}
        </div>
      </div>
    </div>
  );
};
