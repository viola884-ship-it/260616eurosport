# Data Model: Orders Dashboard

## Overview

Extends existing D1 schema with Workers KV for activity logging. No schema changes to existing D1 tables.

## KV Namespace: activity_logs

| Key Pattern | Value Type | Description |
|-------------|------------|-------------|
| `log:{timestamp}:{action}` | JSON object | Activity log entry |

### Activity Log Entry Schema

```json
{
  "id": "string (UUID)",
  "timestamp": "ISO 8601 datetime",
  "actor": "manager|api|system",
  "action": "view_order|update_status|send_message|api_call|login|logout",
  "target_type": "order|customer|api",
  "target_id": "string",
  "details": { ... },
  "ip_address": "string (optional)"
}
```

### Activity Actions

| Action | Actor | Description |
|--------|-------|-------------|
| `view_order` | manager | Manager viewed order details |
| `update_status` | manager | Manager changed order status |
| `send_message` | system | System sent Telegram message to customer |
| `api_call` | api | External API request received |
| `login` | manager | Manager authenticated to dashboard |
| `logout` | manager | Manager logged out of dashboard |

## API Data Structures

### Order Summary (for dashboard table)

```typescript
interface OrderSummary {
  display_id: string;
  customer_name: string;
  customer_username: string | null;
  status: OrderStatus;
  item_count: number;
  created_at: string; // ISO 8601
}
```

### Order Detail

```typescript
interface OrderDetail {
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
```

### Activity Log Entry

```typescript
interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: 'manager' | 'api' | 'system';
  action: string;
  target_type: 'order' | 'customer' | 'api';
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
}
```