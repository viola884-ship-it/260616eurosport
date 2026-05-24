/**
 * Vitest Unit Tests for Dashboard API Handlers
 * Tests orders-list, order-detail, order-status, order-message, activity-logs, customer-detail
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOrdersList } from './orders-list';
import { handleOrderDetail } from './order-detail';
import { handleOrderStatus } from './order-status';
import { handleOrderMessage } from './order-message';
import { handleActivityLogs } from './activity-logs';
import { handleCustomerDetail } from './customer-detail';
import { parseUrlParams } from './base';
import type { Env } from '../types';

function createMockEnv(overrides: Partial<Env> = {}): Env {
  const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  } as unknown as D1Database;

  const mockKv = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  } as unknown as KVNamespace;

  const mockAssets = {
    fetch: vi.fn(),
  };

  return {
    DB: mockDb,
    ACTIVITY_LOGS: mockKv,
    ASSETS: mockAssets,
    ...overrides,
  } as Env;
}

function createMockRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('handleOrdersList', () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('returns orders with pagination', async () => {
    const mockOrders = [
      { display_id: '001', customer_name: 'John', customer_username: '@john', status: 'new', item_count: 2, created_at: '2026-05-24T10:00:00Z' },
    ];
    env.DB.prepare('').bind().all = vi.fn().mockResolvedValue({ results: mockOrders });
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue({ count: 1 });

    const url = new URL('http://localhost/orders?limit=50&offset=0');
    const request = createMockRequest('GET', 'http://localhost/orders');

    const response = await handleOrdersList(request, env, url);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.orders).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.limit).toBe(50);
    expect(json.offset).toBe(0);
  });

  it('filters by status', async () => {
    env.DB.prepare('').bind().all = vi.fn().mockResolvedValue({ results: [] });
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue({ count: 0 });

    const url = new URL('http://localhost/orders?status=new&limit=50&offset=0');
    const request = createMockRequest('GET', 'http://localhost/orders');

    const response = await handleOrdersList(request, env, url);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.orders).toHaveLength(0);
  });
});

describe('handleOrderDetail', () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('returns order details for valid display_id', async () => {
    const mockOrder = {
      id: 1,
      customer_id: 1,
      customer_name: 'John',
      customer_username: '@john',
      telegram_id: 123456,
      status: 'new',
      specs: 'size L',
      created_at: '2026-05-24T10:00:00Z',
      updated_at: '2026-05-24T10:00:00Z',
    };
    const mockItems = { results: [{ link: 'https://shop.com/item1', sort_order: 0 }] };
    const mockTransitions = { results: [{ from_status: null, to_status: 'new', changed_by: 'system', created_at: '2026-05-24T10:00:00Z' }] };
    env.DB.prepare('').bind().first = vi.fn()
      .mockResolvedValueOnce(mockOrder);
    env.DB.prepare('').bind().all = vi.fn()
      .mockResolvedValueOnce(mockItems)
      .mockResolvedValueOnce(mockTransitions);

    const request = createMockRequest('GET', 'http://localhost/orders/001');
    const response = await handleOrderDetail(request, env, '001');

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.order.display_id).toBe('001');
    expect(json.order.customer.name).toBe('John');
  });

  it('returns 404 for unknown order', async () => {
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue(null);

    const request = createMockRequest('GET', 'http://localhost/orders/999');
    const response = await handleOrderDetail(request, env, '999');

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Order not found');
  });
});

describe('handleOrderStatus', () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('updates order status with valid status', async () => {
    env.DB.prepare('').bind().run = vi.fn().mockResolvedValue({ success: true });
    env.DB.prepare('').bind().first = vi.fn()
      .mockResolvedValueOnce({ id: 1, status: 'new' })
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 1, status: 'new' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, status: 'new', customer_name: 'John', customer_username: '@john', telegram_id: 123456 });

    const request = createMockRequest('PATCH', 'http://localhost/orders/001/status', { status: 'confirmed' });
    const response = await handleOrderStatus(request, env, '001');

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('returns 400 for missing status', async () => {
    const request = createMockRequest('PATCH', 'http://localhost/orders/001/status', {});
    const response = await handleOrderStatus(request, env, '001');

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Status is required');
  });

  it('returns 400 for invalid status', async () => {
    const request = createMockRequest('PATCH', 'http://localhost/orders/001/status', { status: 'invalid' });
    const response = await handleOrderStatus(request, env, '001');

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Invalid status');
  });

  it('returns 404 for unknown order', async () => {
    env.DB.prepare('').bind().run = vi.fn().mockResolvedValue({ success: false });

    const request = createMockRequest('PATCH', 'http://localhost/orders/999/status', { status: 'confirmed' });
    const response = await handleOrderStatus(request, env, '999');

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Order not found');
  });
});

describe('handleOrderMessage', () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('returns 400 for missing message', async () => {
    const request = createMockRequest('POST', 'http://localhost/orders/001/message', {});
    const response = await handleOrderMessage(request, env, '001');

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Message is required');
  });

  it('returns 404 for unknown order', async () => {
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue(null);

    const request = createMockRequest('POST', 'http://localhost/orders/999/message', { message: 'Hello' });
    const response = await handleOrderMessage(request, env, '999');

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Order not found');
  });

  it('returns 400 when customer has no telegram_id', async () => {
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue({ telegram_id: null });

    const request = createMockRequest('POST', 'http://localhost/orders/001/message', { message: 'Hello' });
    const response = await handleOrderMessage(request, env, '001');

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Customer has no Telegram ID');
  });
});

describe('handleCustomerDetail', () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it('returns customer details with orders', async () => {
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue({
      id: 1,
      telegram_id: 123456,
      username: '@john',
      first_name: 'John',
      created_at: '2026-05-24T10:00:00Z',
    });
    env.DB.prepare('').bind().all = vi.fn().mockResolvedValue({
      results: [{ display_id: '001', customer_name: 'John', customer_username: '@john', status: 'new', item_count: 2, created_at: '2026-05-24T10:00:00Z' }],
    });

    const request = createMockRequest('GET', 'http://localhost/customers/1');
    const response = await handleCustomerDetail(request, env, 1);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.customer.id).toBe(1);
    expect(json.customer.username).toBe('@john');
    expect(json.orders).toHaveLength(1);
  });

  it('returns 404 for unknown customer', async () => {
    env.DB.prepare('').bind().first = vi.fn().mockResolvedValue(null);

    const request = createMockRequest('GET', 'http://localhost/customers/999');
    const response = await handleCustomerDetail(request, env, 999);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Customer not found');
  });
});

describe('parseUrlParams', () => {
  it('parses pagination params', () => {
    const url = new URL('http://localhost/orders?limit=25&offset=10&status=new');
    const params = parseUrlParams(url);
    expect(params.limit).toBe(25);
    expect(params.offset).toBe(10);
    expect(params.status).toBe('new');
  });
});