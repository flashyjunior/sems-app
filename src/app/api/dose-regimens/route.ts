import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma.server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const regimens = await prisma.doseRegimen.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: regimens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dose regimens:', error);
    return NextResponse.json({ error: 'Failed to fetch dose regimens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { drugId, ageMin, ageMax, weightMin, weightMax, ageGroup, doseMg, frequency, duration, maxDoseMgDay, route, instructions } = body;

    if (!drugId || !doseMg || !frequency || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const regimen = await prisma.doseRegimen.create({
      data: {
        drugId,
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
      },
    });

    return NextResponse.json({ success: true, data: regimen }, { status: 201 });
  } catch (error) {
    console.error('Error creating dose regimen:', error);
    return NextResponse.json({ error: 'Failed to create dose regimen' }, { status: 500 });
  }
}
