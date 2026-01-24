import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

/**
 * GET /api/sync/pull-tickets
 * Pull all tickets from cloud to client
 */
async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') {
      // Fetch all tickets from PostgreSQL
      const pgTickets = await prisma.ticket.findMany({
        include: {
          user: true,
          notes: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logInfo('Fetched tickets from PostgreSQL', { count: pgTickets.length });

      // Convert to client format
      const tickets = pgTickets.map((ticket: any) => ({
        id: ticket.id.toString(),
        ticketNumber: ticket.ticketNumber,
        userId: ticket.userId.toString(),
        userName: ticket.user?.fullName || ticket.user?.email || 'Unknown',
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        attachments: ticket.attachments || [],
        synced: true,
        syncedAt: ticket.createdAt.getTime(),
        createdAt: ticket.createdAt.getTime(),
        updatedAt: ticket.updatedAt.getTime(),
        notes: (ticket.notes || []).map((note: any) => ({
          id: note.id.toString(),
          ticketId: note.ticketId.toString(),
          userId: note.userId.toString(),
          content: note.content,
          isAdminNote: note.isAdminNote,
          synced: true,
          createdAt: note.createdAt.getTime(),
        })),
      }));

      logInfo('Prepared tickets for client', { count: tickets.length });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Tickets fetched successfully',
          count: tickets.length,
          tickets: tickets,
        },
        { status: 200 }
      );

      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    logError('Error in pull-tickets endpoint', error);
    const response = NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const POST = withAuth(handler);
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
