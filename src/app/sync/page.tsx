'use client';

import React from 'react';
import { DataSyncManager } from '@/components/DataSyncManager';
import Link from 'next/link';

export default function SyncPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sync Cloud Data</h1>
          <p className="text-sm text-gray-600">Sync drugs, doses, printers, templates and more.</p>
        </div>
        <div>
          <Link href="/settings" className="text-sm text-gray-500 hover:underline">Back to Settings</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DataSyncManager />
      </div>
    </div>
  );
}
