import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch dose regimens from database
    const regimens = await prisma.doseRegimen.findMany({
      where: { isActive: true },
      select: {
        id: true,
        drugId: true,
        ageMin: true,
        ageMax: true,
        weightMin: true,
        weightMax: true,
        ageGroup: true,
        doseMg: true,
        frequency: true,
        duration: true,
        maxDoseMgDay: true,
        route: true,
        instructions: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: regimens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dose regimens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dose regimens' },
      { status: 500 }
    );
  }
}
