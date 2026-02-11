'use client';

interface HourData {
  hour: number;
  count: number;
  prescriptions?: number;
  avgRiskScore?: number;
}

interface PeakHoursData {
  hours: HourData[];
  peakHour: {
    hour: number;
    count: number;
    timeRange: string;
  };
  statistics: {
    totalTransactions: number;
    busyHours: number;
    avgPerHour: number;
  };
}

interface PeakHoursHeatmapProps {
  data: PeakHoursData;
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  if (!data || !data.hours || data.hours.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.hours.map((h) => h.count || 0), 1);

  const getHeatmapColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'bg-red-600';
    if (ratio > 0.6) return 'bg-orange-500';
    if (ratio > 0.4) return 'bg-yellow-500';
    if (ratio > 0.2) return 'bg-blue-400';
    return 'bg-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Heatmap Grid */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">24-Hour Distribution</p>
        <div className="grid grid-cols-12 gap-1">
          {data.hours.map((hour) => (
            <div key={hour.hour} className="flex flex-col items-center group">
              {/* Cell */}
              <div
                className={`w-full aspect-square ${getHeatmapColor(hour.count || 0)} rounded transition-all hover:opacity-80 cursor-pointer relative`}
              >
                {/* Tooltip */}
                <div className={`absolute -top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity`}>
                  <div className="font-semibold">{hour.hour}:00</div>
                  <div>Dispensings: {hour.count}</div>
                  {hour.prescriptions !== undefined && (
                    <div>Rx: {hour.prescriptions}</div>
                  )}
                  {hour.avgRiskScore !== undefined && (
                    <div>Avg Risk: {hour.avgRiskScore.toFixed(1)}</div>
                  )}
                </div>
              </div>

              {/* Hour label */}
              <p className="text-xs text-gray-600 mt-1">{hour.hour}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hour Indicator */}
      {data.peakHour && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm font-semibold text-red-900"> Peak Hour</p>
          <p className="text-lg font-bold text-red-600 mt-1">{data.peakHour.timeRange}</p>
          <p className="text-sm text-red-700 mt-1">{data.peakHour.count} dispensings</p>
        </div>
      )}

      {/* Statistics */}
      {data.statistics && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs text-gray-600 font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.totalTransactions.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs text-gray-600 font-medium">Busy Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.busyHours}</p>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs text-gray-600 font-medium">Avg Per Hour</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{data.statistics.avgPerHour.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
        <p className="font-semibold text-gray-700">Heat Intensity:</p>
        <div className="grid grid-cols-5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-200"></div>
            <span className="text-xs">Very Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-400"></div>
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600"></div>
            <span className="text-xs">Peak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
