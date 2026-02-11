import { NextRequest } from 'next/server';
import tickets from '@/lib/alert-tickets';
import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, note, createdBy } = body;
    if (!alertId) return new Response(JSON.stringify({ error: 'alertId required' }), { status: 400 });

    // Debug: log incoming payload for tracing
    try { console.info('[TICKET_CREATE] payload', { alertId, note, createdBy }); } catch (e) {}

    try {
      // First try to find a HighRiskAlert with the provided id
      let highAlert = await prisma.highRiskAlert.findUnique({ where: { id: alertId } });

      // If not found, perhaps the client provided a DispensingEvent id (common in the UI).
      // Try to locate a HighRiskAlert by dispensingEventId
      if (!highAlert) {
        highAlert = await prisma.highRiskAlert.findFirst({ where: { dispensingEventId: alertId } });
      }

      // If still not found, try to find the DispensingEvent and create a HighRiskAlert record
      if (!highAlert) {
        const evt = await prisma.dispensingEvent.findUnique({ where: { id: alertId } });
        if (evt) {
          // Log the dispensing event's pharmacyId so we can trace incorrect mappings
          try {
            logInfo('Creating HighRiskAlert from DispensingEvent', { evtId: evt.id, evtPharmacyId: evt.pharmacyId });
          } catch (e) {
            // non-fatal
          }

          // Create a minimal HighRiskAlert record so tickets can reference it
          highAlert = await prisma.highRiskAlert.create({
            data: {
              dispensingEventId: evt.id,
              pharmacyId: evt.pharmacyId,
              timestamp: evt.createdAt ?? evt.timestamp,
              drugName: evt.drugName,
              patientAgeGroup: evt.patientAgeGroup ?? 'unknown',
              riskScore: evt.riskScore ?? 0,
              riskCategory: evt.riskCategory ?? 'none',
              flags: evt.riskFlags ?? '[]',
            },
          });

          try {
            logInfo('HighRiskAlert created from DispensingEvent', { highRiskAlertId: highAlert.id, pharmacyId: highAlert.pharmacyId });
          } catch (e) {
            // non-fatal
          }
        }
      }

      if (!highAlert) {
        // Still no matching high-risk alert
        logError(`No HighRiskAlert or DispensingEvent found for id=${alertId}`, 'TICKET_CREATE_ERROR');
        return new Response(JSON.stringify({ error: 'No matching alert or event found' }), { status: 404 });
      }

      // Now create the ticket referencing the high-risk alert
      let t: any = null;
      try {
        t = await prisma.alertTicket.create({
          data: {
            alertId: highAlert.id,
            note: note || null,
            createdBy: typeof createdBy === 'number' ? createdBy : createdBy ? Number(createdBy) : null,
          },
        });
        try { console.info('[TICKET_CREATE] created alertTicket', { ticketId: t.id, alertId: t.alertId }); } catch (e) {}
      } catch (createTicketErr) {
        // Log and return error details for debugging
        try { console.error('[TICKET_CREATE] failed to create alertTicket', createTicketErr); } catch (e) {}
        return new Response(JSON.stringify({ error: 'failed to create ticket', detail: String(createTicketErr) }), { status: 500 });
      }

      // also keep in-memory for quick access
      try {
        tickets.create(highAlert.id, note || undefined);
      } catch (e) {
        // non-fatal
        logInfo(`In-memory ticket add failed for alert=${highAlert.id}`, { error: (e as Error).message });
      }

      // Return both ticket and the high-risk alert id (and dispensingEventId) for easier tracing
      return new Response(JSON.stringify({ data: t, highRiskAlertId: highAlert.id, dispensingEventId: highAlert.dispensingEventId }), { status: 201 });
    } catch (err) {
      logError('DB error creating alert ticket', err);
      return new Response(JSON.stringify({ error: 'db error', detail: err instanceof Error ? err.message : String(err) }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
