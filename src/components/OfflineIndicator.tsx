import React, { useEffect, useState } from 'react';
import { SyncService, SyncStatus } from '../services/SyncService';

export const OfflineIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>(SyncService.getInstance().getStatus());

  useEffect(() => {
    const unsubscribe = SyncService.getInstance().subscribeToStatus(setStatus);
    return unsubscribe;
  }, []);

  const getStatusText = () => {
    if (status.isSyncing) return 'Syncing...';
    if (!status.isOnline) return 'Offline Mode';
    if (status.pendingChanges > 0) return `${status.pendingChanges} pending changes`;
    return 'Online';
  };

  const getStatusColor = () => {
    if (status.isSyncing) return '#ff9800';
    if (!status.isOnline) return '#f44336';
    if (status.pendingChanges > 0) return '#ff9800';
    return '#4caf50';
  };

  return (
    <div className="offline-indicator">
      <div
        className="status-dot"
        style={{
          backgroundColor: getStatusColor(),
          opacity: status.isSyncing ? 0.7 : 1,
        }}
      />
      <span>{getStatusText()}</span>

      <style>{`
        .offline-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: ${status.isSyncing ? 'pulse' : 'none'} 1s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};
