'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { SyncStatus } from './SyncStatus';
import { NotificationBell } from './NotificationBell';
import { ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics';
  onViewChange: (view: 'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics') => void;
  onLogout: () => void;
  isAdmin: boolean;
  onNotificationTicketSelect?: (ticketId: string) => void;
}

export function Navbar({ currentView, onViewChange, onLogout, isAdmin, onNotificationTicketSelect }: NavbarProps) {
  const user = useAppStore((s) => s.user);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch pending temp-drugs count for admin badge
  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      try {
        if (!isAdmin) return setPendingCount(null);
        const res = await fetch('/api/admin/temp-drugs?count=true', { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}` } });
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setPendingCount(json.count || 0);
        }
      } catch (e) {
        // ignore
      }
    }

    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isAdmin]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'dispense', label: 'Dispense', icon: '💊' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'tickets', label: 'Support', icon: '🎫' },
    // Admin-only items
    ...(isAdmin
      ? [
          { id: 'pending-drugs', label: 'Pending Drugs', icon: '⏳' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ]
      : []),
  ];

  const pharmacyName = user?.pharmacy?.name;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEMS</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">Smart Dispensing System</p>
            {pharmacyName && (
              <>
                <span className="text-sm text-gray-400">-</span>
                <p className="text-sm font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                   {pharmacyName}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <SyncStatus />
          <NotificationBell onNavigateToTicket={onNotificationTicketSelect} />

          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition"
            >
              {currentView === 'dashboard' && '📊 Dashboard'}
              {currentView === 'dispense' && '💊 Dispense'}
              {currentView === 'analytics' && '📊 Analytics'}
              {currentView === 'tickets' && '🎫 Support'}
              {currentView === 'pending-drugs' && '⏳ Pending Drugs'}
              {currentView === 'settings' && '⚙️ Settings'}
              <ChevronDown size={18} className={`transition ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(
                        item.id as
                          | 'dashboard'
                          | 'dispense'
                          | 'settings'
                          | 'tickets'
                          | 'analytics'
                          | 'pending-drugs'
                      );
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-2 transition ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.id === 'pending-drugs' && pendingCount && pendingCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-4 text-white bg-red-600 rounded">
                          {pendingCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
