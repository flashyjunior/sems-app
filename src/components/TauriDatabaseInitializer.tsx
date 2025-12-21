/**
 * Tauri Database Initializer
 * Initializes SQLite database on app startup (if running in Tauri)
 */

'use client';

import { useEffect, useState } from 'react';

export function TauriDatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      // Only initialize if running in Tauri
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          // Dynamically import and initialize database
          const { initializeDatabase, ensureDefaultUsers, getDatabase } = await import(
            '@/lib/tauri-db'
          );

          console.log('🔧 Initializing Tauri SQLite database...');
          const db = await initializeDatabase();
          
          // Ensure default users exist
          await ensureDefaultUsers(db);
          
          console.log('✓ Tauri database initialized successfully');
          setInitialized(true);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error('✗ Failed to initialize Tauri database:', errorMsg);
          setError(errorMsg);
          // Don't block app startup, just log error
          setInitialized(true);
        }
      } else {
        // Not in Tauri, skip initialization
        setInitialized(true);
      }
    };

    initDb();
  }, []);

  // Don't render anything, just initialize
  if (error) {
    console.warn('Database initialization error (app can continue):', error);
  }

  return null;
}
