import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { 
      tempDrugId,
      drugId,
      ageMin,
      ageMax,
      weightMin,
      weightMax,
      ageGroup,
      doseMg,
      frequency,
      duration,
      maxDoseMgDay,
      route,
      instructions,
      createdByPharmacistId
    } = body;

    if (!tempDrugId || !doseMg || !frequency || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: tempDrugId, doseMg, frequency, duration' },
        { status: 400 }
      );
    }

    // Save to temporary dose regimens table
    const tempRegimen = await prisma.tempDoseRegimen.create({
      data: {
        tempDrugId,
        drugId: drugId || null,
        ageMin: ageMin || null,
        ageMax: ageMax || null,
        weightMin: weightMin || null,
        weightMax: weightMax || null,
        ageGroup: ageGroup || 'adult',
        doseMg,
        frequency,
        duration,
        maxDoseMgDay: maxDoseMgDay || null,
        route: route || 'oral',
        instructions: instructions || null,
        createdByPharmacistId: createdByPharmacistId ? String(createdByPharmacistId) : null,
        status: 'pending',
      },
    });

    return NextResponse.json(tempRegimen, { status: 201 });
  } catch (error) {
    console.error('Error creating temporary dose regimen:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create temporary dose regimen', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const status = request.nextUrl.searchParams.get('status');
    const tempDrugId = request.nextUrl.searchParams.get('tempDrugId');
    
    const where: any = {};
    if (status) where.status = status;
    if (tempDrugId) where.tempDrugId = tempDrugId;
    
    const tempRegimens = await prisma.tempDoseRegimen.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tempRegimens);
  } catch (error) {
    console.error('Error fetching temporary dose regimens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temporary dose regimens' },
      { status: 500 }
    );
  }
}
