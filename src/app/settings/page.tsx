'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsMenu } from '@/components/SettingsMenu';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configure your application, manage users, and customize your system.</p>
        </div>
        <div>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <SettingsMenu showHeader={false} />
    </div>
  );
}
