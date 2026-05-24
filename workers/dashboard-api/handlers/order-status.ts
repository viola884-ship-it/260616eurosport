/**
 * Order Status Handler
 * PATCH /orders/:display_id/status
 */

import type { Env } from '../types';
import { jsonResponse } from './base';
import { loggingMiddleware } from '../middleware/logging';

const VALID_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

export async function handleOrderStatus(request: Request, env: Env, displayId: string): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (!status) {
    return jsonResponse({ error: 'Status is required' }, 400);
  }

  if (!VALID_STATUSES.includes(status)) {
    return jsonResponse({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, 400);
  }

  await loggingMiddleware(request, env, { action: 'update_status', targetType: 'order', targetId: displayId, details: { status } });

  const updated = await updateOrderStatus(env.DB, displayId, status);

  if (!updated) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  const order = await getOrderByDisplayId(env.DB, displayId);

  return jsonResponse({ success: true, order, notification_sent: false });
}

async function updateOrderStatus(db: D1Database, displayId: string, status: string): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db.prepare(
    'UPDATE orders SET status = ?, updated_at = ? WHERE display_id = ?'
  ).bind(status, now, displayId).run();

  if (result.success) {
    await db.prepare(
      'INSERT INTO order_status_transitions (order_id, from_status, to_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      (await db.prepare('SELECT id FROM orders WHERE display_id = ?').bind(displayId).first())?.id || 0,
      (await db.prepare('SELECT status FROM orders WHERE display_id = ?').bind(displayId).first())?.status || null,
      status,
      'manager',
      now
    ).run();
  }

  return result.success;
}

async function getOrderByDisplayId(db: D1Database, displayId: string): Promise<unknown | null> {
  return db.prepare(
    `SELECT o.*, c.name as customer_name, c.username as customer_username, c.telegram_id
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.display_id = ?`
  ).bind(displayId).first();
}