/**
 * Shared TypeScript types for Dashboard API
 */

export interface Env {
  DB: D1Database;
  ACTIVITY_LOGS: KVNamespace;
}

export interface OrderSummary {
  display_id: string;
  customer_name: string;
  customer_username: string | null;
  status: OrderStatus;
  item_count: number;
  created_at: string;
}

export interface OrderDetail {
  display_id: string;
  customer: {
    id: number;
    name: string;
    username: string | null;
    telegram_id: number;
  };
  items: Array<{
    link: string;
    sort_order: number;
  }>;
  specs: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  transitions: Array<{
    from_status: string | null;
    to_status: string;
    changed_by: 'manager' | 'system';
    created_at: string;
  }>;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: 'manager' | 'api' | 'system';
  action: string;
  target_type: 'order' | 'customer' | 'api';
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface OrderListResponse {
  orders: OrderSummary[];
  total: number;
  limit: number;
  offset: number;
}