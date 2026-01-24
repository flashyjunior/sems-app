import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { setCORSHeaders, handleCORS } from "@/lib/cors";
import { withRateLimit, getClientIP } from "@/lib/rate-limit";
import { createActivityLog } from "@/services/activity-log.service";
import { logInfo, logError } from "@/lib/logger";
import { AuthenticatedRequest } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === "GET") {
      // Get system settings from Prisma (cloud database)
      const settings = await prisma.systemSettings.findFirst();
      const response = NextResponse.json({ success: true, data: settings }, { status: 200 });
      return setCORSHeaders(response, req.headers.get("origin") || undefined);
    } else if (req.method === "PUT") {
      const body = await req.json();
      
      // Update or create system settings in Prisma (cloud database)
      const existingSettings = await prisma.systemSettings.findFirst();
      
      let settings;
      if (existingSettings) {
        settings = await prisma.systemSettings.update({
          where: { id: existingSettings.id },
          data: {
            facilityName: body.facilityName,
            facilityLogo: body.facilityLogo,
            address: body.address,
            phoneNumber: body.phone || body.phoneNumber,
            email: body.email,
            autoSyncEnabled: body.autoSyncEnabled,
            syncInterval: body.autoSyncInterval ? body.autoSyncInterval * 60 : body.syncInterval,
            dataRetention: body.dataRetention,
            dataRetentionUnit: body.dataRetentionUnit || 'days',
            auditLogging: body.auditLogging,
            updatedAt: new Date(),
          },
        });
      } else {
        settings = await prisma.systemSettings.create({
          data: {
            facilityName: body.facilityName,
            facilityLogo: body.facilityLogo,
            address: body.address,
            phoneNumber: body.phone || body.phoneNumber,
            email: body.email,
            autoSyncEnabled: body.autoSyncEnabled,
            syncInterval: body.autoSyncInterval ? body.autoSyncInterval * 60 : body.syncInterval,
            dataRetention: body.dataRetention,
            dataRetentionUnit: body.dataRetentionUnit || 'days',
            auditLogging: body.auditLogging,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      await createActivityLog(
        req.user!.userId,
        "UPDATE_SYSTEM_SETTINGS",
        "system-settings",
        undefined,
        body,
        getClientIP(req),
        req.headers.get("user-agent") || undefined
      );

      logInfo("System settings updated", { updatedBy: req.user!.userId });

      const response = NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
      return setCORSHeaders(response, req.headers.get("origin") || undefined);
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: "Method not allowed" }, { status: 405 }),
        req.headers.get("origin") || undefined
      );
    }
  } catch (error) {
    logError("Error in system settings endpoint", error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get("origin") || undefined);
  }
}

export const GET = withRateLimit(withAuth(handler));
export const PUT = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
