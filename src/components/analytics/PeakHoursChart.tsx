/**
 * Peak Hours Chart Component
 * Displays hourly dispensing distribution heatmap
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface PeakHour {
  hour: number;
  count: number;
  prescriptions: number;
  avgRiskScore: number;
}

interface PeakHoursChartProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({
  startDate,
  endDate,
  pharmacyId,
}) => {
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeakHours = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);

        const response = await fetch(`/api/analytics/dispensing/peak-hours?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch peak hours');

        const result = await response.json();
        setPeakHours(result.data.hours);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPeakHours();
  }, [startDate, endDate, pharmacyId]);

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading peak hours...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.errorBox, padding: '1rem' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (peakHours.length === 0) {
    return (
      <div style={{ ...styles.card, padding: '2rem', textAlign: 'center' }}>
        <p style={styles.secondaryText}>No peak hours data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...peakHours.map(h => h.count || 0));

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
         Peak Hours Distribution
      </h3>

      <div style={styles.card}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          {peakHours.map((hour) => (
            <div
              key={hour.hour}
              style={{
                position: 'relative',
                backgroundColor: getHeatmapColor(hour.count, maxCount),
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                cursor: 'pointer',
                border: '1px solid #ddd',
                transition: 'transform 0.2s ease',
              }}
              title={`Hour ${hour.hour}: ${hour.count} events`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: hour.count > maxCount * 0.5 ? 'white' : '#333',
              }}>
                {String(hour.hour).padStart(2, '0')}:00
              </div>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: hour.count > maxCount * 0.5 ? 'white' : '#333',
              }}>
                {hour.count}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: hour.count > maxCount * 0.5 ? 'rgba(255,255,255,0.8)' : '#666',
              }}>
                {hour.prescriptions} Rx
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
          <strong>Peak Activity:</strong> {peakHours.reduce((max, h) => 
            h.count > max.count ? h : max
          ).hour}:00 ({peakHours.reduce((max, h) => 
            h.count > max.count ? h : max
          ).count} events)
        </div>
      </div>
    </div>
  );
};
