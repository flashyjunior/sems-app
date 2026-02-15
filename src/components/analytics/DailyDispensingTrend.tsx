"use client";

import React, { useEffect, useState, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Point {
  date: string;
  count: number;
}

interface Props {
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
}

export const DailyDispensingTrend: React.FC<Props> = ({ startDate, endDate, pharmacyId }) => {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [availableDrugs, setAvailableDrugs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  
  // Simple searchable multi-select with checkboxes
  function DrugMultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Choose drugs...',
  }: {
    options: Array<{ id: string; name: string }>;
    selected: string[];
    onChange: (s: string[]) => void;
    placeholder?: string;
  }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!(e.target instanceof Node)) return;
        if (!ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('click', onDoc);
      return () => document.removeEventListener('click', onDoc);
    }, []);

    const filtered = options.filter((o) => (o.name || '').toLowerCase().includes(query.toLowerCase()));

    const toggle = (id: string) => {
      if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
      else onChange([...selected, id]);
    };

    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <div
          onClick={() => setOpen((v) => !v)}
          style={{
            border: '1px solid #d1d5db',
            padding: '6px 8px',
            borderRadius: 6,
            minWidth: 240,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          {selected.length === 0 ? (
            <div style={{ color: '#6b7280' }}>{placeholder}</div>
          ) : (
            options
              .filter((o) => selected.includes(o.id))
              .slice(0, 5)
              .map((o) => (
                <div key={o.id} style={{ background: '#eef2ff', padding: '2px 6px', borderRadius: 999, fontSize: 12 }}>
                  {o.name || o.id}
                </div>
              ))
          )}
          <div style={{ marginLeft: 'auto', color: '#6b7280' }}>{open ? '▴' : '▾'}</div>
        </div>

        {open && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 40, width: 320, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: 8, padding: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{ width: '100%', padding: '6px 8px', marginBottom: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              {filtered.map((o) => (
                <label key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 4px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                  <span style={{ fontSize: 14 }}>{o.name || o.id}</span>
                </label>
              ))}
              {filtered.length === 0 && <div style={{ color: '#6b7280', padding: 8 }}>No matches</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    const fetchTrend = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('startDate', startDate.toISOString().slice(0, 10));
        params.set('endDate', endDate.toISOString().slice(0, 10));
        if (pharmacyId) params.set('pharmacyId', pharmacyId);

        // Fetch top medicines for options
        const medsRes = await fetch(`/api/analytics/dispensing/top-medicines?${params.toString()}&limit=20`);
        if (medsRes.ok) {
          const medsJson = await medsRes.json();
          const meds = medsJson.data || [];
          // helper to extract a display name from various possible shapes
          const extractName = (m: any, idx: number) => {
            const tryPaths = [
              'genericName',
              'drugName',
              'displayName',
              'name',
              'medicineName',
              'productName',
              'label',
              'drug_name',
              'drug',
              'drug?.name',
              'drug?.genericName',
              'drug?.drugName',
            ];
            for (const p of tryPaths) {
              try {
                if (p.includes('?.')) {
                  const [a, b] = p.split('?.');
                  if (m && m[a] && m[a][b]) return String(m[a][b]).trim();
                } else if (m && m[p] != null) {
                  return String(m[p]).trim();
                }
              } catch (e) {
                // ignore
              }
            }
            // fallback: if m is a string or has id
            if (typeof m === 'string' && m.trim()) return m.trim();
            if (m && (m.id || m.drugId || m.drug_id)) return String(m.id ?? m.drugId ?? m.drug_id);
            return `unknown-${idx}`;
          };

          const seen = new Set<string>();
          const options: Array<{ id: string; name: string }> = [];
          meds.forEach((m: any, idx: number) => {
            const name = extractName(m, idx);
            if (!seen.has(name)) {
              seen.add(name);
              options.push({ id: name, name });
            }
          });
          // sort options by display name
          options.sort((a, b) => a.name.localeCompare(b.name));
          setAvailableDrugs(options);
          // default select first 3 if none selected
          if (selectedDrugs.length === 0 && options.length > 0) {
            setSelectedDrugs(options.slice(0, 3).map((o) => o.id));
          }
        }

        // Fetch events for range and aggregate per day per selected drug
        const res = await fetch(`/api/analytics/dispensing/events?${params.toString()}&limit=2000`);
        if (!res.ok) throw new Error('Failed to fetch dispensing events');
        const json = await res.json();
        const events = Array.isArray(json.data) ? json.data : [];

        // Initialize dates
        const countsMap: Map<string, Record<string, number>> = new Map();
        const s = new Date(startDate.toISOString().slice(0, 10));
        const e = new Date(endDate.toISOString().slice(0, 10));
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          countsMap.set(key, {});
        }

        const normalizeKey = (ev: any, idx = 0) => {
          const tryPaths = [
            'genericName',
            'drugName',
            'displayName',
            'name',
            'medicineName',
            'productName',
            'label',
            'drug_name',
          ];
          for (const p of tryPaths) {
            if (ev && ev[p] != null) {
              const s = String(ev[p]).trim();
              if (s) return s;
            }
            // nested drug object
            if (ev && ev.drug && ev.drug[p] != null) {
              const s = String(ev.drug[p]).trim();
              if (s) return s;
            }
          }
          // try ids
          if (ev && (ev.drugId || ev.drug_id || ev.drug || ev.id)) return String(ev.drugId ?? ev.drug_id ?? ev.drug ?? ev.id);
          return `unknown-${idx}`;
        };

        for (let i = 0; i < events.length; i++) {
          const ev = events[i];
          const ts = new Date(ev.timestamp);
          const day = ts.toISOString().slice(0, 10);
          const drugKey = normalizeKey(ev, i);
          const bucket = countsMap.get(day) || {};
          bucket[drugKey] = (bucket[drugKey] || 0) + 1;
          countsMap.set(day, bucket);
        }

        // If the meds API didn't provide usable names, build options from observed event keys
        const observedKeys = new Set<string>();
        for (const [, bucket] of countsMap) {
          for (const k of Object.keys(bucket)) observedKeys.add(k);
        }

        // Merge observed keys into availableDrugs if missing
        const currentIds = new Set(availableDrugs.map(d => d.id));
        const derived: Array<{ id: string; name: string }> = [];
        for (const k of Array.from(observedKeys)) {
          if (!currentIds.has(k)) derived.push({ id: k, name: k });
        }
        if (derived.length > 0) {
          const merged = [...availableDrugs, ...derived];
          merged.sort((a, b) => a.name.localeCompare(b.name));
          setAvailableDrugs(merged);
        }

        // Build output array including counts for selected drugs
        const selectedIds = selectedDrugs.length > 0 ? selectedDrugs : (availableDrugs.length > 0 ? availableDrugs.slice(0, 3).map(d => d.id) : Array.from(observedKeys).slice(0,3));
        const out: Point[] = Array.from(countsMap.keys()).sort().map((k) => {
          const row: any = { date: k, count: 0 };
          const bucket = countsMap.get(k) || {};
          // total count across all selected drugs
          let total = 0;
          for (const sd of selectedIds) {
            const val = bucket[sd] || 0;
            row[sd] = val;
            total += val;
          }
          row.count = total;
          return row as Point;
        });
        setData(out);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [startDate, endDate, pharmacyId]);

  if (loading) return <div style={{ padding: 12 }}>Loading trend...</div>;
  if (error) return <div style={{ padding: 12, color: 'red' }}>Error: {error}</div>;
  if (!data || data.length === 0) return <div style={{ padding: 12 }}>No data</div>;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
        <h3 style={{ margin: 0 }}>📈 Daily Dispensing Trend</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, color: '#6b7280', marginRight: 8, display: 'block', marginBottom: 6 }}>Compare drugs:</label>
            <DrugMultiSelect
              options={availableDrugs}
              selected={selectedDrugs}
              onChange={setSelectedDrugs}
              placeholder="Search & select drugs"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setChartType('line')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: chartType === 'line' ? '1px solid #3b82f6' : '1px solid #ddd',
                background: chartType === 'line' ? '#eef6ff' : 'white',
                cursor: 'pointer',
              }}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: chartType === 'bar' ? '1px solid #3b82f6' : '1px solid #ddd',
                background: chartType === 'bar' ? '#eef6ff' : 'white',
                cursor: 'pointer',
              }}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(v) => `Date: ${v}`} shared={false} />
              {/* default total series - only show when no specific drugs selected */}
              {selectedDrugs.length === 0 && (
                <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2} dot={false} />
              )}
              {/* per-drug series */}
              { (selectedDrugs.length > 0 ? selectedDrugs : availableDrugs.slice(0,3).map(d=>d.id)).map((id, idx) => {
                const colors = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4'];
                return <Line key={id} type="monotone" dataKey={id} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{ r: 3 }} />;
              })}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(v) => `Date: ${v}`} shared={false} />
              {selectedDrugs.length === 0 && <Bar dataKey="count" fill="#111827" />}
              { (selectedDrugs.length > 0 ? selectedDrugs : availableDrugs.slice(0,3).map(d=>d.id)).map((id, idx) => {
                const colors = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4'];
                return <Bar key={id} dataKey={id} fill={colors[idx % colors.length]} />;
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {(selectedDrugs.length > 0 ? selectedDrugs : availableDrugs.slice(0,3).map(d=>d.id)).map((id, idx) => {
          const colors = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#06b6d4'];
          const display = availableDrugs.find(d => d.id === id)?.name || id;
          return (
            <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, background: colors[idx % colors.length], borderRadius: 3 }} />
              <div style={{ fontSize: 13 }}>{display}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyDispensingTrend;
