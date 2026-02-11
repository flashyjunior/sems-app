import { getPeakHours } from './aggregationEngine';

export async function detectAnomalies(startDate: string, endDate: string, pharmacyId?: string) {
  // simple scaffold: flag any hour with > 2x average as anomaly
  const peak = await getPeakHours(new Date(startDate), new Date(endDate), pharmacyId);
  const avg = peak.reduce((s, h) => s + h.count, 0) / (peak.length || 1);
  const anomalies = peak.filter(h => h.count > avg * 2).map(h => ({ hour: h.hour, count: h.count }));
  return { anomalies, avg };
}

export default { detectAnomalies };
