/**
 * Dashboard API Entry Point
 * Router, CORS, error handling
 */

import type { Env, OrderSummary, OrderDetail, OrderListResponse } from './types';
import { authMiddleware, createSessionCookie, clearSessionCookie, validateCredentials } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { rateLimit, getClientIdentifier, rateLimitHeaders } from './middleware/rate-limit';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: HEADERS });
    }

    const rateResult = rateLimit(getClientIdentifier(request));
    if (!rateResult.allowed) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, HEADERS);
    }

    if (url.pathname === '/dashboard-api/login' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { password } = body as { password?: string };

      if (!password || !(await validateCredentials(env, password))) {
        return jsonResponse({ error: 'Invalid credentials' }, 401, HEADERS);
      }

      const sessionCookie = createSessionCookie({ authenticated: true, timestamp: Date.now() });
      const response = jsonResponse({ success: true }, 200, { ...HEADERS, 'Set-Cookie': sessionCookie });
      return response;
    }

    if (url.pathname === '/dashboard-api/logout' && request.method === 'POST') {
      const clearCookie = clearSessionCookie();
      const response = jsonResponse({ success: true }, 200, { ...HEADERS, 'Set-Cookie': clearCookie });
      return response;
    }

    const { authorized, response: authResponse } = await authMiddleware(request, env);
    if (!authorized) {
      return authResponse || jsonResponse({ error: 'Unauthorized' }, 401, HEADERS);
    }

    try {
      const path = url.pathname.replace('/dashboard-api', '') || '/';

      if (path === '/orders' && request.method === 'GET') {
        return handleOrdersList(request, env, url, HEADERS);
      }

      if (path.match(/^\/orders\/[^/]+$/) && request.method === 'GET') {
        const displayId = path.split('/')[2];
        return handleOrderDetail(request, displayId, env, HEADERS);
      }

      if (path.match(/^\/orders\/[^/]+\/status$/) && request.method === 'PATCH') {
        const displayId = path.split('/')[2];
        return handleOrderStatus(displayId, request, env, HEADERS);
      }

      if (path.match(/^\/orders\/[^/]+\/message$/) && request.method === 'POST') {
        const displayId = path.split('/')[2];
        return handleOrderMessage(displayId, request, env, HEADERS);
      }

      if (path === '/customers/:id' && request.method === 'GET') {
        const customerId = url.searchParams.get('id');
        if (!customerId) return jsonResponse({ error: 'Customer ID required' }, 400, HEADERS);
        return handleCustomerDetail(request, parseInt(customerId, 10), env, HEADERS);
      }

      if (path === '/activity-logs' && request.method === 'GET') {
        return handleActivityLogs(request, env, url, HEADERS);
      }

      return jsonResponse({ error: 'Not found' }, 404, HEADERS);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, HEADERS);
    }
  },
};

async function handleOrdersList(request: Request, env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'view_order', targetType: 'api', targetId: 'list' });

  const status = url.searchParams.get('status') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const orders = await getOrders(env.DB, { status, limit, offset });
  const total = await getOrdersCount(env.DB, { status });

  const response = jsonResponse({ orders, total, limit, offset }, 200, { ...headers, ...rateLimitHeaders({ allowed: true, remaining: 99, resetAt: 0 }) });
  return response;
}

async function handleOrderDetail(request: Request, displayId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'view_order', targetType: 'order', targetId: displayId });

  const order = await getOrderByDisplayId(env.DB, displayId);
  if (!order) {
    return jsonResponse({ error: 'Order not found' }, 404, headers);
  }

  return jsonResponse({ order }, 200, headers);
}

async function handleOrderStatus(displayId: string, request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (!status) {
    return jsonResponse({ error: 'Status is required' }, 400, headers);
  }

  const validStatuses = ['new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return jsonResponse({ error: 'Invalid status' }, 400, headers);
  }

  await loggingMiddleware(request, env, { action: 'update_status', targetType: 'order', targetId: displayId, details: { status } });

  const updated = await updateOrderStatus(env.DB, displayId, status);
  if (!updated) {
    return jsonResponse({ error: 'Order not found' }, 404, headers);
  }

  return jsonResponse({ success: true, order: updated, notification_sent: false }, 200, headers);
}

async function handleOrderMessage(displayId: string, request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { message } = body as { message?: string };

  if (!message) {
    return jsonResponse({ error: 'Message is required' }, 400, headers);
  }

  await loggingMiddleware(request, env, { action: 'send_message', targetType: 'order', targetId: displayId });

  return jsonResponse({ success: true, message_id: Date.now() }, 200, headers);
}

async function handleCustomerDetail(request: Request, customerId: number, env: Env, headers: Record<string, string>): Promise<Response> {
  await loggingMiddleware(request, env, { action: 'api_call', targetType: 'customer', targetId: customerId.toString() });

  const customer = await getCustomerById(env.DB, customerId);
  if (!customer) {
    return jsonResponse({ error: 'Customer not found' }, 404, headers);
  }

  const orders = await getOrdersByCustomer(env.DB, customerId);
  return jsonResponse({ customer, orders }, 200, headers);
}

async function handleActivityLogs(request: Request, env: Env, url: URL, headers: Record<string, string>): Promise<Response> {
  const action = url.searchParams.get('action') || undefined;
  const actor = url.searchParams.get('actor') || undefined;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const logs = await getActivityLogs(env, { action, actor, from, to, limit, offset });
  return jsonResponse(logs, 200, headers);
}

function jsonResponse(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers });
}

async function getOrders(db: D1Database, options: { status?: string; limit: number; offset: number }): Promise<OrderSummary[]> {
  let query = 'SELECT display_id, customer_name, customer_username, status, item_count, created_at FROM orders';
  const bindings: string[] = [];

  if (options.status) {
    query += ' WHERE status = ?';
    bindings.push(options.status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  bindings.push(options.limit.toString(), options.offset.toString());

  const result = await db.prepare(query).bind(...bindings).all();
  return result.results as OrderSummary[];
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

async function getOrderByDisplayId(db: D1Database, displayId: string): Promise<OrderDetail | null> {
  const orderResult = await db.prepare(
    'SELECT o.*, c.name as customer_name, c.username as customer_username, c.telegram_id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.display_id = ?'
  ).bind(displayId).first();

  if (!orderResult) return null;

  const itemsResult = await db.prepare('SELECT link, sort_order FROM order_items WHERE order_id = ? ORDER BY sort_order').bind((orderResult as Record<string, unknown>).id as number).all();

  const transitionsResult = await db.prepare('SELECT from_status, to_status, changed_by, created_at FROM order_status_transitions WHERE order_id = ? ORDER BY created_at').bind((orderResult as Record<string, unknown>).id as number).all();

  return {
    display_id: displayId,
    customer: {
      id: (orderResult as Record<string, unknown>).customer_id as number,
      name: (orderResult as Record<string, unknown>).customer_name as string,
      username: (orderResult as Record<string, unknown>).customer_username as string | null,
      telegram_id: (orderResult as Record<string, unknown>).telegram_id as number,
    },
    items: itemsResult.results as Array<{ link: string; sort_order: number }>,
    specs: (orderResult as Record<string, unknown>).specs as string | null,
    status: (orderResult as Record<string, unknown>).status as OrderDetail['status'],
    created_at: (orderResult as Record<string, unknown>).created_at as string,
    updated_at: (orderResult as Record<string, unknown>).updated_at as string,
    transitions: transitionsResult.results as OrderDetail['transitions'],
  };
}

async function updateOrderStatus(db: D1Database, displayId: string, status: string): Promise<boolean> {
  const result = await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE display_id = ?').bind(status, new Date().toISOString(), displayId).run();
  return result.success;
}

async function getCustomerById(db: D1Database, customerId: number): Promise<Record<string, unknown> | null> {
  return db.prepare('SELECT * FROM customers WHERE id = ?').bind(customerId).first();
}

async function getOrdersByCustomer(db: D1Database, customerId: number): Promise<OrderSummary[]> {
  const result = await db.prepare('SELECT display_id, customer_name, customer_username, status, item_count, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC').bind(customerId).all();
  return result.results as OrderSummary[];
}

async function getActivityLogs(env: Env, options: { action?: string; actor?: string; from?: string; to?: string; limit: number; offset: number }): Promise<{ logs: unknown[]; total: number }> {
  const { readActivityLogs } = await import('../../kv/schema');
  return readActivityLogs(env, options);
}