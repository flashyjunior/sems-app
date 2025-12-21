import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/services/settings";
import { withAuth } from "@/lib/auth-middleware";
import { setCORSHeaders, handleCORS } from "@/lib/cors";
import { withRateLimit, getClientIP } from "@/lib/rate-limit";
import { createActivityLog } from "@/services/activity-log.service";
import { logInfo, logError } from "@/lib/logger";
import { AuthenticatedRequest } from "@/lib/auth-middleware";

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === "GET") {
      const userId = req.user!.userId.toString();
      const profile = await settingsService.getUserProfile(userId);
      const response = NextResponse.json({ success: true, data: profile }, { status: 200 });
      return setCORSHeaders(response, req.headers.get("origin") || undefined);
    } else if (req.method === "PUT") {
      const body = await req.json();
      const userId = req.user!.userId.toString();
      const profile = await settingsService.updateUserProfile(userId, body);

      await createActivityLog(
        req.user!.userId,
        "UPDATE_PROFILE",
        "user-profile",
        userId,
        body,
        getClientIP(req),
        req.headers.get("user-agent") || undefined
      );

      logInfo("User profile updated", { userId });

      const response = NextResponse.json(
        { success: true, data: profile },
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
    logError("Error in user profile endpoint", error);
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
