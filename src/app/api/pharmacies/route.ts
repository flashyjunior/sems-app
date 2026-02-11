import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (req.method === 'GET') {
      // List all pharmacies
      const pharmacies = await prisma.pharmacy.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          phone: true,
          email: true,
          manager: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { users: true, dispenseRecords: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({
        success: true,
        data: pharmacies,
        total: pharmacies.length
      });

    } else if (req.method === 'POST') {
      // Create new pharmacy
      const body = await req.json();
      
      const pharmacy = await prisma.pharmacy.create({
        data: {
          name: body.name,
          location: body.location,
          address: body.address,
          phone: body.phone,
          email: body.email,
          licenseNumber: body.licenseNumber,
          manager: body.manager,
          isActive: body.isActive !== false,
          config: body.config ? JSON.stringify(body.config) : null,
        },
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          phone: true,
          email: true,
          licenseNumber: true,
          manager: true,
          isActive: true,
          createdAt: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Pharmacy created successfully',
        data: pharmacy
      }, { status: 201 });

    } else {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Error handling pharmacy request:', error);
    return NextResponse.json({
      error: 'Failed to process pharmacy request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
