import { describe, it, expect, vi } from 'vitest';
import { OrderQueries } from '../../src/db/queries';
import type { Customer, Order, OrderItem } from '../../src/types';

const mockCustomer: Customer = {
  id: 1,
  telegram_id: 123456,
  username: 'testuser',
  first_name: 'Test',
  created_at: '2026-05-24T10:00:00.000Z',
};

const mockOrder: Order = {
  id: 1,
  display_id: '001',
  customer_id: 1,
  status: 'new',
  specs: 'quantity: 2',
  is_duplicate: 0,
  created_at: '2026-05-24T10:00:00.000Z',
  updated_at: '2026-05-24T10:00:00.000Z',
};

function createMockDb(resultsByQuery: Record<string, unknown>): D1Database {
  return {
    prepare: (query: string) => {
      const result = resultsByQuery[query] ?? null;
      const stmt = {
        bind: () => stmt,
        first: <T>() => (result as T | null),
        all: <T>() => ({ results: (result as T[]) ?? [] }),
        run: () => ({ success: true }),
      };
      return stmt as ReturnType<D1Database['prepare']>;
    },
  } as unknown as D1Database;
}

describe('OrderQueries', () => {
  describe('findOrCreateCustomer', () => {
    it('returns existing customer if found', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM customers WHERE telegram_id = ?': mockCustomer,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.findOrCreateCustomer(123456, 'testuser', 'Test');

      expect(result).toEqual(mockCustomer);
    });

    it('creates new customer if not found', async () => {
      const newCustomer = { ...mockCustomer, id: 2, telegram_id: 999 };
      const mockDb = createMockDb({
        'SELECT * FROM customers WHERE telegram_id = ?': null,
        'INSERT INTO customers (telegram_id, username, first_name) VALUES (?, ?, ?) RETURNING *': newCustomer,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.findOrCreateCustomer(999, 'newuser', 'New');

      expect(result).toEqual(newCustomer);
    });
  });

  describe('getCustomerById', () => {
    it('returns customer by id', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM customers WHERE id = ?': mockCustomer,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getCustomerById(1);

      expect(result).toEqual(mockCustomer);
    });

    it('returns null if not found', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM customers WHERE id = ?': null,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getCustomerById(999);

      expect(result).toBeNull();
    });
  });

  describe('getCustomerByTelegramId', () => {
    it('returns customer by telegram id', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM customers WHERE telegram_id = ?': mockCustomer,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getCustomerByTelegramId(123456);

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('getOrders', () => {
    it('returns all orders when no status filter', async () => {
      const orders: Order[] = [mockOrder, { ...mockOrder, id: 2, display_id: '002' }];
      const mockDb = createMockDb({
        'SELECT * FROM orders ORDER BY created_at DESC': orders,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrders();

      expect(result).toHaveLength(2);
    });

    it('filters orders by status', async () => {
      const orders: Order[] = [{ ...mockOrder, status: 'confirmed' }];
      const mockDb = createMockDb({
        'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC': orders,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrders('confirmed');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('confirmed');
    });
  });

  describe('getOrdersByCustomer', () => {
    it('returns orders for a customer ordered by created_at desc', async () => {
      const orders: Order[] = [mockOrder];
      const mockDb = createMockDb({
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC': orders,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrdersByCustomer(1);

      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe(1);
    });
  });

  describe('getOrderByDisplayId', () => {
    it('returns order by display_id', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM orders WHERE display_id = ?': mockOrder,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrderByDisplayId('001');

      expect(result).toEqual(mockOrder);
    });

    it('returns null if not found', async () => {
      const mockDb = createMockDb({
        'SELECT * FROM orders WHERE display_id = ?': null,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrderByDisplayId('999');

      expect(result).toBeNull();
    });
  });

  describe('checkDuplicate', () => {
    it('returns false when links array is empty', async () => {
      const mockDb = createMockDb({});

      const queries = new OrderQueries(mockDb);
      const result = await queries.checkDuplicate(1, []);

      expect(result).toBe(false);
    });

    it('returns false when no matching recent orders found', async () => {
      const mockDb = createMockDb({
        [`SELECT o.id FROM orders o
WHERE o.customer_id = ?
AND o.created_at > datetime('now', '-5 minutes')
ORDER BY o.created_at DESC`]: [{ id: 1 }],
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY sort_order': [{ id: 1, order_id: 1, link: 'https://example.com/other', sort_order: 0 }],
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.checkDuplicate(1, ['https://example.com/product1']);

      expect(result).toBe(false);
    });
  });

  describe('getOrderItems', () => {
    it('returns order items ordered by sort_order', async () => {
      const items: OrderItem[] = [
        { id: 1, order_id: 1, link: 'https://example.com/1', sort_order: 0 },
        { id: 2, order_id: 1, link: 'https://example.com/2', sort_order: 1 },
      ];
      const mockDb = createMockDb({
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY sort_order': items,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getOrderItems(1);

      expect(result).toHaveLength(2);
      expect(result[0].link).toBe('https://example.com/1');
    });
  });

  describe('getTransitions', () => {
    it('returns transitions ordered by created_at', async () => {
      const transitions = [
        { id: 1, order_id: 1, from_status: null, to_status: 'new', changed_by: 'system', created_at: '2026-05-24T10:00:00.000Z' },
        { id: 2, order_id: 1, from_status: 'new', to_status: 'confirmed', changed_by: 'manager', created_at: '2026-05-24T11:00:00.000Z' },
      ];
      const mockDb = createMockDb({
        'SELECT * FROM status_transitions WHERE order_id = ? ORDER BY created_at': transitions,
      });

      const queries = new OrderQueries(mockDb);
      const result = await queries.getTransitions(1);

      expect(result).toHaveLength(2);
      expect(result[0].to_status).toBe('new');
      expect(result[1].to_status).toBe('confirmed');
    });
  });
});