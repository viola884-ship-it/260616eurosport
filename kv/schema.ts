/**
 * KV Schema and Activity Log Helper Functions
 */

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: 'manager' | 'api' | 'system';
  action: 'view_order' | 'update_status' | 'send_message' | 'api_call' | 'login' | 'logout';
  target_type: 'order' | 'customer' | 'api';
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
}

const LOG_KEY_PREFIX = 'log:';

export async function writeActivityLog(
  env: { ACTIVITY_LOGS: KVNamespace },
  entry: ActivityLogEntry
): Promise<void> {
  const key = `${LOG_KEY_PREFIX}${entry.timestamp}:${entry.id}`;
  await env.ACTIVITY_LOGS.put(key, JSON.stringify(entry));
}

export async function readActivityLogs(
  env: { ACTIVITY_LOGS: KVNamespace },
  options: {
    action?: string;
    actor?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: ActivityLogEntry[]; total: number }> {
  const { action, actor, from, to, limit = 50, offset = 0 } = options;

  const prefix = LOG_KEY_PREFIX;
  const listResult = await env.ACTIVITY_LOGS.list({ prefix, limit: 1000 });

  let logs: ActivityLogEntry[] = listResult.keys
    .map((key) => {
      const value = listResult.values.find((v) => v.name === key.name);
      return value ? (JSON.parse(value.value as string) as ActivityLogEntry) : null;
    })
    .filter((log): log is ActivityLogEntry => log !== null);

  if (action) {
    logs = logs.filter((log) => log.action === action);
  }
  if (actor) {
    logs = logs.filter((log) => log.actor === actor);
  }
  if (from) {
    logs = logs.filter((log) => log.timestamp >= from);
  }
  if (to) {
    logs = logs.filter((log) => log.timestamp <= to);
  }

  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    logs: logs.slice(offset, offset + limit),
    total: logs.length,
  };
}

export function generateLogId(): string {
  return crypto.randomUUID();
}

export function createLogEntry(
  actor: ActivityLogEntry['actor'],
  action: ActivityLogEntry['action'],
  targetType: ActivityLogEntry['target_type'],
  targetId: string,
  details: Record<string, unknown> = {},
  ipAddress?: string
): ActivityLogEntry {
  return {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    actor,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: ipAddress,
  };
}