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
    const { genericName, tradeName, strength, route, category, stgReference, contraindications, pregnancyCategory, warnings } = body;

    const drug = await prisma.drug.update({
      where: { id },
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
      },
    });

    return NextResponse.json({ success: true, data: drug });
  } catch (error) {
    console.error('Error updating drug:', error);
    return NextResponse.json({ error: 'Failed to update drug' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.drug.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Drug deleted' });
  } catch (error) {
    console.error('Error deleting drug:', error);
    return NextResponse.json({ error: 'Failed to delete drug' }, { status: 500 });
  }
}
