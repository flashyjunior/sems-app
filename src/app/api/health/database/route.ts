import { NextRequest, NextResponse } from 'next/server';
import { writeLog } from '@/lib/file-logger';

/**
 * GET /api/health/database - Check database connection and schema status
 */
export async function GET(request: NextRequest) {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'unknown' as 'healthy' | 'degraded' | 'unhealthy' | 'unknown',
      config: {
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
        parsedUrl: null as any,
      },
      database: {
        connected: false,
        error: null as string | null,
      },
      tables: {
        dispenseRecord: { exists: false, count: 0, error: null as string | null },
        user: { exists: false, count: 0, error: null as string | null },
      },
    };

    // Parse and show DATABASE_URL (without password)
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        checks.config.parsedUrl = {
          username: url.username || 'not set',
          host: url.hostname,
          port: url.port || '5432',
          database: url.pathname.replace('/', ''),
          note: 'Password is masked for security',
        };
      } catch (e) {
        checks.config.parsedUrl = { error: 'Invalid URL format' };
      }
    }

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      checks.database.error = 'DATABASE_URL not set in .env file';
      checks.status = 'unhealthy';
      
      await writeLog({
        timestamp: Date.now(),
        level: 'error',
        category: 'api',
        message: 'Database health check failed: DATABASE_URL not set',
        data: checks,
      });

      return NextResponse.json(checks, { status: 503 });
    }

    // Try to load and test Prisma
    try {
      const prismaModule = await import('@/lib/prisma');
      const prisma = prismaModule.default;

      // Test connection with simple query
      await (prisma as any).$queryRaw`SELECT 1`;
      checks.database.connected = true;

      // Check if tables exist and count records
      try {
        const dispenseCount = await (prisma as any).dispenseRecord.count();
        checks.tables.dispenseRecord.exists = true;
        checks.tables.dispenseRecord.count = dispenseCount;
      } catch (error) {
        checks.tables.dispenseRecord.error = error instanceof Error ? error.message : String(error);
        checks.status = 'degraded';
      }

      try {
        const userCount = await (prisma as any).user.count();
        checks.tables.user.exists = true;
        checks.tables.user.count = userCount;
      } catch (error) {
        checks.tables.user.error = error instanceof Error ? error.message : String(error);
        checks.status = 'degraded';
      }

      if (checks.status === 'unknown') {
        checks.status = 'healthy';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      checks.database.error = errorMsg;
      checks.database.connected = false;
      checks.status = 'unhealthy';

      // Provide diagnostic hints based on error message
      if (errorMsg.includes('does not exist')) {
        checks.database.error += ' | Hint: Check DATABASE_URL - database name might be wrong in .env';
      } else if (errorMsg.includes('password')) {
        checks.database.error += ' | Hint: Check DATABASE_URL - password might be incorrect in .env';
      } else if (errorMsg.includes('ECONNREFUSED')) {
        checks.database.error += ' | Hint: PostgreSQL might not be running on the specified host/port';
      }
    }

    // Log results
    await writeLog({
      timestamp: Date.now(),
      level: checks.status === 'healthy' ? 'info' : 'warn',
      category: 'api',
      message: `Database health check: ${checks.status}`,
      data: checks,
    });

    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await writeLog({
      timestamp: Date.now(),
      level: 'error',
      category: 'api',
      message: `Database health check failed: ${errorMessage}`,
      data: {
        error: errorMessage,
      },
      stackTrace: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
      },
      { status: 503 }
    );
  }
}
