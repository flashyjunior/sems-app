import React, { useState, useEffect } from 'react';

interface ServerConfig {
  serverUrl: string;
  syncInterval: number; // minutes
  autoSync: boolean;
}

export const ServerSettings: React.FC<{
  onSave?: (config: ServerConfig) => void;
  onClose?: () => void;
}> = ({ onSave, onClose }) => {
  const [config, setConfig] = useState<ServerConfig>({
    serverUrl: localStorage.getItem('serverUrl') || 'http://localhost:3000',
    syncInterval: parseInt(localStorage.getItem('syncInterval') || '15'),
    autoSync: localStorage.getItem('autoSync') !== 'false',
  });
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const response = await fetch(`${config.serverUrl}/api/health/database`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setConnectionStatus('success');
        setStatusMessage('[OK] Connected successfully to server');
      } else {
        setConnectionStatus('error');
        setStatusMessage(` Server returned status ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(` Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('serverUrl', config.serverUrl);
    localStorage.setItem('syncInterval', config.syncInterval.toString());
    localStorage.setItem('autoSync', config.autoSync.toString());
    
    onSave?.(config);
    onClose?.();
  };

  return (
    <div className="settings-panel">
      <h2>Server Settings</h2>
      
      <div className="setting-group">
        <label htmlFor="serverUrl">Server URL</label>
        <input
          id="serverUrl"
          type="url"
          value={config.serverUrl}
          onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
          placeholder="http://sems-server.local:3000"
          className="input-field"
        />
        <small>The URL of your SEMS backend server</small>
      </div>

      <div className="setting-group">
        <button
          onClick={handleTestConnection}
          disabled={testingConnection}
          className="btn-secondary"
        >
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </button>
        {connectionStatus !== 'idle' && (
          <div className={`status-message status-${connectionStatus}`}>
            {statusMessage}
          </div>
        )}
      </div>

      <div className="setting-group">
        <label htmlFor="syncInterval">Auto-Sync Interval (minutes)</label>
        <input
          id="syncInterval"
          type="number"
          min="1"
          max="120"
          value={config.syncInterval}
          onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
          className="input-field"
        />
        <small>How often to automatically sync data with the server (when online)</small>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={config.autoSync}
            onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
          />
          Enable Automatic Synchronization
        </label>
        <small>When enabled, app will sync data at the specified interval</small>
      </div>

      <div className="setting-actions">
        <button onClick={handleSave} className="btn-primary">
          Save Settings
        </button>
        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>
      </div>

      <style>{`
        .settings-panel {
          padding: 24px;
          max-width: 600px;
        }

        .setting-group {
          margin-bottom: 24px;
        }

        .setting-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .input-field {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        small {
          display: block;
          color: #666;
          margin-top: 4px;
        }

        .btn-primary, .btn-secondary {
          padding: 8px 16px;
          margin-right: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .btn-primary {
          background: #0070f3;
          color: white;
        }

        .btn-primary:hover {
          background: #0051cc;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #ccc;
        }

        .status-message {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .status-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .status-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .setting-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #ddd;
        }
      `}</style>
    </div>
  );
};
