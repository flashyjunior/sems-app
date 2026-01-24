import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const { tempDrugId, adminId, approvalNotes } = await request.json();

    if (!tempDrugId || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: tempDrugId, adminId' },
        { status: 400 }
      );
    }

    // Get the temp drug
    const tempDrug = await prisma.tempDrug.findUnique({
      where: { id: tempDrugId },
    });

    if (!tempDrug) {
      return NextResponse.json(
        { error: 'Temporary drug not found' },
        { status: 404 }
      );
    }

    // Create new drug in main drugs table
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

    // Get all temp regimens for this drug
    const tempRegimens = await prisma.tempDoseRegimen.findMany({
      where: { tempDrugId },
    });

    // Create regimens in main table
    for (const tempRegimen of tempRegimens) {
      await prisma.doseRegimen.create({
        data: {
          drugId: newDrug.id,
          ageMin: tempRegimen.ageMin,
          ageMax: tempRegimen.ageMax,
          weightMin: tempRegimen.weightMin,
          weightMax: tempRegimen.weightMax,
          ageGroup: tempRegimen.ageGroup,
          doseMg: tempRegimen.doseMg,
          frequency: tempRegimen.frequency,
          duration: tempRegimen.duration,
          maxDoseMgDay: tempRegimen.maxDoseMgDay,
          route: tempRegimen.route,
          instructions: tempRegimen.instructions,
        },
      });

      // Mark temp regimen as approved
      await prisma.tempDoseRegimen.update({
        where: { id: tempRegimen.id },
        data: {
          status: 'approved',
          approvedByAdminId: adminId,
          approvedAt: new Date(),
        },
      });
    }

    // Mark temp drug as approved
    const approvedDrug = await prisma.tempDrug.update({
      where: { id: tempDrugId },
      data: {
        status: 'approved',
        approvedByAdminId: adminId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(
      { 
        message: 'Drug approved and moved to main table',
        newDrug,
        tempDrug: approvedDrug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error approving drug:', error);
    return NextResponse.json(
      { error: 'Failed to approve drug' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const { tempDrugId, adminId, rejectionReason } = await request.json();

    if (!tempDrugId || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: tempDrugId, adminId' },
        { status: 400 }
      );
    }

    // Mark temp drug as rejected
    const rejectedDrug = await prisma.tempDrug.update({
      where: { id: tempDrugId },
      data: {
        status: 'rejected',
        approvedByAdminId: adminId,
        rejectionReason: rejectionReason || null,
      },
    });

    // Mark related temp regimens as rejected
    await prisma.tempDoseRegimen.updateMany({
      where: { tempDrugId },
      data: {
        status: 'rejected',
        approvedByAdminId: adminId,
        rejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json(
      { 
        message: 'Drug rejected',
        tempDrug: rejectedDrug,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error rejecting drug:', error);
    return NextResponse.json(
      { error: 'Failed to reject drug' },
      { status: 500 }
    );
  }
}
