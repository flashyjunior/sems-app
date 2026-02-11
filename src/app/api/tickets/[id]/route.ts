import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * GET /api/tickets/[id]
 * Get a specific ticket with all its details
 */
async function handleGET(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/tickets\/([^/]+)/);
    if (!idMatch) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }
    const ticketId = idMatch[1];

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    if (!ticket) {
      // If a regular support ticket was not found, try to resolve an AlertTicket
      try {
        const alertTicket = await prisma.alertTicket.findUnique({
          where: { id: ticketId },
          include: {
            createdByUser: true,
            alert: {
              include: {
                dispensingEvent: true,
              },
            },
          },
        });

        if (alertTicket) {
          const high = alertTicket.alert;
          const evt = high?.dispensingEvent;

          // Map AlertTicket to ticket-like response expected by the UI
          return NextResponse.json({
            id: alertTicket.id,
            ticketNumber: `ALERT-${alertTicket.id}`,
            userId: alertTicket.createdByUser ? String(alertTicket.createdByUser.id) : null,
            userName: alertTicket.createdByUser ? alertTicket.createdByUser.fullName : 'System',
            userEmail: alertTicket.createdByUser ? alertTicket.createdByUser.email : null,
            title: `Risk Alert: ${high?.drugName || high?.id || 'unknown'}`,
            description: `Risk category: ${high?.riskCategory || 'unknown'}\nScore: ${high?.riskScore ?? 'N/A'}\nDispensingEvent: ${evt?.id || high?.dispensingEventId || 'N/A'}`,
            category: 'urgent',
            priority: 'high',
            origin: 'alert',
            status: 'open',
            attachments: [],
            createdAt: alertTicket.createdAt.getTime(),
            updatedAt: alertTicket.createdAt.getTime(),
            resolvedAt: null,
            closedAt: null,
            notes: alertTicket.note ? [{
              id: `alertnote-${alertTicket.id}`,
              ticketId: alertTicket.id,
              authorId: alertTicket.createdByUser ? String(alertTicket.createdByUser.id) : null,
              authorName: alertTicket.createdByUser ? alertTicket.createdByUser.fullName : 'System',
              content: alertTicket.note,
              isAdminNote: false,
              createdAt: alertTicket.createdAt.getTime(),
            }] : [],
            highRiskAlertId: high?.id || null,
            dispensingEventId: high?.dispensingEventId || evt?.id || null,
            dispenseRecordId: evt?.dispenseRecordId || null,
          });
        }
      } catch (e) {
        console.error('Error resolving alertTicket fallback:', e);
      }

      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check authorization - user can only view their own tickets unless they're admin
    if (ticket.userId !== user.id && user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Format response
    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId.toString(),
      userName: ticket.user.fullName,
      userEmail: ticket.user.email,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
      createdAt: ticket.createdAt.getTime(),
      updatedAt: ticket.updatedAt.getTime(),
      resolvedAt: ticket.resolvedAt?.getTime(),
      closedAt: ticket.closedAt?.getTime(),
      notes: ticket.notes.map((note: any) => ({
        id: note.id,
        ticketId: note.ticketId,
        authorId: note.userId.toString(),
        authorName: note.user.fullName,
        content: note.content,
        isAdminNote: note.isAdminNote,
        createdAt: note.createdAt.getTime(),
      })),
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tickets/[id]
 * Update a ticket (admin only for status/priority, user can add notes)
 */
async function handlePUT(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/tickets\/([^/]+)/);
    if (!idMatch) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }
    const ticketId = idMatch[1];

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, priority, title, description } = body;

    // Fetch ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check authorization
    const isAdmin = user.role?.name === 'admin';
    const isOwner = ticket.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Ticket creator and admins can update status and priority
    if ((status || priority) && !isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Only ticket creator or admins can update ticket status or priority' },
        { status: 403 }
      );
    }

    // Update ticket
    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    // Set resolved/closed timestamps if status changed
    if (status === 'resolved' && ticket.status !== 'resolved') {
      updateData.resolvedAt = new Date();
    }
    if (status === 'closed' && ticket.status !== 'closed') {
      updateData.closedAt = new Date();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: true,
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    // Notify user if status changed
    if (status && status !== ticket.status) {
      await prisma.ticketNotification.create({
        data: {
          ticketId: ticketId,
          userId: ticket.userId,
          type: 'ticket-updated',
          message: `Your ticket status has been updated to: ${status}`,
        },
      });
    }

    // Format response
    return NextResponse.json({
      id: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      userId: updatedTicket.userId.toString(),
      userName: updatedTicket.user.fullName,
      userEmail: updatedTicket.user.email,
      title: updatedTicket.title,
      description: updatedTicket.description,
      category: updatedTicket.category,
      priority: updatedTicket.priority,
      status: updatedTicket.status,
      attachments: updatedTicket.attachments ? JSON.parse(updatedTicket.attachments) : [],
      createdAt: updatedTicket.createdAt.getTime(),
      updatedAt: updatedTicket.updatedAt.getTime(),
      resolvedAt: updatedTicket.resolvedAt?.getTime(),
      closedAt: updatedTicket.closedAt?.getTime(),
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/[id]
 * Delete a ticket (admin only)
 */
async function handleDELETE(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/tickets\/([^/]+)/);
    if (!idMatch) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }
    const ticketId = idMatch[1];

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can delete tickets
    if (user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete ticket and all related data
    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);
export const DELETE = withAuth(handleDELETE);
