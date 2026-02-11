'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startDate.toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(endDate.toISOString().split('T')[0]);

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onDateRangeChange(start, end);
    setShowCustom(false);
  };

  const handleApplyCustom = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (start < end) {
      onDateRangeChange(start, end);
      setShowCustom(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handlePreset(7)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
          >
            Last 7 days
          </button>
          <button
            onClick={() => handlePreset(30)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
          >
            Last 30 days
          </button>
          <button
            onClick={() => handlePreset(90)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
          >
            Last 90 days
          </button>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition font-medium"
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyCustom}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
