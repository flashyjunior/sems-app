import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { sendTicketNoteEmail } from '@/services/email.service';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/tickets/[id]/notes
 * Add a note/comment to a ticket
 */
async function handlePOST(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from URL
    const url = new URL(request.url);
    const idMatch = url.pathname.match(/\/api\/tickets\/([^/]+)\/notes/);
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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Fetch ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true },
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

    // Create note
    const note = await prisma.ticketNote.create({
      data: {
        ticketId: ticketId,
        userId: user.id,
        content,
        isAdminNote: isAdmin,
      },
      include: { user: true },
    });

    // Format response immediately (don't wait for email/notifications)
    const response = {
      id: note.id,
      ticketId: note.ticketId,
      authorId: note.userId.toString(),
      authorName: note.user.fullName,
      content: note.content,
      isAdminNote: note.isAdminNote,
      createdAt: note.createdAt.getTime(),
    };

    // Create notification and send email in background (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const notificationUserId = isAdmin ? ticket.userId : undefined;

        if (notificationUserId) {
          // Create notification
          await prisma.ticketNotification.create({
            data: {
              ticketId: ticketId,
              userId: notificationUserId,
              type: 'admin-response',
              message: `Admin has responded to your ticket`,
            },
          });

          // Send email notification
          try {
            const smtpSettings = await prisma.sMTPSettings.findFirst({
              where: { enabled: true },
            });

            if (smtpSettings) {
              // Decrypt password before sending to email service
              const decryptedPassword = decrypt(smtpSettings.password);

              await sendTicketNoteEmail({
                ticketNumber: ticket.ticketNumber,
                ticketTitle: ticket.title,
                noteContent: content,
                authorName: user.fullName,
                isAdminNote: isAdmin,
                recipientEmail: ticket.user.email,
                smtpSettings: {
                  host: smtpSettings.host,
                  port: smtpSettings.port,
                  secure: smtpSettings.secure,
                  username: smtpSettings.username,
                  password: decryptedPassword, // Use decrypted password
                  fromEmail: smtpSettings.fromEmail,
                  fromName: smtpSettings.fromName,
                },
              });
            }
          } catch (emailError) {
            console.error('Error sending ticket note email:', emailError);
          }
        }
      } catch (bgError) {
        console.error('Background notification/email error:', bgError);
      }
    });

    // Return immediately without waiting for background tasks
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
