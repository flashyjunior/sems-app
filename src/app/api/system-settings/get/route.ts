import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/system-settings/get
 * Public endpoint to fetch system settings (used by print service)
 * No authentication required since it's just fetching facility info for printing
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    return NextResponse.json({
      success: true,
      data: settings || {
        facilityName: 'Licensed Community Pharmacy',
        pharmacyName: 'Licensed Community Pharmacy',
      },
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}
