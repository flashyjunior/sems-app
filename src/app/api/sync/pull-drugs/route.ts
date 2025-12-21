import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma.server';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch drugs from database
    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      select: {
        id: true,
        genericName: true,
        tradeName: true,
        strength: true,
        route: true,
        category: true,
        stgReference: true,
        contraindications: true,
        pregnancyCategory: true,
        warnings: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: drugs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drugs' },
      { status: 500 }
    );
  }
}

