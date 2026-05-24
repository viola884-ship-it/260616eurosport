/**
 * Activity Logs Handler
 * GET /activity-logs
 */

import type { Env } from '../types';
import { jsonResponse, parseUrlParams } from './base';
import { loggingMiddleware } from '../middleware/logging';

export async function handleActivityLogs(request: Request, env: Env, url: URL): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'api_call', targetType: 'api', targetId: 'activity-logs' });

  const params = parseUrlParams(url);
  const { action, actor, from, to, limit, offset } = params;

  const logs = await getActivityLogs(env, { action, actor, from, to, limit, offset });

  return jsonResponse(logs);
}

async function getActivityLogs(
  env: Env,
  options: { action?: string; actor?: string; from?: string; to?: string; limit: number; offset: number }
): Promise<{ logs: unknown[]; total: number }> {
  const { readActivityLogs } = await import('../lib/kv-schema');
  return readActivityLogs(env, options);
}