import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Attach a request ID + structured access log to every request.
// The ID is exposed via the X-Request-Id response header so the frontend
// (or a support ticket) can correlate a user-visible issue with server logs.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  // Respect inbound request IDs (from reverse proxy or upstream client).
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
    ? incoming
    : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

function log(level: 'info' | 'warn' | 'error', payload: Record<string, unknown>) {
  // Single-line JSON — easy to ship to CloudWatch, Loki, Datadog, etc.
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...payload });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function accessLog(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log(level, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  });
  next();
}

// Centralized error handler — ensures uncaught errors become JSON responses
// rather than leaking stack traces, while still logging them with request ID.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  log('error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    message,
    stack,
  });
  if (res.headersSent) return;
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
  });
}

export const logger = {
  info: (payload: Record<string, unknown>) => log('info', payload),
  warn: (payload: Record<string, unknown>) => log('warn', payload),
  error: (payload: Record<string, unknown>) => log('error', payload),
};
