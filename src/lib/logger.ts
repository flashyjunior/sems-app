const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Simple logger implementation (avoid Pino transport issues in Next.js Turbopack)
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = logLevels[LOG_LEVEL as keyof typeof logLevels] || 1;

const formatLog = (level: string, message: string, data?: any): LogEntry => ({
  timestamp: new Date().toISOString(),
  level: level.toUpperCase(),
  message,
  ...(data && { data }),
});

const shouldLog = (level: string): boolean => {
  return (logLevels[level as keyof typeof logLevels] || 0) >= currentLogLevel;
};

const output = (entry: LogEntry) => {
  const prefix = `[${entry.timestamp}] ${entry.level}`;
  if (entry.data) {
    console.log(`${prefix}: ${entry.message}`, JSON.stringify(entry.data, null, 2));
  } else {
    console.log(`${prefix}: ${entry.message}`);
  }
};

export const logger = {
  info: (data: any, message: string) => {
    if (shouldLog('info')) output(formatLog('info', message, data));
  },
  error: (data: any, message: string) => {
    if (shouldLog('error')) output(formatLog('error', message, data));
  },
  debug: (data: any, message: string) => {
    if (shouldLog('debug')) output(formatLog('debug', message, data));
  },
  warn: (data: any, message: string) => {
    if (shouldLog('warn')) output(formatLog('warn', message, data));
  },
};

// Structured logging helpers
export const logInfo = (message: string, data?: any) => {
  if (shouldLog('info')) output(formatLog('info', message, data));
};

export const logError = (message: string, error?: Error | any, data?: any) => {
  if (shouldLog('error')) {
    const errorData = {
      error: error instanceof Error ? error.message : String(error),
      ...data,
    };
    output(formatLog('error', message, errorData));
  }
};

export const logDebug = (message: string, data?: any) => {
  if (shouldLog('debug')) output(formatLog('debug', message, data));
};

export const logWarn = (message: string, data?: any) => {
  if (shouldLog('warn')) output(formatLog('warn', message, data));
};

// Audit log helper
export const logAudit = (
  userId: number,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  if (shouldLog('info')) {
    output(
      formatLog('info', 'AUDIT_LOG', {
        userId,
        action,
        resource,
        resourceId,
        changes,
        ipAddress,
        userAgent,
      })
    );
  }
};
