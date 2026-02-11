'use client';

interface TrendDataPoint {
  hour: number;
  count: number;
  prescriptionCount?: number;
}

interface DailyTrendChartProps {
  data: TrendDataPoint[];
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate max value for scaling
  const maxCount = Math.max(...data.map((d) => d.count || 0), 1);

  // Get last 7 days or last item entries
  const displayData = data.slice(-24); // Show last 24 hours

  return (
    <div>
      <div className="flex items-end justify-between h-64 gap-1">
        {displayData.map((point, idx) => {
          const heightPercent = ((point.count || 0) / maxCount) * 100;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end group"
            >
              {/* Bar */}
              <div
                className={`w-full transition-colors ${
                  heightPercent > 70
                    ? 'bg-red-400'
                    : heightPercent > 40
                      ? 'bg-yellow-400'
                      : 'bg-blue-400'
                } hover:opacity-80 cursor-pointer relative`}
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                title={`${point.hour}:00 - ${point.count} dispensings`}
              >
                {/* Tooltip */}
                <div className={`absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity`}>
                  <div className="font-semibold">{point.hour}:00</div>
                  <div>Total: {point.count}</div>
                  {point.prescriptionCount !== undefined && (
                    <div>Rx: {point.prescriptionCount}</div>
                  )}
                </div>
              </div>

              {/* Hour label - show every 4th */}
              {idx % 4 === 0 && (
                <p className="text-xs text-gray-600 mt-2">{point.hour}h</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400"></div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
