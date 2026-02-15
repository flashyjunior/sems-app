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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'rate' | 'compliant' | 'deviation' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotal, setEventsTotal] = useState<number | null>(null);
  const [popoverEventId, setPopoverEventId] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchEvents = async () => {
      if (!modalOpen || !modalType) return;
      try {
        setEventsLoading(true);
        setEventsError(null);

        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().split('T')[0]);
        params.set('endDate', endDate.toISOString().split('T')[0]);
        if (pharmacyId) params.set('pharmacyId', pharmacyId);
        params.set('page', String(eventsPage));
        params.set('limit', '200');

        // If user opened compliant/deviation lists, pass stgCompliant filter
        if (modalType === 'compliant') params.set('stgCompliant', 'true');
        if (modalType === 'deviation') params.set('stgCompliant', 'false');

        const response = await fetch(`/api/analytics/dispensing/events?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch event details');
        const result = await response.json();
        setEvents(result.data || []);
        setEventsTotal(result.pagination?.total ?? null);
      } catch (err) {
        setEventsError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [modalOpen, modalType, eventsPage, startDate, endDate, pharmacyId]);

  // Close popover when clicking outside
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-popover-id]')) {
        setPopoverEventId(null);
      }
    };

    if (popoverEventId !== null) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
    return;
  }, [popoverEventId]);

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

  const rowHighlightProps = (ev: any) => {
    const cat = (ev.riskCategory || '').toLowerCase();
    const score = typeof ev.riskScore === 'number' ? ev.riskScore : -1;
    const isCritical = cat === 'critical' || score >= 80;
    const isHigh = isCritical || cat === 'high' || score >= 60;
    if (isCritical) {
      return { backgroundColor: '#fff1f2', borderLeft: '4px solid #7f1d1d' };
    }
    if (isHigh) {
      return { backgroundColor: '#fff7ed', borderLeft: '4px solid #ef4444' };
    }
    return {};
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        ✅ STG Compliance
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
          cursor: 'pointer',
        }}
        onClick={() => { setModalType('rate'); setModalOpen(true); }}>
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
            cursor: 'pointer',
          }}
          onClick={() => { setModalType('compliant'); setModalOpen(true); }}>
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
            cursor: 'pointer',
          }}
          onClick={() => { setModalType('deviation'); setModalOpen(true); }}>
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
            ⚠️ Top Deviation Reasons
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

      {/* Details Modal */}
      {modalOpen && modalType && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 'min(800px, 95%)', background: 'white', borderRadius: 8, padding: '1.25rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>{modalType === 'rate' ? 'Compliance Rate Details' : modalType === 'compliant' ? 'Compliant Events Details' : 'Deviation Events Details'}</h4>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {modalType === 'rate' && (
                <div>
                  <p style={{ marginTop: 0 }}><strong>How Compliance Rate is computed</strong></p>
                  <p>Compliance Rate = (Compliant Events / Total Events) × 100</p>
                  <p><strong>Compliant Events:</strong> {data?.compliantCount ?? 0}</p>
                  <p><strong>Deviation Events:</strong> {data?.deviationCount ?? 0}</p>
                  <p><strong>Total Events:</strong> {(data?.compliantCount ?? 0) + (data?.deviationCount ?? 0)}</p>
                </div>
              )}

              {modalType === 'compliant' && (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Compliant Events Breakdown</strong></p>
                  <p>Number of compliant events: <strong>{data?.compliantCount ?? 0}</strong></p>
                  <p>These are dispensings that followed STG guidelines within the selected period.</p>
                  <p style={{ marginTop: '0.5rem' }}><strong>Top deviation reasons are excluded here.</strong></p>
                </div>
              )}

              {modalType === 'deviation' && (
                <div>
                  <p style={{ marginTop: 0 }}><strong>Deviation Events Breakdown</strong></p>
                  <p>Total deviations: <strong>{data?.deviationCount ?? 0}</strong></p>
                  <p style={{ marginTop: '0.5rem' }}><strong>Top Deviation Reasons:</strong></p>
                  <ul>
                    {(data?.topDeviations && data.topDeviations.length) ? data.topDeviations.map((d, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{d}</li>
                    )) : <li>No deviation reasons available</li>}
                  </ul>
                </div>
              )}

              {/* Event list (records) - shown for compliant or deviation modal types */}
              {(modalType === 'compliant' || modalType === 'deviation') && (
                <div style={{ marginTop: '1rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>Event Records</h5>
                  {eventsLoading ? (
                    <div>Loading records...</div>
                  ) : eventsError ? (
                    <div style={{ color: 'red' }}>Error: {eventsError}</div>
                  ) : events.length === 0 ? (
                    <div>No records found for the selected period.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '0.5rem' }}>Time</th>
                            <th style={{ padding: '0.5rem' }}>Pharmacist</th>
                            <th style={{ padding: '0.5rem' }}>Patient</th>
                            <th style={{ padding: '0.5rem' }}>Phone</th>
                            <th style={{ padding: '0.5rem' }}>Drug</th>
                            <th style={{ padding: '0.5rem' }}>STG</th>
                            <th style={{ padding: '0.5rem' }}>Risk</th>
                            <th style={{ padding: '0.5rem' }}>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((ev) => (
                            <tr key={ev.id} style={{ borderBottom: '1px solid #f3f4f6', ...rowHighlightProps(ev) }}>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{new Date(ev.timestamp).toLocaleString()}</td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.pharmacist ?? '-'}</td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.patientName ?? '-'}</td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.patientPhone ?? '-'}</td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.drugName ?? ev.genericName ?? '-'}</td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.stgCompliant ? 'Yes' : 'No'}</td>
                                <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                                  {ev.riskScore ?? '-'}
                                  {ev.riskFlags && ev.riskFlags.length > 0 && (
                                    <span style={{ marginLeft: 8, color: '#9ca3af' , display: 'inline-block', position: 'relative' }} data-popover-id>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setPopoverEventId((id) => id === ev.id ? null : ev.id); }}
                                        aria-expanded={popoverEventId === ev.id}
                                        aria-controls={`popover-${ev.id}`}
                                        style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: '#9ca3af' }}
                                      >
                                        ⚑
                                      </button>

                                      {popoverEventId === ev.id && (
                                        <div id={`popover-${ev.id}`} data-popover-id style={{ position: 'absolute', top: '1.6rem', left: 0, zIndex: 80, minWidth: 220, background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.5rem', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Risk flags</div>
                                          <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                                            {(Array.isArray(ev.riskFlags) ? ev.riskFlags : [ev.riskFlags]).map((f: any, i: number) => (
                                              <div key={i} style={{ padding: '0.15rem 0' }}>• {f}</div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </span>
                                  )}
                                </td>
                              <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>{ev.overrideFlag ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                  disabled={eventsPage <= 1 || eventsLoading}
                  style={{ padding: '0.4rem 0.75rem', background: eventsPage <= 1 ? '#f3f4f6' : '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: eventsPage <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>

                <div style={{ fontSize: '0.9rem', color: '#444' }}>
                  Page {eventsPage}{eventsTotal ? ` of ${Math.max(1, Math.ceil(eventsTotal / 200))}` : ''}
                </div>

                <button
                  onClick={() => setEventsPage((p) => p + 1)}
                  disabled={eventsLoading || (eventsTotal !== null && eventsPage * 200 >= eventsTotal)}
                  style={{ padding: '0.4rem 0.75rem', background: (eventsTotal !== null && eventsPage * 200 >= eventsTotal) ? '#f3f4f6' : '#fff', border: '1px solid #e5e7eb', borderRadius: 6, cursor: (eventsTotal !== null && eventsPage * 200 >= eventsTotal) ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const params = new URLSearchParams();
                    params.set('startDate', startDate.toISOString().split('T')[0]);
                    params.set('endDate', endDate.toISOString().split('T')[0]);
                    if (pharmacyId) params.set('pharmacyId', pharmacyId);
                    if (modalType === 'compliant') params.set('stgCompliant', 'true');
                    if (modalType === 'deviation') params.set('stgCompliant', 'false');
                    window.location.href = `/records?${params.toString()}`;
                  }}
                  style={{ padding: '0.45rem 0.85rem', background: '#2563eb', color: 'white', borderRadius: 6, textDecoration: 'none' }}
                >
                  View all in Records
                </a>

                <button onClick={() => setModalOpen(false)} style={{ padding: '0.5rem 1rem', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
