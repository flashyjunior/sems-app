'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import type { DispenseRecord } from '@/types';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalDispenses: 0,
    todayDispenses: 0,
    pendingSync: 0,
    thisWeekDispenses: 0,
    thisMonthDispenses: 0,
    uniqueDrugs: 0,
    syncSuccess: 0,
  });

  const [topDrugs, setTopDrugs] = useState<Array<{ name: string; count: number }>>([]);
  const [dispensesTrend, setDispensesTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [topCustomers, setTopCustomers] = useState<Array<{ name: string; count: number }>>([]);
  const [customerTimeRange, setCustomerTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [trendChartType, setTrendChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const allRecords = await db.dispenseRecords.toArray();

        // Calculate time ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayMs = today.getTime();

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoMs = weekAgo.getTime();

        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoMs = monthAgo.getTime();

        // Calculate stats
        const todayDispenses = allRecords.filter(r => (r.timestamp || 0) >= todayMs).length;
        const thisWeekDispenses = allRecords.filter(r => (r.timestamp || 0) >= weekAgoMs).length;
        const thisMonthDispenses = allRecords.filter(r => (r.timestamp || 0) >= monthAgoMs).length;
        const pendingSync = allRecords.filter(r => !r.synced).length;
        const syncSuccess = allRecords.filter(r => r.synced).length;
        const uniqueDrugs = new Set(allRecords.map(r => r.drugId)).size;

        setStats({
          totalDispenses: allRecords.length,
          todayDispenses,
          thisWeekDispenses,
          thisMonthDispenses,
          pendingSync,
          uniqueDrugs,
          syncSuccess,
        });

        // Top drugs
        const drugCounts = new Map<string, number>();
        allRecords.forEach(r => {
          const count = drugCounts.get(r.drugName) || 0;
          drugCounts.set(r.drugName, count + 1);
        });
        const top10 = Array.from(drugCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopDrugs(top10);

        // Dispenses trend (last 7 days)
        const trendMap = new Map<string, number>();
        const dateKeys: { dateStr: string; dateObj: Date }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          trendMap.set(dateStr, 0);
          dateKeys.push({ dateStr, dateObj: new Date(date) });
        }

        allRecords.forEach(r => {
          if ((r.timestamp || 0) >= weekAgoMs) {
            const date = new Date(r.timestamp || 0);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const count = trendMap.get(dateStr) || 0;
            trendMap.set(dateStr, count + 1);
          }
        });

        // Sort dateKeys by actual date to ensure correct order
        dateKeys.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
        const trend = dateKeys.map(({ dateStr }) => ({ date: dateStr, count: trendMap.get(dateStr) || 0 }));
        setDispensesTrend(trend);

        // Top customers based on time range
        calculateTopCustomers(allRecords, customerTimeRange);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [customerTimeRange]);

  const calculateTopCustomers = (allRecords: DispenseRecord[], timeRange: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeRange === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const startMs = startDate.getTime();

    // Filter records within time range and group by patient name
    const customerCounts = new Map<string, number>();
    allRecords
      .filter(r => (r.timestamp || 0) >= startMs)
      .forEach(r => {
        const isUnknown = !r.patientName || r.patientName.trim() === '';
        const customerName = (isUnknown ? 'Unknown' : r.patientName) as string;
        const count = customerCounts.get(customerName) || 0;
        customerCounts.set(customerName, count + 1);
      });

    const top10 = Array.from(customerCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setTopCustomers(top10);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2 hidden">Overview of your dispensing activity</p>
      </div>

      {/* Key Metrics - Dispenses Related */}
      <div>
        <h3 className="text-md font-semibold text-gray-700 mb-3">Dispensing Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <MetricCard
            title="Total Dispenses"
            value={stats.totalDispenses}
            subtitle="All time"
            color="blue"
          />
          <MetricCard
            title="Today's Dispenses"
            value={stats.todayDispenses}
            subtitle="Today"
            color="green"
          />
          <MetricCard
            title="This Week"
            value={stats.thisWeekDispenses}
            subtitle="Last 7 days"
            color="indigo"
          />
          <MetricCard
            title="This Month"
            value={stats.thisMonthDispenses}
            subtitle="Last 30 days"
            color="cyan"
          />
          <MetricCard
            title="Unique Drugs"
            value={stats.uniqueDrugs}
            subtitle="Different drugs"
            color="pink"
          />
        </div>
      </div>

      {/* Key Metrics - Sync Related */}
      <div>
        <h3 className="text-md font-semibold text-gray-700 mb-3">Sync Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Pending Sync"
            value={stats.pendingSync}
            subtitle={stats.pendingSync > 0 ? 'Needs sync' : 'All synced'}
            color={stats.pendingSync > 0 ? 'orange' : 'green'}
          />
          <MetricCard
            title="Synced Records"
            value={stats.syncSuccess}
            subtitle="Successfully synced"
            color="purple"
          />
          <MetricCard
            title="Sync Success"
            value={`${stats.totalDispenses > 0 ? Math.round((stats.syncSuccess / stats.totalDispenses) * 100) : 0}%`}
            subtitle="Success rate"
            color="emerald"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Dispenses - Last 7 Days</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTrendChartType('bar')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  trendChartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setTrendChartType('line')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  trendChartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Line
              </button>
            </div>
          </div>
          {trendChartType === 'bar' ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dispensesTrend} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Total Dispenses', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dispensesTrend} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Total Dispenses', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Drugs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 10 Drugs</h3>
          <div className="space-y-3">
            {topDrugs.length > 0 ? (
              topDrugs.map((drug, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate pr-2">{drug.name}</span>
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                    {drug.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top 10 Customers</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCustomerTimeRange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                customerTimeRange === 'month'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setCustomerTimeRange('quarter')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                customerTimeRange === 'quarter'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setCustomerTimeRange('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                customerTimeRange === 'year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Year
            </button>
          </div>
        </div>

        <div className="flex justify-center py-8">
          <CustomerFunnel customers={topCustomers} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Sync Status"
          items={[
            { label: 'Successfully Synced', value: stats.syncSuccess },
            { label: 'Pending Sync', value: stats.pendingSync },
            { label: 'Total Records', value: stats.totalDispenses },
          ]}
        />
        <SummaryCard
          title="Time Period Summary"
          items={[
            { label: 'Today', value: stats.todayDispenses },
            { label: 'This Week', value: stats.thisWeekDispenses },
            { label: 'This Month', value: stats.thisMonthDispenses },
          ]}
        />
        <SummaryCard
          title="Drug Information"
          items={[
            { label: 'Unique Drugs', value: stats.uniqueDrugs },
            { label: 'Total Dispenses', value: stats.totalDispenses },
            { label: 'Avg per Drug', value: stats.uniqueDrugs > 0 ? Math.round(stats.totalDispenses / stats.uniqueDrugs) : 0 },
          ]}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'indigo' | 'cyan' | 'pink' | 'emerald';
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  const gradients = {
    blue: 'bg-gradient-to-br from-blue-600 to-blue-800',
    green: 'bg-gradient-to-br from-green-500 to-green-700',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
    purple: 'bg-gradient-to-br from-purple-600 to-purple-800',
    indigo: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
    cyan: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
    pink: 'bg-gradient-to-br from-pink-500 to-pink-700',
    emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
  };

  return (
    <div className={`rounded-2xl p-6 ${gradients[color]} text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer`}>
      <p className="text-sm font-medium text-white/80 mb-2">{title}</p>
      <p className="text-4xl font-bold mb-1">{value}</p>
      <p className="text-xs text-white/70">{subtitle}</p>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  items: Array<{ label: string; value: string | number }>;
}

function SummaryCard({ title, items }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CustomerFunnelProps {
  customers: Array<{ name: string; count: number }>;
}

const FUNNEL_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#6366f1', '#f97316', '#14b8a6',
  '#d946ef', '#0ea5e9', '#84cc16', '#f43f5e', '#6d28d9',
];

function CustomerFunnel({ customers }: CustomerFunnelProps) {
  if (customers.length === 0) {
    return <p className="text-gray-600 text-center py-8">No customer data available</p>;
  }

  const data = customers.map((customer, idx) => ({
    name: customer.name.length > 20 ? customer.name.substring(0, 17) + '...' : customer.name,
    value: customer.count,
    fill: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
    rank: idx + 1,
  }));

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.rank}. {payload[0].name}</p>
          <p className="text-sm text-gray-700">Dispenses: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Pie Chart - Left side */}
      <div className="lg:col-span-2 relative">
        <ResponsiveContainer width="100%" height={500}>
          <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 20 }}>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="60%"
              cy="50%"
              outerRadius={120}
              label={(entry) => `${entry.name} ${entry.value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - Right side */}
      <div className="lg:col-span-1 pt-8 ml-auto">
        <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto max-w-sm">
          {customers.map((customer, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 rounded transition hover:shadow-md whitespace-nowrap"
              style={{
                borderColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
                backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] + '08',
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: FUNNEL_COLORS[idx % FUNNEL_COLORS.length],
                }}
              />
              <span className="text-xs font-bold" style={{ color: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }}>
                #{idx + 1}
              </span>
              <span className="text-xs font-semibold text-gray-900 truncate">{customer.name}</span>
              <span className="text-xs font-bold text-gray-800 flex-shrink-0">{customer.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}