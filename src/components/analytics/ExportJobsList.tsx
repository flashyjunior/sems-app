import React, { useEffect, useState } from 'react';
import styles from '@/app/styles-const';

interface Job {
  id: string;
  type: string;
  status: string;
  resultUrl?: string | null;
  createdAt: string;
}

export const ExportJobsList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/exports/list');
      const j = await res.json();
      if (j?.data) setJobs(j.data);
    } catch (e) {
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ ...styles.card, padding: '1rem' }}>
      <h4 style={{ marginTop: 0 }}>Recent Export Jobs</h4>
      {loading && <div>Loading...</div>}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {jobs.map(job => (
          <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <div>
              <div><strong>{job.type}</strong> - {new Date(job.createdAt).toLocaleString()}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{job.id}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div>{job.status}</div>
              {job.status === 'done' && (
                <a href={`/api/analytics/exports/download?jobId=${job.id}`} style={{ color: styles.primaryColor }}>Download</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExportJobsList;
