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
    const { searchParams } = new URL(req.url);
    const printerId = searchParams.get("id");

    if (req.method === "GET") {
      let printers;
      if (printerId) {
        const printer = await prisma.printerSettings.findUnique({
          where: { id: printerId },
        });
        printers = printer ? [printer] : [];
      } else {
        printers = await prisma.printerSettings.findMany();
      }

      const response = NextResponse.json({ success: true, data: printers }, { status: 200 });
      return setCORSHeaders(response, req.headers.get("origin") || undefined);
    } else if (req.method === "POST") {
      const body = await req.json();
      const printer = await prisma.printerSettings.create({
        data: {
          name: body.name,
          address: body.address,
          port: body.port,
          protocol: body.protocol,
          isDefault: body.isDefault || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await createActivityLog(
        req.user!.userId,
        "CREATE_PRINTER",
        "printer",
        printer.id.toString(),
        { name: printer.name },
        getClientIP(req),
        req.headers.get("user-agent") || undefined
      );

      logInfo("Printer settings created", { createdBy: req.user!.userId, printerId: printer.id });

      const response = NextResponse.json(
        { success: true, data: printer },
        { status: 201 }
      );
      return setCORSHeaders(response, req.headers.get("origin") || undefined);
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: "Method not allowed" }, { status: 405 }),
        req.headers.get("origin") || undefined
      );
    }
  } catch (error) {
    logError("Error in printer settings endpoint", error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get("origin") || undefined);
  }
}

export const GET = withRateLimit(withAuth(handler));
export const POST = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
