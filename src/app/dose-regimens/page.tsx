'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { DoseRegimenManagement } from '@/components/DoseRegimenManagement';

export default function DoseRegimensPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Dose Regimen Management</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage dose regimens based on age groups and patient weights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <DoseRegimenManagement />
        </div>
      </div>
    </div>
  );
}
