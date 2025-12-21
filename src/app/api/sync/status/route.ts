import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/lib/db';

/**
 * GET /api/sync/status - Get current sync statistics
 * Returns count of unsynced records and last sync time
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get sync statistics from IndexedDB via Dexie using filter
    const total = await db.dispenseRecords.count();
    const synced = await db.dispenseRecords
      .filter((record) => record.synced)
      .count();
    const unsynced = total - synced;

    return NextResponse.json({
      success: true,
      data: {
        unsyncedCount: unsynced,
        totalRecords: total,
        syncedCount: synced,
        syncPercentage: total > 0 ? Math.round((synced / total) * 100) : 0,
        lastSyncTime: null,
      },
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
