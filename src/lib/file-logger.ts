/**
 * File-based logging system for troubleshooting
 * Stores logs in IndexedDB and provides download/view capabilities
 */

import { db } from './db';

export interface FileLog {
  id?: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  category?: string;
  data?: any;
  stackTrace?: string;
}

const MAX_LOGS = 5000; // Keep last 5000 logs
const LOG_TABLE = 'logs';

/**
 * Initialize logs table in IndexedDB if not exists
 */
export async function initLogsTable(): Promise<void> {
  try {
    // Check if logs table exists, if not we need to update schema
    const tables = Object.keys(db.tables);
    if (!tables.includes(LOG_TABLE)) {
      console.warn('Logs table not in schema, using fallback storage');
    }
  } catch (error) {
    console.error('Error initializing logs table:', error);
  }
}

/**
 * Write a log entry to persistent storage
 */
export async function writeLog(log: FileLog): Promise<void> {
  try {
    // Write to console first (always)
    const prefix = `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}`;
    if (log.data) {
      console.log(`${prefix}: ${log.message}`, log.data);
    } else {
      console.log(`${prefix}: ${log.message}`);
    }

    // Try to write to localStorage as fallback (since logs table may not exist in IndexedDB schema)
    try {
      const logs = getLogs();
      logs.push({
        ...log,
        id: `log-${Date.now()}-${Math.random()}`,
      });

      // Keep only last MAX_LOGS
      if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
      }

      localStorage.setItem('sems_logs', JSON.stringify(logs));
    } catch (storageError) {
      // localStorage might be full, just continue with console
      console.debug('Could not write to storage:', storageError);
    }
  } catch (error) {
    console.error('Error writing log:', error);
  }
}

/**
 * Get all stored logs
 */
export function getLogs(): FileLog[] {
  try {
    const stored = localStorage.getItem('sems_logs');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

/**
 * Get logs filtered by level and time
 */
export function getLogsByFilter(options: {
  level?: string;
  category?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}): FileLog[] {
  const logs = getLogs();
  let filtered = logs;

  if (options.level) {
    filtered = filtered.filter((log) => log.level === options.level);
  }

  if (options.category) {
    filtered = filtered.filter((log) => log.category === options.category);
  }

  if (options.startTime) {
    filtered = filtered.filter((log) => log.timestamp >= options.startTime!);
  }

  if (options.endTime) {
    filtered = filtered.filter((log) => log.timestamp <= options.endTime!);
  }

  if (options.limit) {
    filtered = filtered.slice(-options.limit);
  }

  return filtered;
}

/**
 * Get logs for sync operations
 */
export function getSyncLogs(): FileLog[] {
  return getLogsByFilter({
    category: 'sync',
    limit: 500,
  });
}

/**
 * Get logs for authentication
 */
export function getAuthLogs(): FileLog[] {
  return getLogsByFilter({
    category: 'auth',
    limit: 500,
  });
}

/**
 * Get error logs
 */
export function getErrorLogs(): FileLog[] {
  return getLogsByFilter({
    level: 'error',
    limit: 500,
  });
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  try {
    localStorage.removeItem('sems_logs');
  } catch (error) {
    console.error('Error clearing logs:', error);
  }
}

/**
 * Export logs as JSON
 */
export function exportLogsAsJSON(): string {
  const logs = getLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Export logs as CSV
 */
export function exportLogsAsCSV(): string {
  const logs = getLogs();

  if (logs.length === 0) {
    return 'timestamp,level,category,message,data\n';
  }

  const headers = ['timestamp', 'level', 'category', 'message', 'data'];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.level,
    log.category || '',
    `"${log.message.replace(/"/g, '""')}"`,
    log.data ? `"${JSON.stringify(log.data).replace(/"/g, '""')}"` : '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download logs as file
 */
export function downloadLogs(format: 'json' | 'csv' = 'json'): void {
  const content = format === 'json' ? exportLogsAsJSON() : exportLogsAsCSV();
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  const filename = `sems-logs-${new Date().toISOString().split('T')[0]}.${format}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get log statistics
 */
export function getLogStats(): {
  total: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  oldestLog: number | null;
  newestLog: number | null;
} {
  const logs = getLogs();

  const stats = {
    total: logs.length,
    byLevel: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    oldestLog: logs.length > 0 ? logs[0].timestamp : null,
    newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
  };

  logs.forEach((log) => {
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    if (log.category) {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    }
  });

  return stats;
}
