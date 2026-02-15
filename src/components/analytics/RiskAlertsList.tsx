/**
 * Risk Alerts List Component
 * Displays high and critical risk events
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import styles from '@/app/styles-const';
import useRiskSSE from './useRiskSSE';
import { useToast } from '@/components/ui/Toast';

interface RiskAlert {
  id: string;
  timestamp: string;
  pharmacyId: string;
  drugId: string;
  drugName?: string | null;
  genericName?: string | null;
  riskCategory: string;
  riskScore: number;
  riskReason: string;
  isPrescription: boolean;
  isControlledDrug: boolean;
  isAntibiotic: boolean;
}

interface RiskAlertsListProps {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
  severity?: 'high' | 'critical' | 'both';
  limit?: number;
}

export const RiskAlertsList: React.FC<RiskAlertsListProps> = ({
  startDate,
  endDate,
    pharmacyId,
  severity = 'both',
  limit = 50,
}) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredSeverity, setFilteredSeverity] = useState<'high' | 'critical' | 'both'>(severity);
  const [liveEnabled, setLiveEnabled] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<string[] | null>(null);
  const [createdTickets, setCreatedTickets] = useState<Record<string, { ticketId: string; highRiskAlertId?: string; dispensingEventId?: string }>>({});
  // use toast for feedback
  const showToast = useToast();

  // Temporary flag to hide the re-emit debugging button in production/dev UI
  const SHOW_REEMIT = false;

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

          const params = new URLSearchParams();
          params.set('startDate', startDate.toISOString().split('T')[0]);
          params.set('endDate', endDate.toISOString().split('T')[0]);
          if (pharmacyId) params.set('pharmacyId', pharmacyId);
          params.set('severity', filteredSeverity);
          if (limit) params.set('limit', limit.toString());

        const response = await fetch(`/api/analytics/dispensing/risk-alerts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch risk alerts');

        const result = await response.json().catch(() => null);
        // Normalize different possible response shapes and ensure alerts is always an array
        const maybeAlerts = (result && (
          (Array.isArray(result.data?.alerts) && result.data.alerts) ||
          (Array.isArray(result.data) && result.data) ||
          (Array.isArray(result) && result) ||
          []
        )) || [];
        setAlerts(maybeAlerts as RiskAlert[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [startDate, endDate, pharmacyId, filteredSeverity, limit]);

  useEffect(() => {
    // try to read roles from a global injected variable or a lightweight endpoint
    try {
      // prefer injected global for speed
      // @ts-ignore
      const g = (window as any).__SEMS_USER_ROLES__;
      if (Array.isArray(g)) {
        setUserRoles(g);
        return;
      }
    } catch (e) {}

    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const j = await res.json();
        if (j?.roles) setUserRoles(j.roles);
      } catch (e) {}
    })();
  }, []);

  useRiskSSE((payload) => {
    // prepend new alert when live enabled
    if (!liveEnabled) return;
    try {
      if (payload && payload.id) {
        setAlerts(prev => [payload as RiskAlert, ...prev].slice(0, 200));
      }
    } catch (e) {}
  }, liveEnabled);

  const getRiskColor = (category: string): string => {
    switch (category) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      default:
        return '#388e3c';
    }
  };

  const getRiskIcon = (category: string): string => {
    switch (category) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚠';
      default:
        return '✅';
    }
  };

  const formatFriendlyDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return iso;
    }
  };

  const maskIfUnauthorized = (value: string) => {
    if (!userRoles) return '----';
    if (userRoles.includes('analytics:full') || userRoles.includes('admin')) return value;
    // partially mask
    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  };

  const createTicket = async (alertId: string) => {
    try {
      showToast('Creating ticket...', 'info', 2000);
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/analytics/alerts/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify({ alertId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.error || 'Failed to create ticket';
        showToast(`Error: ${msg}`, 'error', 5000);
        return;
      }

      const payload = await res.json().catch(() => null);
      // API returns { success: true, data: { ticket: { id, ticketNumber }, highRiskAlertId, dispensingEventId } }
      const data = payload?.data || {};
      const ticketObj = data?.ticket || data || null;
      const highRiskAlertId = data?.highRiskAlertId ?? payload?.highRiskAlertId ?? null;
      const dispensingEventId = data?.dispensingEventId ?? payload?.dispensingEventId ?? null;

      if (ticketObj && ticketObj.id) {
        // Save mapping to show in UI
        setCreatedTickets((s) => ({ ...s, [alertId]: { ticketId: ticketObj.id, highRiskAlertId, dispensingEventId } }));
        showToast(`Ticket created: ${ticketObj.id}`, 'success', 3500);
      } else {
        showToast('Ticket created', 'success', 3500);
      }
    } catch (e) {
      showToast((e as Error).message || 'Failed', 'error', 4000);
    }
  };

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading alerts...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.errorBox, padding: '1rem' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
        🚨 Risk Alerts
      </h3>

      

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button
          onClick={() => {
            // CSV export for alerts
            const headers = ['id','timestamp','pharmacyId','genericName','drugName','drugId','riskCategory','riskScore','riskReason','isPrescription','isControlledDrug','isAntibiotic'];
            const rows = (alerts || []).map(a => [a.id, a.timestamp, a.pharmacyId, a.genericName || '', a.drugName || '', a.drugId, a.riskCategory, a.riskScore, a.riskReason, a.isPrescription, a.isControlledDrug, a.isAntibiotic]);
            const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `risk_alerts_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}.csv`;
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

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['both', 'high', 'critical'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilteredSeverity(sev)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filteredSeverity === sev ? styles.primaryColor : '#f0f0f0',
              color: filteredSeverity === sev ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem' }}>Live</label>
          <button
            onClick={() => setLiveEnabled(v => !v)}
            style={{ padding: '0.4rem 0.6rem', backgroundColor: liveEnabled ? styles.primaryColor : '#f0f0f0', color: liveEnabled ? 'white' : '#333', border: 'none', borderRadius: 4 }}
          >
            {liveEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div style={{ ...styles.card, padding: '2rem', textAlign: 'center' }}>
          <p style={styles.secondaryText}>✅ No risk alerts detected</p>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '0.9rem',
          }}>
            Found <strong>{alerts.length}</strong> alert{alerts.length !== 1 ? 's' : ''} 
            {filteredSeverity !== 'both' && ` (${filteredSeverity})`}
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {alerts.map((alert, index) => {
              const color = getRiskColor(alert.riskCategory);
              const icon = getRiskIcon(alert.riskCategory);

              return (
                <div
                  key={alert.id}
                  style={{
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    border: `2px solid ${color}`,
                    borderRadius: '4px',
                    backgroundColor: `${color}15`,
                  }}
                  data-alert-id={alert.id}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                      <div>
                        <strong>
                          {alert.riskCategory.toUpperCase()} RISK
                        </strong>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          Score: {alert.riskScore.toFixed(2)}/100
                        </div>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      color: '#666',
                    }}>
                      {formatFriendlyDate(alert.timestamp)}
                    </div>
                  </div>

                  <div style={{
                          fontSize: '0.9rem',
                          marginBottom: '0.5rem',
                          color: '#333',
                        }}>
                          <strong>Drug:</strong> {(alert.genericName || alert.drugName || alert.drugId)}
                          {alert.genericName && alert.drugName && alert.genericName !== alert.drugName ? (
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{alert.drugName}</div>
                          ) : null}
                        </div>

                  <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    marginBottom: '0.5rem',
                  }}>
                    <strong>Reason:</strong> {alert.riskReason}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.85rem',
                    color: '#666',
                    flexWrap: 'wrap',
                  }}>
                    <button onClick={() => createTicket(alert.id)} style={{ padding: '0.25rem 0.5rem' }}>Create Ticket</button>
                    {SHOW_REEMIT ? (
                      <button onClick={() => {
                        // quick emit to debug webhook/stream
                        fetch('/api/analytics/debug/emit-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alert) });
                      }} style={{ padding: '0.25rem 0.5rem' }}>Re-emit</button>
                    ) : null}
                    {alert.isPrescription && (
                      <span style={{ backgroundColor: '#e3f2fd', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
                         Prescription
                      </span>
                    )}
                    {alert.isControlledDrug && (
                      <span style={{ backgroundColor: '#fff3e0', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
                         Controlled
                      </span>
                    )}
                    {alert.isAntibiotic && (
                      <span style={{ backgroundColor: '#f3e5f5', padding: '0.25rem 0.5rem', borderRadius: '3px' }}>
                        💊 Antibiotic
                      </span>
                    )}
                  </div>
                              {createdTickets[alert.id] && (
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e0e0e0', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div><strong>Ticket created:</strong> {createdTickets[alert.id].ticketId}</div>
                                    <div style={{ color: '#555', marginTop: '0.25rem' }}>
                                      <span><strong>HighRiskAlert:</strong> {createdTickets[alert.id].highRiskAlertId || '-'}</span>
                                      <span style={{ marginLeft: '1rem' }}><strong>DispensingEvent:</strong> {createdTickets[alert.id].dispensingEventId || '-'}</span>
                                    </div>
                                  </div>
                                  <div style={{ marginLeft: '1rem' }}>
                                    <button
                                      onClick={() => {
                                        // set global selected ticket and navigate to tickets view
                                        try {
                                          useAppStore.setState({ selectedTicketId: createdTickets[alert.id].ticketId });
                                        } catch (e) {}
                                        try {
                                          window.dispatchEvent(new CustomEvent('sems:navigate-to-ticket', { detail: { ticketId: createdTickets[alert.id].ticketId } }));
                                        } catch (e) {}
                                      }}
                                      style={{ padding: '0.35rem 0.5rem' }}
                                    >
                                      View ticket
                                    </button>
                                  </div>
                                </div>
                              )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Listen for external focus events to scroll to a specific alert
export default (function WrappedRiskAlertsList(props?: any) {
  const Component = RiskAlertsList as any;
  // Attach global listener once
  if (typeof window !== 'undefined') {
    window.addEventListener('sems:focus-alert', (ev: Event) => {
      try {
        // @ts-ignore
        const detail = (ev as any).detail || {};
        const targetId = detail.highRiskAlertId || detail.dispensingEventId || null;
        if (!targetId) return;
        setTimeout(() => {
          const el = document.querySelector(`[data-alert-id="${targetId}"]`);
          if (el) {
              const elh = el as HTMLElement;
              // ensure focusable for accessibility
              if (!elh.hasAttribute('tabindex')) elh.setAttribute('tabindex', '-1');
              elh.focus({ preventScroll: true });
              elh.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // visual highlight: add outline + background then remove
              const prevBg = elh.style.backgroundColor;
              const prevOutline = elh.style.outline;
              const prevTransition = elh.style.transition;
              elh.style.transition = 'background-color 0.35s ease, outline 0.35s ease';
              elh.style.backgroundColor = '#fff3cd';
              elh.style.outline = '3px solid rgba(245, 158, 11, 0.9)';
              elh.setAttribute('aria-hidden', 'false');

              // Announce via live region
              try {
                let live = document.getElementById('sems-alert-live');
                if (!live) {
                  live = document.createElement('div');
                  live.id = 'sems-alert-live';
                  live.setAttribute('aria-live', 'polite');
                  live.setAttribute('aria-atomic', 'true');
                  live.style.position = 'absolute';
                  live.style.left = '-9999px';
                  live.style.width = '1px';
                  live.style.height = '1px';
                  live.style.overflow = 'hidden';
                  document.body.appendChild(live);
                }
                live.textContent = `Focused alert ${targetId}`;
              } catch (e) {}

              setTimeout(() => {
                try { elh.style.backgroundColor = prevBg; elh.style.outline = prevOutline; elh.style.transition = prevTransition; } catch (e) {}
              }, 1400);
            }
        }, 300);
      } catch (e) {}
    });
  }

  return RiskAlertsList as any;
})();
