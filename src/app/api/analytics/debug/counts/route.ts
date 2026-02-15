import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const dispensingCount = await prisma.dispensingEvent.count();
    const exportCount = (await prisma.analyticsExport?.count?.()) ?? 0;
    return new Response(JSON.stringify({ success: true, data: { dispensingCount, exportCount } }), { status: 200 });
  } catch (err) {
    console.error('analytics debug counts', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
