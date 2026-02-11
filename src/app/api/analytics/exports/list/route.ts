import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const jobs = await prisma.exportJob.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return new Response(JSON.stringify({ data: jobs }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
