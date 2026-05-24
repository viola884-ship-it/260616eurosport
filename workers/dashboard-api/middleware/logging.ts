/**
 * Logging Middleware
 * Writes activity logs to KV on each request
 */

import type { Env, ActivityLogEntry } from '../types';
import { createLogEntry, writeActivityLog } from '../../kv/schema';

export async function loggingMiddleware(
  request: Request,
  env: Env,
  options: {
    action?: string;
    targetType?: 'order' | 'customer' | 'api';
    targetId?: string;
    details?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const sessionCookie = request.headers.get('Cookie') || '';
  const isManager = sessionCookie.includes('dashboard_session');

  const actor = isManager ? 'manager' : 'api';

  const entry = createLogEntry(
    actor,
    (options.action as ActivityLogEntry['action']) || 'api_call',
    options.targetType || 'api',
    options.targetId || 'unknown',
    options.details || {},
    ip
  );

  try {
    await writeActivityLog({ ACTIVITY_LOGS: env.ACTIVITY_LOGS }, entry);
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}