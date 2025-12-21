import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drugs = await prisma.drug.findMany({
      where: { isActive: true },
      orderBy: { genericName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: drugs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    return NextResponse.json({ error: 'Failed to fetch drugs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { genericName, tradeName, strength, route, category, stgReference, contraindications, pregnancyCategory, warnings } = body;

    if (!genericName || !strength) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const drug = await prisma.drug.create({
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

    return NextResponse.json({ success: true, data: drug }, { status: 201 });
  } catch (error) {
    console.error('Error creating drug:', error);
    return NextResponse.json({ error: 'Failed to create drug' }, { status: 500 });
  }
}
