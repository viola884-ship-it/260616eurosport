/**
 * Base Handler
 * Auth guard, logging, error wrapper for all API handlers
 */

import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { loggingMiddleware } from '../middleware/logging';

export interface HandlerContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function withAuth<T>(
  handler: (ctx: HandlerContext) => Promise<T>,
  ctx: HandlerContext
): Promise<{ data?: T; error?: string; status?: number }> {
  const { authorized, response } = await authMiddleware(ctx.request, ctx.env);

  if (!authorized) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const data = await handler(ctx);
    return { data };
  } catch (error) {
    console.error('Handler error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

export async function withLogging<T>(
  handler: (ctx: HandlerContext) => Promise<T>,
  ctx: HandlerContext,
  logOptions: { action: string; targetType: 'order' | 'customer' | 'api'; targetId?: string; details?: Record<string, unknown> }
): Promise<T> {
  await loggingMiddleware(ctx.request, ctx.env, logOptions);
  return handler(ctx);
}

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'X-Session-Token',
      ...extraHeaders,
    },
  });
}

export function parseUrlParams(url: URL): { status?: string; limit?: number; offset?: number; customer_id?: number } {
  return {
    status: url.searchParams.get('status') || undefined,
    limit: parseInt(url.searchParams.get('limit') || '50', 10),
    offset: parseInt(url.searchParams.get('offset') || '0', 10),
    customer_id: url.searchParams.get('customer_id') ? parseInt(url.searchParams.get('customer_id')!, 10) : undefined,
  };
}