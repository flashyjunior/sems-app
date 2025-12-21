// Initialize SEMS on app load
'use client';

import { useEffect } from 'react';
import { initializeDatabase } from '@/utils/initialization';
import { useAppStore } from '@/store/app';

export function SEMSInitializer() {
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database with sample data
        await initializeDatabase();

        // Restore session if exists
        const session = localStorage.getItem('sems_auth_session');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            useAppStore.setState({
              user: parsed.user,
              isAuthenticated: true,
            });
          } catch {
            // Invalid session, user will need to login
          }
        }
      } catch (error) {
        console.error('SEMS initialization failed:', error);
      }
    };

    init();
  }, []);

  return null; // This component doesn't render anything
}
