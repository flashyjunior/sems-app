import { NextRequest } from 'next/server';
import jobs from '@/lib/job-queue';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate, endDate, pharmacyId, exportType } = body;
    if (!startDate || !endDate) return new Response(JSON.stringify({ error: 'startDate and endDate required' }), { status: 400 });

    const jobId = jobs.enqueue('export-csv', { startDate, endDate, pharmacyId, type: exportType || 'topMedicines' });
    try {
      await prisma.exportJob.create({ data: { id: jobId, type: 'export-csv', payload: JSON.stringify({ startDate, endDate, pharmacyId, exportType }) } });
    } catch (e) {
      // ignore DB errors but continue
    }
    return new Response(JSON.stringify({ data: { jobId } }), { status: 202 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return new Response(JSON.stringify({ error: 'jobId required' }), { status: 400 });
    let job = jobs.getJob(jobId as string);
    if (!job) {
      // try DB lookup
      const db = await prisma.exportJob.findUnique({ where: { id: jobId as string } });
      if (db) {
        job = { id: db.id, type: db.type, payload: JSON.parse(db.payload), status: db.status as any, result: db.resultUrl } as any;
      }
    }
    if (!job) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });

    if (job.status === 'done') {
      return new Response(JSON.stringify({ data: { status: job.status, filename: job.result?.filename } }));
    }

    return new Response(JSON.stringify({ data: { status: job.status } }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
