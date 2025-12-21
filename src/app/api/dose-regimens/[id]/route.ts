import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma.server';

interface Params {
  id: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { drugId, ageMin, ageMax, weightMin, weightMax, ageGroup, doseMg, frequency, duration, maxDoseMgDay, route, instructions } = body;

    const regimen = await prisma.doseRegimen.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: regimen });
  } catch (error) {
    console.error('Error updating dose regimen:', error);
    return NextResponse.json({ error: 'Failed to update dose regimen' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.doseRegimen.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Dose regimen deleted' });
  } catch (error) {
    console.error('Error deleting dose regimen:', error);
    return NextResponse.json({ error: 'Failed to delete dose regimen' }, { status: 500 });
  }
}
