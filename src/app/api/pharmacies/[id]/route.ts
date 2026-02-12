import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Extract ID from URL
    const url = new URL(req.url);
    const idMatch = url.pathname.match(/\/api\/pharmacies\/([^/]+)/);
    if (!idMatch) {
      return NextResponse.json(
        { error: 'Invalid pharmacy ID' },
        { status: 400 }
      );
    }
    const id = idMatch[1];

    if (req.method === 'GET') {
      // Get pharmacy by ID
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id },
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
          createdAt: true,
          _count: {
            select: { users: true, dispenseRecords: true }
          }
        },
      });

      if (!pharmacy) {
        return NextResponse.json(
          { error: 'Pharmacy not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: pharmacy,
      });

    } else if (req.method === 'PUT') {
      // Update pharmacy
      const body = await req.json();
      
      // Check if pharmacy exists
      const existingPharmacy = await prisma.pharmacy.findUnique({
        where: { id },
      });

      if (!existingPharmacy) {
        return NextResponse.json(
          { error: 'Pharmacy not found' },
          { status: 404 }
        );
      }

      // Check if name is unique (if changed)
      if (body.name && body.name !== existingPharmacy.name) {
        const nameExists = await prisma.pharmacy.findUnique({
          where: { name: body.name },
        });

        if (nameExists) {
          return NextResponse.json(
            { error: 'Pharmacy with this name already exists' },
            { status: 409 }
          );
        }
      }

      // Check if license number is unique (if changed)
      if (body.licenseNumber && body.licenseNumber !== existingPharmacy.licenseNumber) {
        const licenseExists = await prisma.pharmacy.findUnique({
          where: { licenseNumber: body.licenseNumber },
        });

        if (licenseExists) {
          return NextResponse.json(
            { error: 'Pharmacy with this license number already exists' },
            { status: 409 }
          );
        }
      }

      const updatedPharmacy = await prisma.pharmacy.update({
        where: { id },
        data: {
          name: body.name,
          location: body.location,
          address: body.address,
          phone: body.phone,
          email: body.email,
          licenseNumber: body.licenseNumber,
          manager: body.manager,
          isActive: body.isActive !== false,
          config: body.config ? JSON.stringify(body.config) : existingPharmacy.config,
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
        message: 'Pharmacy updated successfully',
        data: updatedPharmacy,
      });

    } else if (req.method === 'DELETE') {
      // Delete pharmacy (only if no users are assigned)
      const pharmacyWithUsers = await prisma.pharmacy.findUnique({
        where: { id },
        select: {
          _count: { select: { users: true } }
        }
      });

      if (!pharmacyWithUsers) {
        return NextResponse.json(
          { error: 'Pharmacy not found' },
          { status: 404 }
        );
      }

      if (pharmacyWithUsers._count.users > 0) {
        return NextResponse.json(
          { error: 'Cannot delete pharmacy with assigned users' },
          { status: 400 }
        );
      }

      await prisma.pharmacy.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Pharmacy deleted successfully',
      });

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
export const PUT = withAuth(handler);
export const DELETE = withAuth(handler);
