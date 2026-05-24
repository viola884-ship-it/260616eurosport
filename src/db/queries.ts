import type { Customer, Order, OrderItem, OrderStatus, StatusTransition } from '../types';

export class OrderQueries {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ── Customers ──

  async findOrCreateCustomer(telegramId: number, username: string | null, firstName: string | null): Promise<Customer> {
    const existing = await this.db.prepare(
      'SELECT * FROM customers WHERE telegram_id = ?',
    ).bind(telegramId).first<Customer>();

    if (existing) {
      return existing;
    }

    const result = await this.db.prepare(
      'INSERT INTO customers (telegram_id, username, first_name) VALUES (?, ?, ?) RETURNING *',
    ).bind(telegramId, username, firstName).first<Customer>();

    return result!;
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.db.prepare(
      'SELECT * FROM customers WHERE id = ?',
    ).bind(id).first<Customer>();
  }

  async getCustomerByTelegramId(telegramId: number): Promise<Customer | null> {
    return await this.db.prepare(
      'SELECT * FROM customers WHERE telegram_id = ?',
    ).bind(telegramId).first<Customer>();
  }

  // ── Orders ──

  async createOrder(
    customerId: number,
    specs: string | null,
    links: string[],
    isDuplicate: boolean,
  ): Promise<Order> {
    const displayId = await this.nextDisplayId();

    const order = await this.db.prepare(
      `INSERT INTO orders (display_id, customer_id, specs, is_duplicate)
       VALUES (?, ?, ?, ?) RETURNING *`,
    ).bind(displayId, customerId, specs, isDuplicate ? 1 : 0).first<Order>();

    for (let i = 0; i < links.length; i++) {
      await this.db.prepare(
        'INSERT INTO order_items (order_id, link, sort_order) VALUES (?, ?, ?)',
      ).bind(order!.id, links[i], i).run();
    }

    await this.recordTransition(order!.id, null, 'new', 'system');

    return order!;
  }

  async getOrderById(id: number): Promise<Order | null> {
    return await this.db.prepare(
      'SELECT * FROM orders WHERE id = ?',
    ).bind(id).first<Order>();
  }

  async getOrderByDisplayId(displayId: string): Promise<Order | null> {
    return await this.db.prepare(
      'SELECT * FROM orders WHERE display_id = ?',
    ).bind(displayId).first<Order>();
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    const result = await this.db.prepare(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
    ).bind(customerId).all<Order>();
    return result.results;
  }

  async getOrders(status?: OrderStatus): Promise<Order[]> {
    let result: D1Result<Order>;
    if (status) {
      result = await this.db.prepare(
        'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC',
      ).bind(status).all<Order>();
    } else {
      result = await this.db.prepare(
        'SELECT * FROM orders ORDER BY created_at DESC',
      ).all<Order>();
    }
    return result.results;
  }

  async updateOrderStatus(orderId: number, newStatus: OrderStatus, changedBy: 'manager' | 'system'): Promise<Order | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    await this.db.prepare(
      'UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
    ).bind(newStatus, orderId).run();

    await this.recordTransition(orderId, order.status, newStatus, changedBy);

    return this.getOrderById(orderId);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const result = await this.db.prepare(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY sort_order',
    ).bind(orderId).all<OrderItem>();
    return result.results;
  }

  async checkDuplicate(customerId: number, links: string[]): Promise<boolean> {
    if (links.length === 0) return false;

    const recentOrders = await this.db.prepare(
      `SELECT o.id FROM orders o
       WHERE o.customer_id = ?
       AND o.created_at > datetime('now', '-5 minutes')
       ORDER BY o.created_at DESC`,
    ).bind(customerId).all<{ id: number }>();

    for (const recent of recentOrders.results) {
      const items = await this.getOrderItems(recent.id);
      const recentLinks = items.map(i => i.link);
      if (links.length === recentLinks.length && links.every((l, i) => l === recentLinks[i])) {
        return true;
      }
    }
    return false;
  }

  // ── Status Transitions ──

  async getTransitions(orderId: number): Promise<StatusTransition[]> {
    const result = await this.db.prepare(
      'SELECT * FROM status_transitions WHERE order_id = ? ORDER BY created_at',
    ).bind(orderId).all<StatusTransition>();
    return result.results;
  }

  private async recordTransition(orderId: number, fromStatus: string | null, toStatus: string, changedBy: string): Promise<void> {
    await this.db.prepare(
      `INSERT INTO status_transitions (order_id, from_status, to_status, changed_by)
       VALUES (?, ?, ?, ?)`,
    ).bind(orderId, fromStatus, toStatus, changedBy).run();
  }

  // ── Helpers ──

  private async nextDisplayId(): Promise<string> {
    const last = await this.db.prepare(
      'SELECT display_id FROM orders ORDER BY id DESC LIMIT 1',
    ).first<{ display_id: string }>();

    const nextNum = last ? parseInt(last.display_id, 10) + 1 : 1;
    return String(nextNum).padStart(3, '0');
  }
}