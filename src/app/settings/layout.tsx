'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app';
import { Navbar } from '@/components/Navbar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const handleViewChange = (view: string) => {
    if (view === 'settings') {
      router.push('/settings');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar
        currentView={'settings' as any}
        onViewChange={handleViewChange as any}
        onLogout={logout}
        isAdmin={isAdmin}
        onNotificationTicketSelect={() => {}}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
