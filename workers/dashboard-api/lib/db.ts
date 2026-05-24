/**
 * D1 Database Helper
 * Reuses queries from existing bot
 */

import type { Env, OrderSummary, OrderDetail } from '../types';

export async function getAllOrders(
  db: D1Database,
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<OrderSummary[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  let query = `
    SELECT
      o.display_id,
      c.name as customer_name,
      c.username as customer_username,
      o.status,
      o.item_count,
      o.created_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
  `;

  const bindings: (string | number)[] = [];

  if (options.status) {
    query += ' WHERE o.status = ?';
    bindings.push(options.status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  bindings.push(limit, offset);

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results as OrderSummary[];
}

export async function getOrderByDisplayId(db: D1Database, displayId: string): Promise<OrderDetail | null> {
  const orderResult = await db.prepare(`
    SELECT o.*, c.name as customer_name, c.username as customer_username, c.telegram_id
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.display_id = ?
  `).bind(displayId).first();

  if (!orderResult) return null;

  const orderId = (orderResult as Record<string, unknown>).id as number;

  const itemsResult = await db.prepare(`
    SELECT link, sort_order
    FROM order_items
    WHERE order_id = ?
    ORDER BY sort_order
  `).bind(orderId).all();

  const transitionsResult = await db.prepare(`
    SELECT from_status, to_status, changed_by, created_at
    FROM order_status_transitions
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).bind(orderId).all();

  return {
    display_id: displayId,
    customer: {
      id: orderResult.customer_id as number,
      name: orderResult.customer_name as string,
      username: orderResult.customer_username as string | null,
      telegram_id: orderResult.telegram_id as number,
    },
    items: itemsResult.results as Array<{ link: string; sort_order: number }>,
    specs: orderResult.specs as string | null,
    status: orderResult.status as OrderDetail['status'],
    created_at: orderResult.created_at as string,
    updated_at: orderResult.updated_at as string,
    transitions: transitionsResult.results as OrderDetail['transitions'],
  };
}

export async function updateOrderStatusInDb(
  db: D1Database,
  displayId: string,
  newStatus: string
): Promise<boolean> {
  const now = new Date().toISOString();

  const prevStatus = await db.prepare(
    'SELECT status FROM orders WHERE display_id = ?'
  ).bind(displayId).first<{ status: string }>();

  if (!prevStatus) return false;

  const updateResult = await db.prepare(
    'UPDATE orders SET status = ?, updated_at = ? WHERE display_id = ?'
  ).bind(newStatus, now, displayId).run();

  if (updateResult.success) {
    const orderId = await db.prepare(
      'SELECT id FROM orders WHERE display_id = ?'
    ).bind(displayId).first<{ id: number }>();

    if (orderId) {
      await db.prepare(`
        INSERT INTO order_status_transitions (order_id, from_status, to_status, changed_by, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(orderId.id, prevStatus.status, newStatus, 'manager', now).run();
    }
  }

  return updateResult.success;
}

export async function searchOrdersByCustomer(
  db: D1Database,
  searchTerm: string,
  options: { limit?: number; offset?: number } = {}
): Promise<OrderSummary[]> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const searchPattern = `%${searchTerm}%`;

  const result = await db.prepare(`
    SELECT
      o.display_id,
      c.name as customer_name,
      c.username as customer_username,
      o.status,
      o.item_count,
      o.created_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.name LIKE ? OR c.username LIKE ?
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(searchPattern, searchPattern, limit, offset).all();

  return result.results as OrderSummary[];
}