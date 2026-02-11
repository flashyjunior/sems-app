'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { KPISummary } from './components/KPISummary';
import { DailyTrendChart } from './components/DailyTrendChart';
import { TopMedicinesChart } from './components/TopMedicinesChart';
import { PeakHoursHeatmap } from './components/PeakHoursHeatmap';
import { DateRangeFilter } from './components/DateRangeFilter';
import { getDefaultDateRange } from '@/services/analytics/utils';

export default function OperationsDashboard() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<any>(null);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any>(null);
  const [error, setError] = useState('');

  // Fetch dashboard data
  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      // Fetch KPI Summary
      const kpiRes = await fetch(`/api/analytics/dispensing/summary?${params}`);
      if (!kpiRes.ok) throw new Error('Failed to fetch KPI data');
      const kpiJson = await kpiRes.json();
      setKpiData(kpiJson.data);

      // Fetch Top Medicines
      const medsRes = await fetch(`/api/analytics/dispensing/top-medicines?${params}&limit=10`);
      if (!medsRes.ok) throw new Error('Failed to fetch top medicines');
      const medsJson = await medsRes.json();
      setTopMedicines(medsJson.data || []);

      // Fetch Peak Hours
      const hoursRes = await fetch(`/api/analytics/dispensing/peak-hours?${params}`);
      if (!hoursRes.ok) throw new Error('Failed to fetch peak hours');
      const hoursJson = await hoursRes.json();
      setPeakHours(hoursJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh on mount and date range change
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  // Handle export
  const handleExport = () => {
    const csvContent = generateCSV();
    downloadCSV(csvContent, 'operations-dashboard.csv');
  };

  const generateCSV = () => {
    let csv = 'Operations Dashboard Report\n';
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    csv += `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;

    // KPI Summary
    if (kpiData) {
      csv += 'KPI Summary\n';
      csv += `Total Prescriptions,${kpiData.totalPrescriptions}\n`;
      csv += `Total OTC,${kpiData.totalOTC}\n`;
      csv += `High Risk Events,${kpiData.highRiskEvents}\n`;
      csv += `STG Compliance Rate,${kpiData.stgComplianceRate}%\n\n`;
    }

    // Top Medicines
    if (topMedicines.length > 0) {
      csv += 'Top Medicines\n';
      csv += 'Drug Name,Count,Prescriptions,OTC,Risk Level\n';
      topMedicines.forEach((med) => {
        csv += `${med.genericName},${med.count},${med.prescriptions},${med.otc},${med.mostCommonRiskLevel}\n`;
      });
    }

    return csv;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time dispensing analytics and KPIs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={new Date(dateRange.startDate)}
        endDate={new Date(dateRange.endDate)}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          {kpiData && <KPISummary data={kpiData} />}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend Chart */}
            {kpiData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h2>
                <DailyTrendChart data={kpiData.trend} />
              </div>
            )}

            {/* Peak Hours Heatmap */}
            {peakHours && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h2>
                <PeakHoursHeatmap data={peakHours} />
              </div>
            )}
          </div>

          {/* Top Medicines Chart */}
          {topMedicines.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Medicines</h2>
              <TopMedicinesChart data={topMedicines} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
