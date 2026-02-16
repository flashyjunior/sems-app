import { NextRequest, NextResponse } from "next/server";
import { userLoginSchema } from "@/lib/validations";
import { authenticateUser } from "@/services/user.service";
import { signToken } from "@/lib/jwt";
import { setCORSHeaders, handleCORS } from "@/lib/cors";
import { withRateLimit, getClientIP } from "@/lib/rate-limit";
import { createActivityLog } from "@/services/activity-log.service";
import { logInfo, logError } from "@/lib/logger";

async function handler(req: NextRequest): Promise<NextResponse> {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== "POST") {
      return setCORSHeaders(
        NextResponse.json(
          { error: "Method not allowed" },
          { status: 405 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = userLoginSchema.safeParse(body);
    if (!validation.success) {
      return setCORSHeaders(
        NextResponse.json(
          { 
            error: "Invalid request data", 
            details: validation.error.issues.map(issue => ({
              path: issue.path.join("."),
              message: issue.message
            }))
          },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    const { email, password } = validation.data;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    // Authenticate user
    const user = await authenticateUser(email, password);

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    // Log successful login
    await createActivityLog(
      user.id,
      "LOGIN",
      "auth",
      undefined,
      undefined,
      ipAddress,
      userAgent,
      "success"
    );

    logInfo("User login successful", { userId: user.id, email });

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          pharmacyId: user.pharmacyId ?? user.pharmacy?.id ?? null,
          pharmacy: user.pharmacy ? { id: user.pharmacy.id, name: user.pharmacy.name } : null,
        },
      },
      { status: 200 }
    );

    return setCORSHeaders(response, req.headers.get("origin") || undefined);
  } catch (error) {
    const ipAddress = getClientIP(req);
    const userAgent = req.headers.get("user-agent") || undefined;

    // Log failed login attempt
    await createActivityLog(
      0,
      "LOGIN_FAILED",
      "auth",
      undefined,
      undefined,
      ipAddress,
      userAgent,
      "failure",
      error instanceof Error ? error.message : "Unknown error"
    );

    // Temporary debug logging: capture message and stack (no secrets)
    try {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error && error.stack ? error.stack : undefined;
      logError("Login error (debug)", { message, stack, ipAddress });
    } catch (e) {
      // don't block the response on logging problems
      console.error('Failed to write debug login log', e);
    }

    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 }
    );

    return setCORSHeaders(response, req.headers.get("origin") || undefined);
  }
}

export const POST = withRateLimit(handler);
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
