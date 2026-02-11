/**
 * Compliance Statistics Component
 * Displays STG compliance metrics and deviation analysis
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface ComplianceData {
  compliantCount: number;
  deviationCount: number;
  complianceRate: number;
  topDeviations: string[];
  totalEvents: number;
  deviationPercentage: number;
}

interface ComplianceStatsProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
}

export const ComplianceStats: React.FC<ComplianceStatsProps> = ({
  startDate,
  endDate,
  pharmacyId,
}) => {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);

        const response = await fetch(`/api/analytics/dispensing/compliance?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch compliance stats');

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, [startDate, endDate, pharmacyId]);

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading compliance data...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.errorBox, padding: '1rem' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  // Defensive defaults for numeric fields that may be null from API
  const safeComplianceRate = typeof data.complianceRate === 'number' ? data.complianceRate : 0;
  const safeCompliantCount = typeof data.compliantCount === 'number' ? data.compliantCount : 0;
  const safeDeviationCount = typeof data.deviationCount === 'number' ? data.deviationCount : 0;
  const safeTotalEvents = typeof data.totalEvents === 'number' ? data.totalEvents : 0;
  const hasDeviationPercentage = data.deviationPercentage !== null && data.deviationPercentage !== undefined;
  const deviationText = hasDeviationPercentage ? `${data.deviationPercentage.toFixed(1)}% of total` : 'N/A';

  const getStatusColor = (rate: number): string => {
    if (rate >= 95) return '#4caf50';
    if (rate >= 85) return '#8bc34a';
    if (rate >= 75) return '#ffc107';
    return '#ff5722';
  };

  const getStatusLabel = (rate: number): string => {
    if (rate >= 95) return 'EXCELLENT';
    if (rate >= 85) return 'GOOD';
    if (rate >= 75) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        [OK] STG Compliance
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Compliance Rate Card */}
        <div style={{
          ...styles.card,
          textAlign: 'center',
          padding: '2rem',
          border: `3px solid ${getStatusColor(safeComplianceRate)}`,
        }}>
          <div style={{ marginBottom: '0.5rem', color: styles.secondaryText.color }}>
            Compliance Rate
          </div>
          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: getStatusColor(safeComplianceRate),
            marginBottom: '0.5rem',
          }}>
            {safeComplianceRate.toFixed(1)}%
          </div>
          <div style={{
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            backgroundColor: getStatusColor(data.complianceRate),
            color: 'white',
            borderRadius: '4px',
            display: 'inline-block',
          }}>
            {getStatusLabel(safeComplianceRate)}
          </div>
        </div>

        {/* Compliant Events Card */}
        <div style={{
          ...styles.card,
          padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: styles.secondaryText.color,
            marginBottom: '0.5rem',
          }}>
            Compliant Events
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#4caf50',
            marginBottom: '0.5rem',
          }}>
            {safeCompliantCount.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#666',
          }}>
            of {safeTotalEvents} total
          </div>
        </div>

        {/* Deviation Events Card */}
        <div style={{
          ...styles.card,
          padding: '1.5rem',
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: styles.secondaryText.color,
            marginBottom: '0.5rem',
          }}>
            Deviation Events
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ff5722',
            marginBottom: '0.5rem',
          }}>
            {safeDeviationCount.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#666',
          }}>
            {deviationText}
          </div>
        </div>
      </div>

      {/* Compliance Progress Bar */}
      <div style={{
        ...styles.card,
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.9rem',
        }}>
          <strong>Overall Compliance Progress</strong>
          <span>{data.compliantCount} / {data.totalEvents}</span>
        </div>
        <div style={{
          width: '100%',
          height: '24px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              width: `${safeComplianceRate}%`,
              height: '100%',
              backgroundColor: getStatusColor(safeComplianceRate),
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            {safeComplianceRate > 5 && `${safeComplianceRate.toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* Top Deviations */}
      {data.topDeviations && data.topDeviations.length > 0 && (
        <div style={styles.card}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            [WARN] Top Deviation Reasons
          </h4>
          <div>
            {data.topDeviations.map((deviation, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  marginBottom: index < data.topDeviations.length - 1 ? '0.5rem' : '0',
                  backgroundColor: '#fff3e0',
                  borderLeft: `4px solid #ff9800`,
                  borderRadius: '2px',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{index + 1}.</strong> {deviation}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
