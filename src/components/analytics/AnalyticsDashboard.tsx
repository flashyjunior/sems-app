/**
 * Analytics Dashboard Component
 * Main page combining all analytics views
 */

'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';
import { DashboardMetrics } from './DashboardMetrics';
import { TopMedicinesChart } from './TopMedicinesChart';
import { PeakHoursChart } from './PeakHoursChart';
import { PeakDaysChart } from './PeakDaysChart';
import { DailyDispensingTrend } from './DailyDispensingTrend';
import { ComplianceStats } from './ComplianceStats';
import { RiskAlertsList } from './RiskAlertsList';
import ExportJobStatus from './ExportJobStatus';
import ExportJobsList from './ExportJobsList';

interface AnalyticsDashboardProps {
  pharmacyId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  pharmacyId,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'risks'>('overview');
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);

  // Date range / period selection state
  const [selectedPreset, setSelectedPreset] = useState<string>('last30');
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [reconLoading, setReconLoading] = useState(false);
  const [reconResult, setReconResult] = useState<any | null>(null);
  const [reconError, setReconError] = useState<string>('');
  // Saved presets (localStorage)
  const PRESETS_KEY = `analytics_saved_presets_${pharmacyId || 'global'}`;
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; start: string; end: string }>>([]);
  const [selectedSavedPreset, setSelectedSavedPreset] = useState<string>('');
  const [showSaveInput, setShowSaveInput] = useState<boolean>(false);
  const [savePresetName, setSavePresetName] = useState<string>('');
  // Temporary flag: hide preset save/load/apply/delete controls when false
  const SHOW_PRESET_CONTROLS = false;
  // Temporary flag: hide reconciliation quick-check button
  const SHOW_RECONCILE = false;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (raw) setSavedPresets(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load saved presets', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPresets = (list: Array<{ name: string; start: string; end: string }>) => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
      setSavedPresets(list);
    } catch (e) {
      console.warn('Failed to persist presets', e);
    }
  };

  const saveCurrentPreset = (name?: string) => {
    const presetName = name || savePresetName;
    if (!presetName) return;
    const item = { name: presetName, start: toISODate(startDate), end: toISODate(endDate) };
    const existing = savedPresets.filter(p => p.name !== presetName);
    persistPresets([item, ...existing].slice(0, 20));
    setShowSaveInput(false);
    setSavePresetName('');
  };

  const applySavedPreset = (name: string) => {
    const p = savedPresets.find(x => x.name === name);
    if (!p) return;
    normalizeRangeAndApply(new Date(p.start), new Date(p.end), 'custom');
  };

  const deleteSavedPreset = (name: string) => {
    const filtered = savedPresets.filter(p => p.name !== name);
    persistPresets(filtered);
  };

  // Fetch pharmacy name on mount when pharmacyId provided
  useEffect(() => {
    const fetchPharmacyName = async () => {
      if (!pharmacyId) return;
      setLoadingPharmacy(true);
      try {
        const response = await fetch(`/api/pharmacies/${pharmacyId}`);
        if (response.ok) {
          const data = await response.json();
          setPharmacyName(data.name);
        }
      } catch (error) {
        console.error('Failed to fetch pharmacy name:', error);
      } finally {
        setLoadingPharmacy(false);
      }
    };

    fetchPharmacyName();
  }, [pharmacyId]);

  // Preset calculation helper
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const normalizeRangeAndApply = (s: Date, e: Date, preset: string) => {
    // Ensure start <= end
    const start = s <= e ? new Date(s) : new Date(e);
    const end = s <= e ? new Date(e) : new Date(s);

    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(preset);
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let s = new Date(now.getTime());
    let e = new Date(now.getTime());

    switch (preset) {
      case 'today': {
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        e = new Date();
        break;
      }
      case 'yesterday': {
        const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        s = new Date(y.getFullYear(), y.getMonth(), y.getDate());
        e = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'last7':
        s = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        e = new Date(now.getTime());
        break;
      case 'last30':
        s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        e = new Date(now.getTime());
        break;
      case 'thisMonth':
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        e = new Date(now.getTime());
        break;
      case 'lastMonth': {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        s = firstDayLastMonth;
        e = lastDayLastMonth;
        break;
      }
      case 'thisYear':
        s = new Date(now.getFullYear(), 0, 1);
        e = new Date(now.getTime());
        break;
      case 'custom':
        // keep current start/end but mark preset
        setSelectedPreset('custom');
        return;
      default:
        s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        e = new Date(now.getTime());
    }

    normalizeRangeAndApply(s, e, preset);
  };

  useEffect(() => {
    // apply default preset on mount
    applyPreset(selectedPreset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem',
    backgroundColor: isActive ? styles.primaryColor : '#f0f0f0',
    color: isActive ? 'white' : '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          📊 Analytics Dashboard
        </h1>
        <p style={styles.secondaryText}>
          Dispensing metrics, compliance monitoring, and risk analysis
        </p>
      </div>

      {/* Date Range / Period Selector */}
      <div style={{
        ...styles.card,
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontWeight: '600' }}>Period:</label>
          <select
            value={selectedPreset}
            onChange={(e) => applyPreset(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 4 }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="lastMonth">Last month</option>
            <option value="thisMonth">This month</option>
            <option value="thisYear">This year</option>
            <option value="custom">Custom</option>
          </select>

          {selectedPreset !== 'custom' && (
            <div style={{ color: '#333' }}>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </div>
          )}

          {/* Saved presets controls */}
          {SHOW_PRESET_CONTROLS ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
              {!showSaveInput ? (
                <button onClick={() => setShowSaveInput(true)} style={{ padding: '0.4rem 0.6rem' }}>
                  Save preset
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <input value={savePresetName} onChange={(e) => setSavePresetName(e.target.value)} placeholder="Preset name" style={{ padding: '0.35rem' }} />
                  <button onClick={() => saveCurrentPreset()} style={{ padding: '0.35rem 0.5rem' }}>Save</button>
                  <button onClick={() => { setShowSaveInput(false); setSavePresetName(''); }} style={{ padding: '0.35rem 0.5rem' }}>Cancel</button>
                </div>
              )}

              <select
                value={selectedSavedPreset}
                onChange={(e) => setSelectedSavedPreset(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: 4 }}
              >
                <option value="">Load preset...</option>
                {savedPresets.map((p) => (
                  <option key={p.name} value={p.name}>{p.name} ({p.start}  {p.end})</option>
                ))}
              </select>

              <button
                onClick={() => selectedSavedPreset && applySavedPreset(selectedSavedPreset)}
                style={{ padding: '0.4rem 0.6rem' }}
              >
                Apply
              </button>

              <button
                onClick={() => selectedSavedPreset && deleteSavedPreset(selectedSavedPreset)}
                style={{ padding: '0.4rem 0.6rem' }}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>

        {/* Custom date inputs */}
        {selectedPreset === 'custom' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              value={startDate.toISOString().slice(0, 10)}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              style={{ padding: '0.4rem' }}
            />
            <span style={{ fontWeight: 600 }}>to</span>
            <input
              type="date"
              value={endDate.toISOString().slice(0, 10)}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              style={{ padding: '0.4rem' }}
            />
            {SHOW_PRESET_CONTROLS ? (
              <button
                onClick={() => {
                  // Validate and apply custom range
                  const s = new Date(startDate);
                  const e = new Date(endDate);
                  normalizeRangeAndApply(s, e, 'custom');
                }}
                style={{ marginLeft: '0.5rem', padding: '0.4rem 0.6rem' }}
              >
                Apply
              </button>
            ) : null}
          </div>
        )}
        
        {/* Reconciliation quick-check (hidden behind flag) */}
        {SHOW_RECONCILE && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={async () => {
                try {
                  setReconLoading(true);
                  setReconError('');
                  const params = new URLSearchParams();
                  params.set('startDate', startDate.toISOString().slice(0, 10));
                  params.set('endDate', endDate.toISOString().slice(0, 10));
                  if (pharmacyId) params.set('pharmacyId', pharmacyId);

                  const res = await fetch(`/api/analytics/debug/counts?${params.toString()}`);
                  if (!res.ok) throw new Error('Failed to fetch reconciliation');
                  const json = await res.json();
                  setReconResult(json.data);
                } catch (err) {
                  setReconError(err instanceof Error ? err.message : 'Unknown error');
                } finally {
                  setReconLoading(false);
                }
              }}
              style={{ padding: '0.5rem 0.9rem', borderRadius: 6, backgroundColor: styles.primaryColor, color: 'white', border: 'none' }}
            >
              Reconcile counts
            </button>
          </div>
        )}
      </div>

      {reconResult && (
        <div style={{ ...styles.card, padding: '0.75rem', marginBottom: '1rem' }}>
          <strong>Reconciliation:</strong>
          <div>Raw DB rows: {reconResult.rawCount}</div>
          <div>Aggregated total: {reconResult.aggregatedCount}</div>
          <div>Difference: {reconResult.difference}</div>
        </div>
      )}
      {reconLoading && <div style={{ marginBottom: '1rem' }}>Reconciling...</div>}
      {reconError && <div style={{ color: 'red', marginBottom: '1rem' }}>Error: {reconError}</div>}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={tabButtonStyle(activeTab === 'overview')}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          style={tabButtonStyle(activeTab === 'compliance')}
        >
          ✅ Compliance
        </button>
        <button
          onClick={() => setActiveTab('risks')}
          style={tabButtonStyle(activeTab === 'risks')}
        >
          🚨 Risks
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <DashboardMetrics
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
          />

          <TopMedicinesChart
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
            limit={10}
          />
          
          <DailyDispensingTrend
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
          />

          <PeakHoursChart
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
          />

          <PeakDaysChart
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
          />
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div>
          <ComplianceStats
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
          />
        </div>
      )}

      {/* Risks Tab */}
      {activeTab === 'risks' && (
        <div>
          <RiskAlertsList
            startDate={startDate}
            endDate={endDate}
            pharmacyId={pharmacyId}
            severity="both"
            limit={50}
          />
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            <ExportJobStatus />
            <div>
              <ExportJobsList />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#666',
      }}>
        <p>
           Dashboard updated: {new Date().toLocaleString()}
        </p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Data is automatically refreshed every time you navigate to this page.
        </p>
      </div>
    </div>
  );
};
