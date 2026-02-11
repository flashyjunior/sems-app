import { aggregateDailyMetrics } from './aggregationEngine';
import analyticsCache from '@/lib/analytics-cache';

export async function preaggregateRange(startDate: string, endDate: string, pharmacyId?: string) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const results: Array<{ date: string; ok: boolean }> = [];

  for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
    try {
      const dateCopy = new Date(dt);
      const metrics = await aggregateDailyMetrics(dateCopy, pharmacyId);
      // cache by date
      analyticsCache.set('dailySummary', { date: dateCopy.toISOString().slice(0,10), pharmacyId: pharmacyId || 'ALL' }, metrics, 60 * 60 * 24);
      results.push({ date: dateCopy.toISOString().slice(0,10), ok: true });
    } catch (err) {
      results.push({ date: new Date(dt).toISOString().slice(0,10), ok: false });
    }
  }

  return results;
}

export default { preaggregateRange };
