import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

// GET all pending drugs
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const status = request.nextUrl.searchParams.get('status') || 'pending';
    
    const tempDrugs = await prisma.tempDrug.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch associated temp regimens for each drug
    const drugsWithRegimens = await Promise.all(
      tempDrugs.map(async (drug) => {
        const regimens = await prisma.tempDoseRegimen.findMany({
          where: { tempDrugId: drug.id },
        });
        return { ...drug, regimens };
      })
    );

    return NextResponse.json(drugsWithRegimens);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError(`Error fetching pending drugs: ${errorMsg}`);
    console.error('Error fetching pending drugs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending drugs', details: errorMsg },
      { status: 500 }
    );
  }
}
