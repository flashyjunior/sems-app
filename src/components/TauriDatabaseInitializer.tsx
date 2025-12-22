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
          const { initializeDatabase, ensureDefaultUsers, getDatabaseLocation } = await import(
            '@/lib/tauri-db'
          );

          console.log('🔧 Initializing Tauri SQLite database...');
          const db = await initializeDatabase();
          
          if (db) {
            // Ensure default users exist
            await ensureDefaultUsers(db);
            
            // Show database location for debugging
            const dbLocation = await getDatabaseLocation();
            console.log('📁 Database location:', dbLocation);
            
            console.log('✓ Tauri database initialized successfully');
          } else {
            console.warn('⚠️ Tauri database not available - running in web mode');
          }
          
          setInitialized(true);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error('✗ Database initialization error:', errorMsg);
          // Don't block app startup, just log error and continue
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
