import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Placeholder: return empty list or read from prisma.analyticsExport if available
    const exportsList = (await prisma.analyticsExport.findMany?.()) || [];
    return new Response(JSON.stringify({ success: true, data: exportsList }), { status: 200 });
  } catch (err) {
    console.error('analytics exports list', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
