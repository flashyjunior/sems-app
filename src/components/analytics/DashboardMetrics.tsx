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
    format = 'default' 
  }: {
    label: string;
    value: number;
    unit?: string;
    format?: 'number' | 'percent' | 'time' | 'default';
  }) => {
    let formattedValue = '';
    
    if (format === 'percent') {
      formattedValue = `${value.toFixed(1)}%`;
    } else if (format === 'time') {
      formattedValue = `${value.toFixed(1)}s`;
    } else if (format === 'number') {
      formattedValue = value.toLocaleString();
    } else {
      formattedValue = `${value}${unit}`;
    }

    return (
      <div style={{
        ...styles.card,
        flex: 1,
        minWidth: '200px',
        textAlign: 'center',
        padding: '1.5rem',
      }}>
        <div style={{
          fontSize: '0.9rem',
          color: styles.secondaryText.color,
          marginBottom: '0.5rem',
          fontWeight: '500',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: styles.primaryColor,
        }}>
          {formattedValue}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        [chart] Dispensing Metrics
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <MetricCard 
          label="Total Dispensings" 
          value={data.totalDispensingS} 
          format="number"
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
        <MetricCard 
          label="Avg Dispensing Time" 
          value={data.avgDispensingTime} 
          format="time"
        />
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
