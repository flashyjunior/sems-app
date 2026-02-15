import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return new Response(JSON.stringify({ success: false, error: 'jobId required' }), { status: 400 });
    const job = await prisma.analyticsExport.findUnique?.({ where: { id: jobId } }) || null;
    return new Response(JSON.stringify({ success: true, data: job }), { status: 200 });
  } catch (err) {
    console.error('analytics exports', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
