import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders } from '@/lib/cors';
import { logInfo, logError } from '@/lib/logger';

async function handler(req: NextRequest) {
  try {
    // Ensure user is present (withAuth sets req.user) and is an admin role
    const authUser = (req as any).user;
    if (!authUser) {
      return setCORSHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), req.headers.get('origin') || undefined);
    }

    const userRole = await prisma.role.findUnique({ where: { id: authUser.roleId } });
    if (!userRole || userRole.name !== 'admin') {
      return setCORSHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }), req.headers.get('origin') || undefined);
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const countOnly = url.searchParams.get('count') === 'true';
      if (countOnly) {
        const count = await prisma.tempDrug.count({ where: { status: 'pending' } });
        return setCORSHeaders(NextResponse.json({ success: true, count }, { status: 200 }), req.headers.get('origin') || undefined);
      }

      const pending = await prisma.tempDrug.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });
      return setCORSHeaders(NextResponse.json({ success: true, data: pending }, { status: 200 }), req.headers.get('origin') || undefined);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { id, action } = body;
      if (!id) return setCORSHeaders(NextResponse.json({ error: 'Missing id' }, { status: 400 }), req.headers.get('origin') || undefined);

      const temp = await prisma.tempDrug.findUnique({ where: { id } });
      if (!temp) return setCORSHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }), req.headers.get('origin') || undefined);

      if (action === 'approve') {
        // Create a real Drug from temp
        const created = await prisma.drug.create({
          data: {
            genericName: temp.genericName,
            tradeName: temp.tradeName || [],
            strength: temp.strength || '',
            route: temp.route || 'oral',
            category: temp.category || 'unknown',
            stgReference: temp.stgReference || null,
            contraindications: temp.contraindications || [],
            pregnancyCategory: temp.pregnancyCategory || null,
            warnings: temp.warnings || [],
          },
        });

        await prisma.tempDrug.update({ where: { id }, data: { status: 'approved', approvedAt: new Date() } });

        return setCORSHeaders(NextResponse.json({ success: true, drug: created }, { status: 201 }), req.headers.get('origin') || undefined);
      }

      if (action === 'reject') {
        await prisma.tempDrug.update({ where: { id }, data: { status: 'rejected', updatedAt: new Date() } });
        return setCORSHeaders(NextResponse.json({ success: true }, { status: 200 }), req.headers.get('origin') || undefined);
      }

      return setCORSHeaders(NextResponse.json({ error: 'Unknown action' }, { status: 400 }), req.headers.get('origin') || undefined);
    }

    return setCORSHeaders(NextResponse.json({ error: 'Method not allowed' }, { status: 405 }), req.headers.get('origin') || undefined);
  } catch (error) {
    logError('Admin/temp-drugs error', error);
    return setCORSHeaders(NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 }), req.headers.get('origin') || undefined);
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
export const OPTIONS = (req: NextRequest) => new NextResponse(null, { status: 204 });
