'use client';

import { TrendingUp, Pill, AlertTriangle, CheckCircle } from 'lucide-react';

interface KPISummaryProps {
  data: {
    totalPrescriptions: number;
    totalOTC: number;
    avgDispensingTime: number;
    prescriptionRatio: number;
    highRiskEvents: number;
    stgComplianceRate: number;
  };
}

export function KPISummary({ data }: KPISummaryProps) {
  const getRiskColor = (count: number) => {
    if (count === 0) return 'bg-green-50 border-green-200';
    if (count < 10) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'bg-green-50 border-green-200';
    if (rate >= 85) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Dispensings */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Dispensings</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(data.totalPrescriptions + data.totalOTC).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {data.totalPrescriptions.toLocaleString()} Rx, {data.totalOTC.toLocaleString()} OTC
            </p>
          </div>
          <Pill className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* High-Risk Events */}
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-red-500 ${getRiskColor(data.highRiskEvents)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">High-Risk Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.highRiskEvents}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((data.highRiskEvents / (data.totalPrescriptions + data.totalOTC)) * 100).toFixed(1)}% of total
            </p>
          </div>
          <AlertTriangle className="w-12 h-12 text-red-200" />
        </div>
      </div>

      {/* STG Compliance */}
      <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-green-500 ${getComplianceColor(data.stgComplianceRate)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">STG Compliance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.stgComplianceRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {data.stgComplianceRate >= 95 ? '[OK] Excellent' : data.stgComplianceRate >= 85 ? '[WARN] Good' : ' Needs improvement'}
            </p>
          </div>
          <CheckCircle className="w-12 h-12 text-green-200" />
        </div>
      </div>

      {/* Avg Dispensing Time */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Avg Dispensing Time</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.avgDispensingTime.toFixed(1)}m</p>
            <p className="text-xs text-gray-500 mt-1">Minutes per dispensing</p>
          </div>
          <TrendingUp className="w-12 h-12 text-purple-200" />
        </div>
      </div>
    </div>
  );
}
