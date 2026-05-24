/**
 * Orders List Handler
 * GET /orders with pagination and filtering
 */

import type { Env } from '../types';
import { jsonResponse, parseUrlParams } from './base';
import { loggingMiddleware } from '../middleware/logging';

export async function handleOrdersList(request: Request, env: Env, url: URL): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'api_call', targetType: 'api', targetId: 'list' });

  const params = parseUrlParams(url);
  const { status, limit, offset } = params;

  const orders = await getOrders(env.DB, { status, limit, offset });
  const total = await getOrdersCount(env.DB, { status });

  return jsonResponse({ orders, total, limit, offset });
}

async function getOrders(db: D1Database, options: { status?: string; limit: number; offset: number }): Promise<unknown[]> {
  let query = 'SELECT display_id, customer_name, customer_username, status, item_count, created_at FROM orders';
  const bindings: (string | number)[] = [];

  if (options.status) {
    query += ' WHERE status = ?';
    bindings.push(options.status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  bindings.push(options.limit, options.offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results;
}

async function getOrdersCount(db: D1Database, options: { status?: string }): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM orders';
  const bindings: string[] = [];

  if (options.status) {
    query += ' WHERE status = ?';
    bindings.push(options.status);
  }

  const result = await db.prepare(query).bind(...bindings).first<{ count: number }>();
  return result?.count || 0;
}