/**
 * Dashboard Metrics Component
 * Displays key performance indicators and summary statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface DashboardMetricsData {
  totalPrescriptions: number;
  totalOTC: number;
  totalDispensingS: number;
  avgDispensingTime: number;
  prescriptionRatio: number;
  highRiskEvents: number;
  stgComplianceRate: number;
}

interface DashboardMetricsProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  startDate,
  endDate,
  pharmacyId,
}) => {
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);

        const response = await fetch(`/api/analytics/dispensing/summary?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch metrics');

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [startDate, endDate, pharmacyId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        ...styles.errorBox, 
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  const MetricCard = ({
    label,
    value,
    unit = '',
    format = 'default',
    variant = 'default',
  }: {
    label: string;
    value?: number | null;
    unit?: string;
    format?: 'number' | 'percent' | 'time' | 'default';
    variant?: 'default' | 'primary';
  }) => {
    // Accept undefined/null values from API and display a placeholder
    const safeValue = value ?? 0;
    let formattedValue = '';

    try {
      if (format === 'percent') {
        formattedValue = `${Number(safeValue).toFixed(1)}%`;
      } else if (format === 'time') {
        formattedValue = `${Number(safeValue).toFixed(1)}s`;
      } else if (format === 'number') {
        // toLocaleString can throw if value isn't a number — coerce first
        formattedValue = Number(safeValue).toLocaleString();
      } else {
        formattedValue = `${safeValue}${unit}`;
      }
    } catch (e) {
      // Fallback to a readable representation
      formattedValue = String(safeValue ?? '-');
    }

    const isPrimary = variant === 'primary';
    return (
      <div style={{
        ...(isPrimary ? {
          background: `linear-gradient(90deg, ${styles.primaryColor}33, ${styles.accentColor}22)`,
          color: '#0f172a',
          borderRadius: 12,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        } : styles.card),
        minWidth: '180px',
      }}>
        <div style={{
          fontSize: isPrimary ? '0.95rem' : '0.85rem',
          color: isPrimary ? '#0f172a' : styles.secondaryText.color,
          marginBottom: '0.25rem',
          fontWeight: 600,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: isPrimary ? '2.4rem' : '1.6rem',
          fontWeight: 800,
          color: isPrimary ? styles.primaryColor : styles.primaryColor,
        }}>
          {formattedValue}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        📊 Dispensing Metrics
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'stretch',
      }}>
        <MetricCard
          label="Total Dispensings"
          value={data.totalDispensingS}
          format="number"
          variant="primary"
        />
        <MetricCard
          label="Prescriptions"
          value={data.totalPrescriptions}
          format="number"
        />
        <MetricCard
          label="OTC"
          value={data.totalOTC}
          format="number"
        />
        {/* Avg Dispensing Time box intentionally hidden per request */}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <MetricCard 
          label="Prescription Ratio" 
          value={data.prescriptionRatio * 100} 
          format="percent"
        />
        <MetricCard 
          label="High-Risk Events" 
          value={data.highRiskEvents} 
          format="number"
        />
        <MetricCard 
          label="STG Compliance" 
          value={data.stgComplianceRate} 
          format="percent"
        />
      </div>
    </div>
  );
};
