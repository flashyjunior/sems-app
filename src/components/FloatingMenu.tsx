'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, LogOut, RotateCcw, Settings, Bell, Home, CheckCircle, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/app';

interface FloatingMenuProps {
  onLogout: () => void;
  onSync?: () => void;
  onNavigate?: (view: 'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics') => void;
  currentView?: 'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics';
  isAdmin?: boolean;
  syncInProgress?: boolean;
  userName?: string;
  userRole?: string;
}

export function FloatingMenu({
  onLogout,
  onSync,
  onNavigate,
  currentView = 'dashboard',
  isAdmin = false,
  syncInProgress = false,
  userName,
  userRole,
}: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const syncStats = useAppStore((s) => s.syncConfig?.syncStats);
  const pendingCount = syncStats?.unsyncedCount || 0;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSync = () => {
    if (onSync && !syncInProgress) {
      onSync();
    }
  };

  const handleNavigate = (view: 'dashboard' | 'dispense' | 'settings' | 'tickets' | 'pending-drugs' | 'analytics') => {
    if (onNavigate) {
      onNavigate(view);
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => handleNavigate('dashboard'),
    },
    {
      id: 'dispense',
      label: 'Dispense',
      icon: RotateCcw,
      action: () => handleNavigate('dispense'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      action: () => handleNavigate('analytics'),
    },
    {
      id: 'support',
      label: 'Support',
      icon: Bell,
      action: () => handleNavigate('tickets'),
    },
    {
      id: 'sync',
      label: `Sync (${pendingCount} pending)`,
      icon: RotateCcw,
      action: handleSync,
      disabled: syncInProgress || pendingCount === 0,
      loading: syncInProgress,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'pending-drugs',
            label: 'Pending Drugs',
            icon: CheckCircle,
            action: () => handleNavigate('pending-drugs'),
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            action: () => handleNavigate('settings'),
          },
        ]
      : []),
    {
      id: 'logout',
      label: 'Logout',
      icon: LogOut,
      action: handleLogout,
      danger: true,
    },
  ];

  const visibleItems = menuItems;

  return (
    <div ref={menuRef} className="fixed bottom-8 right-8 z-50">
      {/* Menu Items (shown when open) */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* User Info Card */}
          {userName && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-blue-50 border border-blue-200">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600 capitalize">{userRole}</p>
              </div>
            </div>
          )}

          {visibleItems.map((item) => {
            const IconComponent = item.icon;
            const isDisabled = item.disabled || false;

            return (
              <button
                key={item.id}
                onClick={item.action}
                disabled={isDisabled}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg font-medium
                  transition-all duration-200 whitespace-nowrap
                  ${
                    item.danger
                      ? 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300'
                      : isDisabled
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
                  }
                  ${isDisabled ? 'opacity-60' : 'hover:shadow-xl'}
                `}
                title={item.label}
              >
                <IconComponent
                  size={20}
                  className={item.loading ? 'animate-spin' : ''}
                />
                <span className="text-sm">{item.label}</span>
                {item.badge && !item.loading && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-lg
          transition-all duration-200 hover:shadow-xl
          ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
        title={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
        {!isOpen && pendingCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
