import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

async function handlePOST(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const alertId = body?.alertId;

    // Try to interpret alertId as a DispensingEvent id (numeric) first
    let dispensingEvent: any = null;
    if (alertId) {
      const asInt = parseInt(String(alertId), 10);
      if (!isNaN(asInt)) {
        dispensingEvent = await prisma.dispensingEvent.findUnique({ where: { id: asInt } });
      }
    }

    // Create a HighRiskAlert record if we have a dispensingEvent
    let highRiskAlert: any = null;
    if (dispensingEvent) {
      highRiskAlert = await prisma.highRiskAlert.create({ data: {
        dispensingEventId: dispensingEvent.id,
        timestamp: dispensingEvent.timestamp,
        pharmacyId: dispensingEvent.pharmacyId ?? undefined,
        userId: dispensingEvent.userId ?? undefined,
        drugId: dispensingEvent.drugId,
        riskScore: dispensingEvent.riskScore ?? undefined,
        riskCategory: dispensingEvent.riskCategory ?? undefined,
        riskFlags: dispensingEvent.riskFlags ?? undefined,
        message: `High risk detected for ${dispensingEvent.drugName || dispensingEvent.drugId}`,
      } });
    }

    // Determine assignee: prefer the requesting user so ticket appears in their tickets view
    let assignUserId = req.user?.userId ?? null;

    // Fallback to an admin user if we couldn't resolve requester
    if (!assignUserId) {
      try {
        const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
        if (adminRole) {
          const adminUser = await prisma.user.findFirst({ where: { roleId: adminRole.id } });
          if (adminUser) assignUserId = adminUser.id;
        }
      } catch (e) {}
    }

    const ticket = await prisma.ticket.create({ data: {
      ticketNumber: `T-${Date.now()}`,
      userId: assignUserId,
      title: `Alert: ${highRiskAlert ? 'High risk event' : 'Manual alert'}`,
      description: `Created from analytics alert ${alertId}`,
      category: 'urgent',
      priority: 'high',
    } });

    // Link ticket to alert
    const alertTicket = await prisma.alertTicket.create({ data: {
      ticketId: ticket.id,
      highRiskAlertId: highRiskAlert ? highRiskAlert.id : undefined,
      dispensingEventId: dispensingEvent ? dispensingEvent.id : undefined,
    } });

    return NextResponse.json({ success: true, data: { ticket: { id: ticket.id, ticketNumber: ticket.ticketNumber }, highRiskAlertId: highRiskAlert?.id, dispensingEventId: dispensingEvent?.id } }, { status: 201 });
  } catch (err) {
    console.error('analytics alerts/tickets', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export const POST = withAuth(handlePOST);
