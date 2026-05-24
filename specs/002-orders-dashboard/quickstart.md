# Quickstart: Orders Dashboard

## Setup

The dashboard is deployed as a single Cloudflare Worker (dashboard-api) that serves both the REST API and static assets via Workers Assets binding. No separate Cloudflare Pages deployment is needed.

1. **Deploy dashboard API worker**:
   ```bash
   cd workers/dashboard-api
   wrangler deploy
   ```
   This deploys both the API endpoints and the dashboard UI (static assets are bound via `workers/dashboard-api/index.ts` serving from Workers Assets).

2. **Configure bindings in `wrangler.toml`**:
   - The `wrangler.toml` already includes D1 and KV bindings (`DB` and `ACTIVITY_LOGS`)
   - Ensure the D1 database is created and migrations are applied

3. **Set secrets**:
   ```bash
   wrangler secret put DASHBOARD_PASSWORD
   wrangler secret put API_SECRET_KEY
   ```

## Configuration

| Variable | Description |
|----------|-------------|
| `DASHBOARD_PASSWORD` | Password for dashboard access |
| `API_SECRET_KEY` | Bearer token for API access |
| `MANAGER_CHAT_ID` | Telegram chat ID for manager notifications |
| `BOT_TOKEN` | Telegram bot token (reused) |
| `DB` | D1 database binding |
| `ACTIVITY_LOGS` | KV namespace for activity logs |

## API Usage

### Dashboard (Browser)

1. Open dashboard URL
2. Enter password to login
3. View, filter, and manage orders

### REST API

```bash
# Get all orders
curl -H "Authorization: Bearer $API_KEY" \
  https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard-api/orders

# Update order status
curl -X PATCH \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}' \
  https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard-api/orders/001/status

# Send message to customer
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Your order has shipped!"}' \
  https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard-api/orders/001/message

# View activity logs
curl -H "Authorization: Bearer $API_KEY" \
  https://telegram-order-bot.krown-benelux-b-v.workers.dev/dashboard-api/activity-logs?limit=100
```

## Telegram Integration

When manager updates order status via dashboard or API, the system automatically sends Telegram notification to the customer (reusing existing notification logic).

Managers can also send custom messages to customers via:
- Dashboard UI
- `POST /orders/:id/message` API