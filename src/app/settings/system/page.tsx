'use client';

import React from 'react';
import { SystemSettingsEditor } from '@/components/SystemSettingsEditor';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div>
      <div className="mb-4 flex items-center">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Settings
        </Link>
      </div>
      <SystemSettingsEditor onBack={() => {}} />
    </div>
  );
}
