/**
 * Customer Detail Handler
 * GET /customers/:id
 */

import type { Env } from '../types';
import { jsonResponse } from './base';
import { loggingMiddleware } from '../middleware/logging';

export async function handleCustomerDetail(request: Request, env: Env, customerId: number): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'api_call', targetType: 'customer', targetId: customerId.toString() });

  const customer = await getCustomerById(env.DB, customerId);

  if (!customer) {
    return jsonResponse({ error: 'Customer not found' }, 404);
  }

  const orders = await getOrdersByCustomer(env.DB, customerId);

  return jsonResponse({ customer, orders });
}

async function getCustomerById(db: D1Database, customerId: number): Promise<unknown | null> {
  return db.prepare(
    'SELECT id, telegram_id, username, first_name, created_at FROM customers WHERE id = ?'
  ).bind(customerId).first();
}

async function getOrdersByCustomer(db: D1Database, customerId: number): Promise<unknown[]> {
  const result = await db.prepare(
    'SELECT display_id, customer_name, customer_username, status, item_count, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC'
  ).bind(customerId).all();
  return result.results;
}