import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { 
      genericName, 
      tradeName, 
      strength, 
      route, 
      category, 
      stgReference, 
      contraindications, 
      pregnancyCategory, 
      warnings,
      createdByPharmacistId 
    } = body;

    if (!genericName || !strength || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: genericName, strength, category' },
        { status: 400 }
      );
    }

    // Save to temporary drugs table
    const tempDrug = await prisma.tempDrug.create({
      data: {
        genericName,
        tradeName: tradeName || [],
        strength,
        route: route || 'oral',
        category,
        stgReference: stgReference || null,
        contraindications: contraindications || [],
        pregnancyCategory: pregnancyCategory || null,
        warnings: warnings || [],
        createdByPharmacistId: createdByPharmacistId ? String(createdByPharmacistId) : null,
        status: 'pending',
      },
    });

    return NextResponse.json(tempDrug, { status: 201 });
  } catch (error) {
    console.error('Error creating temporary drug:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to create temporary drug', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const status = request.nextUrl.searchParams.get('status');
    
    const where = status ? { status } : {};
    const tempDrugs = await prisma.tempDrug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tempDrugs);
  } catch (error) {
    console.error('Error fetching temporary drugs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temporary drugs' },
      { status: 500 }
    );
  }
}
