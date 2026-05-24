# API Contracts: Orders Dashboard

## REST API

Base URL: `https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard-api`

**Authentication**: Bearer token (API key passed in `Authorization` header)

### Endpoints

#### GET /orders

Returns list of orders with optional filtering.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (new, confirmed, processing, shipped, completed, cancelled) |
| `customer_id` | number | Filter by customer ID |
| `limit` | number | Max results (default: 50, max: 200) |
| `offset` | number | Pagination offset |

**Response**:
```json
{
  "orders": [
    {
      "display_id": "001",
      "customer_name": "John",
      "customer_username": "@john",
      "status": "new",
      "item_count": 2,
      "created_at": "2026-05-24T14:30:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

#### GET /orders/:display_id

Returns full order details.

**Response**:
```json
{
  "order": {
    "display_id": "001",
    "customer": {
      "id": 1,
      "name": "John Doe",
      "username": "@john",
      "telegram_id": 123456789
    },
    "items": [
      { "link": "https://shop.com/item1", "sort_order": 0 },
      { "link": "https://shop.com/item2", "sort_order": 1 }
    ],
    "specs": "size L, color blue",
    "status": "new",
    "created_at": "2026-05-24T14:30:00Z",
    "updated_at": "2026-05-24T14:30:00Z",
    "transitions": [
      {
        "from_status": null,
        "to_status": "new",
        "changed_by": "system",
        "created_at": "2026-05-24T14:30:00Z"
      }
    ]
  }
}
```

---

#### PATCH /orders/:display_id/status

Updates order status. Triggers customer notification.

**Request**:
```json
{
  "status": "confirmed"
}
```

**Response**:
```json
{
  "success": true,
  "order": { ... },
  "notification_sent": true
}
```

---

#### POST /orders/:display_id/message

Sends a custom message to the customer via Telegram.

**Request**:
```json
{
  "message": "Your order has been shipped!"
}
```

**Response**:
```json
{
  "success": true,
  "message_id": 123
}
```

---

#### GET /activity-logs

Returns activity logs.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Filter by action type |
| `actor` | string | Filter by actor (manager, api, system) |
| `from` | ISO datetime | Start time |
| `to` | ISO datetime | End time |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Pagination offset |

**Response**:
```json
{
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-05-24T14:30:00Z",
      "actor": "manager",
      "action": "update_status",
      "target_type": "order",
      "target_id": "001",
      "details": { "from": "new", "to": "confirmed" },
      "ip_address": "1.2.3.4"
    }
  ],
  "total": 500
}
```

---

#### GET /customers/:id

Returns customer details with their orders.

**Response**:
```json
{
  "customer": {
    "id": 1,
    "telegram_id": 123456789,
    "username": "@john",
    "first_name": "John",
    "created_at": "2026-05-24T10:00:00Z"
  },
  "orders": [ ... ]
}
```

---

## Dashboard UI

The dashboard is served as static assets via Workers Assets binding. The exact URL path depends on the Cloudflare Pages/Workers configuration:

- **If bound at root** (`/`): Dashboard is at `https://telegram-order-bot.krown-benelux-b-v.workers.dev/`
- **If bound at `/dashboard`**: Dashboard is at `https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard/`

The implementation serves assets at `/dashboard/` (see `workers/dashboard-api/index.ts`).

**Features**:
- Orders table with sorting
- Status filter dropdown
- Customer search (client-side, debounced)
- Click row to view details in modal

### Order Detail View

Order details are displayed in a modal overlay (not a separate page). The frontend fetches order details via `GET /orders/:display_id` and renders them in the modal.

---

## Telegram Notifications (via existing bot)

Reuses existing `/sendMessage` API for:
- Status change notifications
- Custom messages from manager to customer