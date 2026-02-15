'use client';

import React, { useState, useEffect } from 'react';
import {
  getLogs,
  getSyncLogs,
  getErrorLogs,
  getLogStats,
  downloadLogs,
  clearLogs,
} from '@/lib/file-logger';
import type { FileLog } from '@/lib/file-logger';

interface LogsViewerProps {
  className?: string;
  isFullPage?: boolean;
}

/**
 * Logs Viewer Component - View and manage logs for troubleshooting
 */
export function LogsViewer({ className = '', isFullPage = false }: LogsViewerProps) {
  const [isOpen, setIsOpen] = useState(isFullPage ? true : false);
  const [logs, setLogs] = useState<FileLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Load logs on mount and when opening
  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  const refreshLogs = () => {
    let filtered = getLogs();

    if (filterLevel !== 'all') {
      filtered = filtered.filter((log) => log.level === filterLevel);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((log) => log.category === filterCategory);
    }

    setLogs(filtered.slice(-100)); // Show last 100
    setStats(getLogStats());
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      clearLogs();
      setLogs([]);
      setStats(null);
    }
  };

  const handleDownload = (format: 'json' | 'csv') => {
    downloadLogs(format);
  };

  const handleCopyToClipboard = () => {
    const logsText = logs
      .map((log) => `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');

    navigator.clipboard.writeText(logsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen && !isFullPage) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        title="View application logs for troubleshooting"
      >
         Logs
      </button>
    );
  }

  const LogsContent = () => (
    <div className="bg-white rounded-lg shadow-2xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Application Logs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total logs: {stats?.total || 0} | Errors: {stats?.byLevel?.error || 0} | Warnings:{' '}
              {stats?.byLevel?.warn || 0}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 p-4 bg-white flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                refreshLogs();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                refreshLogs();
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="sync">Sync</option>
              <option value="auth">Auth</option>
              <option value="api">API</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={refreshLogs}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No logs match the selected filters</div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border-l-4 ${
                    log.level === 'error'
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : log.level === 'warn'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                      : log.level === 'debug'
                      ? 'bg-gray-100 border-gray-400 text-gray-700'
                      : 'bg-blue-50 border-blue-500 text-blue-900'
                  }`}
                >
                  <div className="font-semibold">
                    [{new Date(log.timestamp).toISOString()}] {log.level.toUpperCase()}
                    {log.category && ` [${log.category}]`}
                  </div>
                  <div>{log.message}</div>
                  {log.data && (
                    <div className="mt-1 text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-2 flex-wrap justify-end">
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            {copied ? '[OK] Copied' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Download JSON
          </button>
          <button
            onClick={() => handleDownload('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
  );

  if (isFullPage) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Application Logs</h2>
        </div>
        <LogsContent />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <LogsContent />
    </div>
  );
}
