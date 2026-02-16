import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { parseDateRange } from '@/services/analytics/dateUtils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const pharmacyId = url.searchParams.get('pharmacyId') || undefined;
    const stg = url.searchParams.get('stgCompliant');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 1000);

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ success: false, error: 'startDate and endDate are required' }), { status: 400 });
    }

    const { start, end } = parseDateRange(startDate, endDate);

    const where: any = {
      timestamp: { gte: start, lt: end },
    };
    if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') where.pharmacyId = pharmacyId;
    if (stg === 'true') where.stgCompliant = true;
    if (stg === 'false') where.stgCompliant = false;

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.dispensingEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispensingEvent.count({ where }),
    ]);

    // Resolve related users and dispense records (schema stores scalar keys)
    const userIds = Array.from(new Set(events.map((e: any) => e.userId).filter(Boolean)));
    const dispenseExternalIds = Array.from(new Set(events.map((e: any) => e.dispenseRecordId).filter(Boolean)));

    const [users, records] = await Promise.all([
      userIds.length > 0 ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true } }) : Promise.resolve([]),
      dispenseExternalIds.length > 0 ? prisma.dispenseRecord.findMany({ where: { externalId: { in: dispenseExternalIds } }, select: { externalId: true, patientName: true, patientPhoneNumber: true } }) : Promise.resolve([]),
    ]);

    const userMap = new Map(users.map((u: any) => [u.id, u.fullName]));
    type RecordInfo = { patientName: string | null; patientPhone: string | null };
    const recordMap = new Map<string, RecordInfo>(
      records.map((r: any) => [r.externalId, { patientName: r.patientName ?? null, patientPhone: r.patientPhoneNumber ?? null }])
    );

    const payload = events.map((e: any) => ({
      id: e.id,
      timestamp: e.timestamp,
      pharmacyId: e.pharmacyId,
      pharmacist: e.userId ? userMap.get(e.userId) ?? null : null,
      drugName: e.drugName,
      genericName: e.genericName,
      patientName: e.dispenseRecordId ? (recordMap.get(e.dispenseRecordId)?.patientName ?? null) : null,
      patientPhone: e.dispenseRecordId ? (recordMap.get(e.dispenseRecordId)?.patientPhone ?? null) : null,
      stgCompliant: e.stgCompliant,
      overrideFlag: e.overrideFlag,
      overrideReason: e.overrideReason ?? null,
      riskScore: e.riskScore,
      riskCategory: e.riskCategory,
      riskFlags: e.riskFlags ? (() => {
        try { return JSON.parse(e.riskFlags); } catch { return []; }
      })() : [],
    }));

    return new Response(JSON.stringify({ success: true, data: payload, pagination: { page, limit, total } }), { status: 200 });
  } catch (err) {
    console.error('analytics/dispensing/events error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
