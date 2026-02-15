'use client';

import React from 'react';
import { DispenseRecordsViewer } from '@/components/DispenseRecordsViewer';
import Link from 'next/link';

export default function RecordsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dispense Records</h1>
          <p className="text-sm text-gray-600">View, print, and manage past records.</p>
        </div>
        <div>
          <Link href="/settings" className="text-sm text-gray-500 hover:underline">Back to Settings</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DispenseRecordsViewer />
      </div>
    </div>
  );
}
