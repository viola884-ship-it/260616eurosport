/**
 * Order Detail Handler
 * GET /orders/:display_id
 */

import type { Env } from '../types';
import { jsonResponse } from './base';
import { loggingMiddleware } from '../middleware/logging';

export async function handleOrderDetail(request: Request, env: Env, displayId: string): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'view_order', targetType: 'order', targetId: displayId });

  const order = await getOrderByDisplayId(env.DB, displayId);

  if (!order) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  return jsonResponse({ order });
}

async function getOrderByDisplayId(db: D1Database, displayId: string): Promise<unknown | null> {
  const orderResult = await db.prepare(
    `SELECT o.*, c.name as customer_name, c.username as customer_username, c.telegram_id
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.display_id = ?`
  ).bind(displayId).first();

  if (!orderResult) return null;

  const orderId = (orderResult as Record<string, unknown>).id as number;

  const itemsResult = await db.prepare(
    'SELECT link, sort_order FROM order_items WHERE order_id = ? ORDER BY sort_order'
  ).bind(orderId).all();

  const transitionsResult = await db.prepare(
    'SELECT from_status, to_status, changed_by, created_at FROM order_status_transitions WHERE order_id = ? ORDER BY created_at'
  ).bind(orderId).all();

  return {
    display_id: displayId,
    customer: {
      id: orderResult.customer_id,
      name: orderResult.customer_name,
      username: orderResult.customer_username,
      telegram_id: orderResult.telegram_id,
    },
    items: itemsResult.results,
    specs: orderResult.specs,
    status: orderResult.status,
    created_at: orderResult.created_at,
    updated_at: orderResult.updated_at,
    transitions: transitionsResult.results,
  };
}