/**
 * Analytics Dashboard Page
 * Main dashboard route for DPAP analytics
 */

'use client';

import React from 'react';
import { useAppStore } from '@/store/app';
import { AnalyticsDashboard } from '@/components/analytics';
import styles from '@/app/styles-const';

export default function AnalyticsDashboardPage() {
  const user = useAppStore((s) => s.user);
  const userPharmacyId = user?.pharmacy?.id || user?.pharmacyId || undefined;

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: styles.primaryColor,
          marginBottom: '0.5rem',
        }}>
          [chart] DPAP Analytics Dashboard
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#666',
          marginBottom: '1rem',
        }}>
          Real-time dispensing metrics, compliance monitoring, and risk analysis
        </p>
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, ${styles.primaryColor}00, ${styles.primaryColor}, ${styles.primaryColor}00)`,
          marginBottom: '2rem',
        }} />
      </div>

      {/* Main Dashboard */}
      <AnalyticsDashboard pharmacyId={userPharmacyId} />
    </div>
  );
}
