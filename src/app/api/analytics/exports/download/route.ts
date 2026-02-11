import { NextRequest } from 'next/server';
import jobs from '@/lib/job-queue';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return new Response(JSON.stringify({ error: 'jobId required' }), { status: 400 });

    // Try in-memory job first
    const job = jobs.getJob(jobId as string);
    if (job && job.status === 'done' && job.result?.content) {
      const csv = job.result.content as string;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${job.result.filename || 'export.csv'}"`,
        },
      });
    }

    // Fallback to DB lookup
    const db = await prisma.exportJob.findUnique({ where: { id: jobId as string } });
    if (!db) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });

    // If resultUrl points to an in-memory marker, try to resolve
    if (db.resultUrl && db.resultUrl.startsWith('inmemory://')) {
      const inId = db.resultUrl.replace('inmemory://', '');
      const inJob = jobs.getJob(inId);
      if (inJob && inJob.result?.content) {
        const csv = inJob.result.content as string;
        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${inJob.result.filename || 'export.csv'}"`,
          },
        });
      }
    }

    // If resultUrl is a file path, stream it
    if (db.resultUrl && db.resultUrl.startsWith('file://')) {
      try {
        const fs = await import('fs');
        const filePath = db.resultUrl.replace('file://', '');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          return new Response(content, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filePath.split(/[\\/]/).pop() || 'export.csv'}"`,
            },
          });
        }
      } catch (e) {
        // ignore
      }
    }

    // If resultUrl is an external URL, redirect
    if (db.resultUrl && db.resultUrl.startsWith('http')) {
      return new Response(null, { status: 302, headers: { Location: db.resultUrl } });
    }

    return new Response(JSON.stringify({ error: 'result not ready' }), { status: 202 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
