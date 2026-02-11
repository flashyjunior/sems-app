'use client';

import React, { useState, useEffect } from 'react';

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: string;
  database: {
    connected: boolean;
    error: string | null;
  };
  tables: {
    dispenseRecord: {
      exists: boolean;
      count: number;
      error: string | null;
    };
    user: {
      exists: boolean;
      count: number;
      error: string | null;
    };
  };
}

/**
 * Database Health Indicator - Shows PostgreSQL connection status
 */
export function DatabaseHealthIndicator() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/database');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to check database health:', error);
      setHealth({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: 'Failed to reach health endpoint',
        },
        tables: {
          dispenseRecord: { exists: false, count: 0, error: null },
          user: { exists: false, count: 0, error: null },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (!health) return null;

  const statusColor =
    health.status === 'healthy'
      ? 'bg-green-50 border-green-200'
      : health.status === 'degraded'
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

  const statusTextColor =
    health.status === 'healthy'
      ? 'text-green-800'
      : health.status === 'degraded'
      ? 'text-yellow-800'
      : 'text-red-800';

  const statusIcon =
    health.status === 'healthy'
      ? ''
      : health.status === 'degraded'
      ? ''
      : '';

  return (
    <div className={`border ${statusColor} rounded-lg p-3 text-sm`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 w-full text-left font-medium cursor-pointer hover:opacity-80 ${statusTextColor}`}
      >
        <span>{statusIcon}</span>
        <span>Database: {health.status.toUpperCase()}</span>
        <span className="ml-auto text-xs">
          {showDetails ? '' : ''}
        </span>
      </button>

      {showDetails && (
        <div className={`mt-2 space-y-2 text-xs ${statusTextColor} ml-6`}>
          <div>
            <strong>Connection:</strong>{' '}
            {health.database.connected ? '[OK] Connected' : ' Not Connected'}
            {health.database.error && (
              <div className="mt-1 font-mono bg-red-100 p-2 rounded break-words">
                {health.database.error}
              </div>
            )}
          </div>

          <div>
            <strong>DispenseRecord Table:</strong>{' '}
            {health.tables.dispenseRecord.exists ? `[OK] Exists (${health.tables.dispenseRecord.count} records)` : ' Not Found'}
            {health.tables.dispenseRecord.error && (
              <div className="mt-1 font-mono bg-red-100 p-2 rounded break-words">
                {health.tables.dispenseRecord.error}
              </div>
            )}
          </div>

          <div>
            <strong>User Table:</strong>{' '}
            {health.tables.user.exists ? `[OK] Exists (${health.tables.user.count} records)` : ' Not Found'}
            {health.tables.user.error && (
              <div className="mt-1 font-mono bg-red-100 p-2 rounded break-words">
                {health.tables.user.error}
              </div>
            )}
          </div>

          <button
            onClick={checkHealth}
            disabled={loading}
            className={`mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 ${loading ? 'cursor-not-allowed' : ''}`}
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>

          <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800 text-xs">
            <strong>Common Issues:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>PostgreSQL not running: Check if PostgreSQL service is active</li>
              <li>Connection string wrong: Verify DATABASE_URL in .env</li>
              <li>Schema not migrated: Run `npx prisma migrate dev`</li>
              <li>Missing tables: Run `npx prisma db push`</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
