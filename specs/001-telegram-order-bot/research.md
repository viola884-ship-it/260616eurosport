# Research: Telegram Order Bot

## grammY Bot Framework

**Decision**: grammY — the leading TypeScript framework for Telegram bots.

- Native Cloudflare Workers support via `webhookCallback`
- Middleware-based message handling
- Built-in session management (can store session in D1)
- Active maintenance, strong TypeScript types
- Supports both long polling and webhook modes (webhook for Workers)

**Alternatives considered**: telegraf (older, heavier), node-telegram-bot-api (no Workers support).

## Cloudflare Workers + D1

**Decision**: Cloudflare Workers for hosting, D1 for persistence.

- D1 is SQLite-compatible — matches the user's storage requirement
- Workers free tier: 100k requests/day — sufficient for bot traffic
- wrangler CLI handles deployment, D1 migrations, and local dev
- Webhook mode: Telegram pushes updates to worker URL
- Cold start times <100ms on free tier

## Bot Webhook Setup

**Decision**: Use `@grammYjs/runner` on Workers webhook handler.

- Worker receives POST from Telegram at configured webhook URL
- grammY's `webhookCallback` converts Request to bot context
- `setWebhook` called once during deployment to register URL with Telegram

## Message Parsing

**Decision**: Simple regex-based link + spec extraction.

- Extract URLs from message text using URL regex
- Remaining text after link(s) treated as specifications (quantity, color, model, size)
- No NLP needed — specs are free-text, passed through as-is
- Command prefix (`/status`, `/list`) handled by grammY command middleware

## Testing

**Decision**: vitest with mock Telegram API responses.

- grammY provides test utilities for simulating messages
- D1 can be tested via miniflare (Cloudflare's local simulator)
- Unit tests for handlers, integration tests for full message flow

## Deployment

**Decision**: `wrangler deploy` to Cloudflare Workers.

- `wrangler.toml` configures worker, D1 binding, env vars
- Bot token stored as Cloudflare secret: `wrangler secret put BOT_TOKEN`
- Manager chat ID stored as env var or secret
