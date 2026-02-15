'use client';

import React from 'react';
import { PendingDrugsManager } from '@/components/PendingDrugsManager';
import Link from 'next/link';

export default function PendingDrugsPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Drugs</h1>
          <p className="text-sm text-gray-600">Review and approve drug edits from pharmacists.</p>
        </div>
        <div>
          <Link href="/settings" className="text-sm text-gray-500 hover:underline">Back to Settings</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <PendingDrugsManager onBack={() => {}} />
      </div>
    </div>
  );
}
