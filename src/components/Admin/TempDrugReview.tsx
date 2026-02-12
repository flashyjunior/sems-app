'use client';

import React, { useEffect, useState } from 'react';

export default function TempDrugReview() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/temp-drugs', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      if (json.success) setItems(json.data || []);
    } catch (e) {
      console.error('Failed to fetch temp drugs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/temp-drugs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) });
      const json = await res.json();
      if (json.success) fetchPending();
    } catch (e) {
      console.error('Action failed', e);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Pending Drug Reviews</h3>
      {items.length === 0 && <div className="text-sm text-gray-500">No pending items</div>}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{it.genericName}</div>
              <div className="text-xs text-gray-500">Category: {it.category || 'unknown'}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => handleAction(it.id, 'approve')}>Approve</button>
              <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleAction(it.id, 'reject')}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
