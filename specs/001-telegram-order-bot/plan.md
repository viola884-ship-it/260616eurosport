# Implementation Plan: Telegram Order Bot

**Branch**: `001-telegram-order-bot` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-telegram-order-bot/spec.md`

## Summary

A Telegram bot for order creation and tracking. Customers send product links with optional specs to the bot; orders are forwarded to a manager chat where commands update status. Deployed as a Cloudflare Worker with D1 (SQLite) for persistence.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: grammY (Telegram bot framework), wrangler (Cloudflare CLI)
**Storage**: Cloudflare D1 (SQLite-compatible)
**Testing**: vitest
**Target Platform**: Cloudflare Workers
**Project Type**: web-service (serverless bot)
**Performance Goals**: Sub-second bot response time, manager notification within 30s
**Constraints**: Cloudflare Workers free-tier limits (100k requests/day, 10ms CPU/request for free plan)
**Scale/Scope**: Single manager + up to 100 concurrent customers, <10k orders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Specification-First | ✅ Pass | Spec with 4 user stories, 12 FRs, acceptance criteria defined |
| II. Incremental Delivery | ✅ Pass | Stories prioritized P1-P3; each independently testable |
| III. Quality Gates | ✅ Pass | Testing with vitest planned; wrangler deploy for validation |
| Security: No secrets in repo | ✅ Pass | Bot token, manager chat ID via Cloudflare env vars; wrangler.toml excluded from git |

## Project Structure

### Documentation (this feature)

```text
specs/001-telegram-order-bot/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── bot-api.md       # Bot command & message contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts             # Worker entry point, webhook handler
├── bot.ts               # grammY bot setup and middleware
├── handlers/
│   ├── customer.ts      # Customer message parsing and order creation
│   └── manager.ts       # Manager command handling (/status, /list)
├── db/
│   ├── schema.sql       # D1 schema (orders, customers, status_transitions)
│   └── queries.ts       # Database query functions
└── types.ts             # Shared TypeScript types

tests/
├── handlers/
│   ├── customer.test.ts
│   └── manager.test.ts
└── db/
    └── queries.test.ts

wrangler.toml             # Cloudflare Workers + D1 configuration
package.json
tsconfig.json
```

**Structure Decision**: Single project (serverless worker). No frontend or separate backend — the bot is the entire application. D1 schema and queries co-located under `src/db/`.

## Complexity Tracking

*No violations — all principles pass.*
