import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch print templates from database
    const templates = await prisma.printTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        htmlTemplate: true,
        escposTemplate: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching print templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch print templates' },
      { status: 500 }
    );
  }
}
