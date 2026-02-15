import { NextRequest } from 'next/server';
import { getPeakHours } from '@/services/analytics/aggregationEngine';
import { parseDateRange } from '@/services/analytics/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const pharmacyId = url.searchParams.get('pharmacyId') || undefined;

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ success: false, error: 'startDate and endDate are required' }), { status: 400 });
    }

    const { start, end } = parseDateRange(startDate, endDate);
    const data = await getPeakHours(start, end, pharmacyId);
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    console.error('analytics/dispensing/peak-hours error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
