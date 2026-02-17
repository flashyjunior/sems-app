import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const countOnly = request.nextUrl.searchParams.get('count') === 'true';

    if (countOnly) {
      const total = await prisma.tempDrug.count({ where: { status: 'pending' } });
      return NextResponse.json({ success: true, total }, { status: 200 });
    }

    const tempDrugs = await prisma.tempDrug.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } });

    return NextResponse.json({ success: true, data: tempDrugs, total: tempDrugs.length }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError(`Error fetching temp drugs: ${errorMsg}`);
    return NextResponse.json({ success: false, error: 'Failed to fetch temp drugs', details: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { id, action } = body || {};

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Missing id or action' }, { status: 400 });
    }

    if (action === 'approve') {
      // move tempDrug to drugs and mark regimens approved
      const tempDrug = await prisma.tempDrug.findUnique({ where: { id } });
      if (!tempDrug) return NextResponse.json({ success: false, error: 'Temp drug not found' }, { status: 404 });

      const newDrug = await prisma.drug.create({
        data: {
          genericName: tempDrug.genericName,
          tradeName: tempDrug.tradeName,
          strength: tempDrug.strength,
          route: tempDrug.route,
          category: tempDrug.category,
          stgReference: tempDrug.stgReference,
          contraindications: tempDrug.contraindications,
          pregnancyCategory: tempDrug.pregnancyCategory,
          warnings: tempDrug.warnings,
        },
      });

      await prisma.tempDoseRegimen.updateMany({ where: { tempDrugId: id }, data: { status: 'approved' } });

      const approved = await prisma.tempDrug.update({ where: { id }, data: { status: 'approved', approvedByAdminId: null, approvedAt: new Date() } });

      return NextResponse.json({ success: true, message: 'Approved', newDrug, tempDrug: approved }, { status: 200 });
    } else if (action === 'reject') {
      const rejected = await prisma.tempDrug.update({ where: { id }, data: { status: 'rejected', approvedByAdminId: null, rejectionReason: body.rejectionReason || null } });
      await prisma.tempDoseRegimen.updateMany({ where: { tempDrugId: id }, data: { status: 'rejected', rejectionReason: body.rejectionReason || null } });
      return NextResponse.json({ success: true, message: 'Rejected', tempDrug: rejected }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError(`Error processing temp drug action: ${errorMsg}`);
    return NextResponse.json({ success: false, error: 'Failed to process action', details: errorMsg }, { status: 500 });
  }
}
