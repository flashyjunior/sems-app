import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

/**
 * POST /api/auth/token
 * Generate a JWT token for authenticated sessions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, roleId } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const token = signToken({
      userId: parseInt(userId),
      email,
      roleId: roleId || 1,
    });

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
