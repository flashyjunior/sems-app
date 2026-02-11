import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { sendTicketNotificationEmail } from '@/services/email.service';
import { decrypt } from '@/lib/encryption';

/**
 * GET /api/tickets
 * Get user's tickets with optional filtering
 */
async function handleGET(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true';

    // Build filter
    const where: any = {};

    // Only fetch all tickets if user is admin and requested
    if (!all) {
      where.userId = user.id;
    } else {
      // Check if user is admin
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        include: { role: true },
      });
      
      if (userWithRole?.role?.name !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can view all tickets' },
          { status: 403 }
        );
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch tickets with notes
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response
    const formattedTickets = tickets.map((ticket: any) => ({
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
    }));

    // Also include AlertTicket entries mapped to ticket-like objects
    let alertTicketFormatted: any[] = [];
    try {
      const alertWhere: any = {};
      if (!all) {
        // my-tickets view: only alert tickets created by the user
        alertWhere.createdBy = user.id;
      }

      const alertTickets = await prisma.alertTicket.findMany({
        where: alertWhere,
        include: { createdByUser: true, alert: { include: { dispensingEvent: true } } },
        orderBy: { createdAt: 'desc' },
      });

      alertTicketFormatted = alertTickets.map((a: any) => {
        const high = a.alert;
        const evt = high?.dispensingEvent;
        return {
          id: a.id,
          ticketNumber: `ALERT-${a.id}`,
          userId: a.createdByUser ? String(a.createdByUser.id) : null,
          userName: a.createdByUser ? a.createdByUser.fullName : 'System',
          userEmail: a.createdByUser ? a.createdByUser.email : null,
          title: `Risk Alert: ${high?.drugName || high?.id || 'unknown'}`,
          description: `Risk category: ${high?.riskCategory || 'unknown'}\nScore: ${high?.riskScore ?? 'N/A'}\nDispensingEvent: ${evt?.id || high?.dispensingEventId || 'N/A'}`,
          category: 'urgent',
          priority: 'high',
          status: 'open',
          attachments: [],
          createdAt: a.createdAt.getTime(),
          updatedAt: a.createdAt.getTime(),
          resolvedAt: null,
          closedAt: null,
          notes: a.note ? [{ id: `alertnote-${a.id}`, ticketId: a.id, authorId: a.createdByUser ? String(a.createdByUser.id) : null, authorName: a.createdByUser ? a.createdByUser.fullName : 'System', content: a.note, isAdminNote: false, createdAt: a.createdAt.getTime() }] : [],
          origin: 'alert',
          highRiskAlertId: high?.id || null,
          dispensingEventId: high?.dispensingEventId || evt?.id || null,
          dispenseRecordId: evt?.dispenseRecordId || null,
        };
      });
    } catch (e) {
      console.error('Error fetching alert tickets for list:', e);
    }

    // Merge and sort by createdAt desc
    const merged = [...formattedTickets, ...alertTicketFormatted].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
async function handlePOST(request: AuthenticatedRequest) {
  try {
    if (!request.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const priority = formData.get('priority') as string;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Handle attachments
    const attachments: { name: string; data: string; type: string; size: number }[] = [];
    const files = formData.getAll('attachments') as File[];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    
    for (const file of files) {
      try {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Skipping file ${file.name}: Exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          continue;
        }

        // Convert file to base64 and store metadata
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        // Validate base64 before storing
        if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
          console.warn(`Skipping file ${file.name}: Invalid base64 encoding`);
          continue;
        }
        
        attachments.push({
          name: file.name,
          data: base64,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      } catch (fileError) {
        console.error('Error processing attachment:', fileError);
        // Continue with other files if one fails
      }
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId: user.id,
        title,
        description,
        category,
        priority,
        status: 'open',
        attachments: JSON.stringify(attachments),
      },
      include: {
        user: true,
        notes: true,
      },
    });

    // Format response immediately (don't wait for email/notifications)
    const response = {
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
    };

    // Send email notification and create notifications in background (non-blocking)
    // Don't await these - let them run asynchronously after response is sent
    Promise.resolve().then(async () => {
      try {
        // Get SMTP settings for email
        const smtpSettings = await prisma.sMTPSettings.findFirst({
          where: { enabled: true },
        });

        // Send email notification to admin if SMTP is enabled
        if (smtpSettings) {
          try {
            // Decrypt password before sending to email service
            const decryptedPassword = decrypt(smtpSettings.password);

            await sendTicketNotificationEmail({
              ticketNumber: ticket.ticketNumber,
              title: ticket.title,
              description: ticket.description,
              category: ticket.category,
              priority: ticket.priority,
              userName: user.fullName,
              userEmail: user.email,
              adminEmail: smtpSettings.adminEmail,
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
          } catch (emailError) {
            console.error('Error sending ticket notification email:', emailError);
            // Don't fail - this is background task
          }
        }

        // Create in-app notification for admin
        const adminRole = await prisma.role.findFirst({
          where: { name: 'admin' },
        });

        if (adminRole) {
          const admins = await prisma.user.findMany({
            where: { roleId: adminRole.id },
          });

          for (const admin of admins) {
            await prisma.ticketNotification.create({
              data: {
                ticketId: ticket.id,
                userId: admin.id,
                type: 'ticket-created',
                message: `New ticket from ${user.fullName}: ${title}`,
              },
            });
          }
        }
      } catch (bgError) {
        // Log background task errors but don't affect response
        console.error('Error in ticket background tasks:', bgError);
      }
    });

    // Return response immediately without waiting for email/notifications
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);
