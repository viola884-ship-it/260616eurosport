# Quickstart: Telegram Order Bot

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare account](https://dash.cloudflare.com/)
- Telegram bot token (create via [@BotFather](https://t.me/BotFather))
- Manager's Telegram chat ID (send `/start` to [@userinfobot](https://t.me/userinfobot))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure wrangler
cp wrangler.example.toml wrangler.toml
# Edit wrangler.toml: set MANAGER_CHAT_ID

# 3. Set secrets
wrangler secret put BOT_TOKEN
# Paste your Telegram bot token

# 4. Create D1 database
wrangler d1 create orders-db
wrangler d1 execute orders-db --file=src/db/schema.sql

# 5. Deploy
wrangler deploy

# 6. Register webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-worker>.workers.dev/webhook"
```

## Local Development

```bash
wrangler dev
```

## Testing

```bash
npm test
```

## Environment Variables

| Variable         | Description                    | Set via        |
|-----------------|--------------------------------|----------------|
| BOT_TOKEN       | Telegram bot token             | `wrangler secret` |
| MANAGER_CHAT_ID | Chat ID for manager notifications | `wrangler.toml` |
