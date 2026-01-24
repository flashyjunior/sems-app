import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * GET /api/notifications
 * Get user's unread notifications
 */
async function handleGET(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') !== 'false';

    const where: any = {
      userId: request.user.userId,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.ticketNotification.findMany({
      where,
      include: {
        ticket: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.ticketNotification.count({
      where: {
        userId: request.user.userId,
        read: false,
      },
    });

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n.id,
        ticketId: n.ticketId,
        ticketNumber: n.ticket.ticketNumber,
        ticketTitle: n.ticket.title,
        type: n.type,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.getTime(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/[id]
 * Mark notification as read
 */
async function handlePUT(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID required' },
        { status: 400 }
      );
    }

    const notification = await prisma.ticketNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== request.user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updated = await prisma.ticketNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);
