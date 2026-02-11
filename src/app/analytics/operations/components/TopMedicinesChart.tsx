'use client';

interface TopMedicinesData {
  drugId: string;
  genericName: string;
  count: number;
  prescriptions: number;
  otc: number;
  mostCommonRiskLevel: string;
}

interface TopMedicinesChartProps {
  data: TopMedicinesData[];
}

export function TopMedicinesChart({ data }: TopMedicinesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count || 0), 1);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-4">
      {data.map((medicine, idx) => {
        const widthPercent = ((medicine.count || 0) / maxCount) * 100;
        return (
          <div key={medicine.drugId} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {idx + 1}. {medicine.genericName}
                </p>
                <p className="text-xs text-gray-500">
                  {medicine.prescriptions} Rx - {medicine.otc} OTC
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">{medicine.count}</p>
                <p className={`text-xs px-2 py-1 rounded ${getRiskColor(medicine.mostCommonRiskLevel)} text-white font-semibold`}>
                  {medicine.mostCommonRiskLevel}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${getRiskColor(medicine.mostCommonRiskLevel)} opacity-80 group-hover:opacity-100`}
                style={{ width: `${widthPercent}%` }}
              ></div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-4 mt-6 text-sm text-gray-600 border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500"></div>
          <span>None</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500"></div>
          <span>High/Critical</span>
        </div>
      </div>
    </div>
  );
}
