import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // Extract ID from URL path
    const url = new URL(req.url);
    const idMatch = url.pathname.match(/\/api\/users\/(\d+)\/pharmacy/);
    if (!idMatch) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }
    const userId = idMatch[1];

    if (req.method === 'GET') {
      // Get user's assigned pharmacy
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          email: true,
          fullName: true,
          pharmacyId: true,
          pharmacy: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: user,
      });
    } else if (req.method === 'PUT') {
      // Assign pharmacy to user
      const body = await req.json();
      const { pharmacyId } = body;

      if (!pharmacyId) {
        return NextResponse.json(
          { error: 'Pharmacy ID is required' },
          { status: 400 }
        );
      }

      // Verify pharmacy exists
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacyId },
        select: { id: true, name: true },
      });

      if (!pharmacy) {
        return NextResponse.json(
          { error: 'Pharmacy not found' },
          { status: 404 }
        );
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { pharmacyId },
        select: {
          id: true,
          email: true,
          fullName: true,
          pharmacyId: true,
          pharmacy: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `User assigned to pharmacy: ${pharmacy.name}`,
        data: updatedUser,
      });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    console.error('User pharmacy assignment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
export const PUT = withAuth(handler);
