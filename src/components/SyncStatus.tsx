'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app';
import { syncService } from '@/services/sync';
import { syncController } from '@/services/sync-controller';
import SyncControl from '@/components/SyncControl';
import type { SyncStatus as SyncStatusType } from '@/types';

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusType | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Initialize on mount - get token from localStorage
  useEffect(() => {
    setMounted(true);
    
    // Try to get token from localStorage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('authToken') 
      : null;
    
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Initialize sync controller when token is available
  useEffect(() => {
    if (authToken && mounted) {
      syncController.initialize({
        apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        authToken: authToken,
      }).catch(console.error);
    }
  }, [authToken, mounted]);

  useEffect(() => {
    const unsubscribe = syncService.onStatusChange(setStatus);
    syncService.getSyncStatus().then((syncStatus) => {
      console.log('SyncStatus Component - Initial status:', syncStatus);
      setStatus(syncStatus);
    });
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Sync Control Component */}
      {authToken && <SyncControl apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} authToken={authToken} />}
      
      {/* Online/Offline Status */}
      {status && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-3 h-3 rounded-full ${
              status.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-gray-700">
            {status.isOnline ? 'Online' : 'Offline'}
          </span>
          {status.pendingCount > 0 && (
            <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
              {status.pendingCount} pending
            </span>
          )}
        </div>
      )}
    </div>
  );
}
