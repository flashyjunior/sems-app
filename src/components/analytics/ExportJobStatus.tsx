import React, { useState, useEffect } from 'react';
import styles from '@/app/styles-const';

interface Props {
  jobId?: string;
}

export const ExportJobStatus: React.FC<Props> = ({ jobId: initialJobId }) => {
  const [jobId, setJobId] = useState(initialJobId || '');
  const [status, setStatus] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/exports?jobId=${id}`);
      const j = await res.json();
      if (j?.data) {
        setStatus(j.data.status);
        setFilename(j.data.filename || null);
      }
    } catch (e) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!jobId) return;
    checkStatus(jobId);
    const iv = setInterval(() => checkStatus(jobId), 3000);
    return () => clearInterval(iv);
  }, [jobId]);

  return (
    <div style={{ ...styles.card, padding: '1rem' }}>
      <h4>Export Job Status</h4>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Enter jobId" style={{ padding: '0.4rem', flex: 1 }} />
        <button onClick={() => checkStatus(jobId)} style={{ padding: '0.4rem 0.6rem' }}>Check</button>
      </div>

      {loading && <div>Checking...</div>}

      {status && (
        <div>
          <div><strong>Status:</strong> {status}</div>
          {status === 'done' && (
            <div style={{ marginTop: '0.5rem' }}>
              <a href={`/api/analytics/exports/download?jobId=${jobId}`} style={{ color: styles.primaryColor }}>Download {filename || 'export'}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportJobStatus;
