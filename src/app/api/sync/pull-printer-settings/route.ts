import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma.server';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch printer settings from database
    const printers = await prisma.printerSettings.findMany({
      include: {
        printer: {
          select: {
            name: true,
            location: true,
            ipAddress: true,
            modelNumber: true,
            serialNumber: true,
            isDefault: true,
            isActive: true,
          },
        },
      },
    });

    // Transform to include printer info in settings
    const transformedPrinters = printers.map((settings: any) => ({
      id: settings.id,
      name: settings.printer?.name || 'Printer',
      location: settings.printer?.location,
      ipAddress: settings.printer?.ipAddress,
      paperSize: settings.paperSize,
      orientation: settings.orientation,
      colorMode: settings.colorMode,
      quality: settings.quality,
      copies: settings.copies,
      autoSync: settings.autoSync,
      syncInterval: settings.syncInterval,
      isDefault: settings.printer?.isDefault || false,
      isActive: settings.printer?.isActive || true,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPrinters,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching printer settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch printer settings' },
      { status: 500 }
    );
  }
}
