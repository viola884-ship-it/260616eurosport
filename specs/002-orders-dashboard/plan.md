# Implementation Plan: Orders Dashboard

**Branch**: `001-telegram-order-bot` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-orders-dashboard/spec.md`

## Summary

A web-based dashboard for managers to view and manage all orders, with Telegram messaging integration for client notifications, REST API for programmatic access, and comprehensive activity logging.

## Technical Context

**Architecture**: Web dashboard with REST API backend
**Performance Goals**: Dashboard loads within 3s, API responses <500ms
**Constraints**: External service limits apply (see Phase 0 Decisions); KV eventual consistency
**Scale/Scope**: Single manager, up to 10k orders, up to 1k customers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Specification-First | ✅ Pass | Spec with 3 user stories, 9 FRs, acceptance criteria defined |
| II. Incremental Delivery | ✅ Pass | Stories prioritized P1-P2; each independently testable |
| III. Quality Gates | ✅ Pass | vitest planned; logging provides auditability |
| Security: No secrets in repo | ✅ Pass | Dashboard password, API keys via Cloudflare env vars |

## Phase 0: Research

### Decisions

1. **Frontend**: Cloudflare Pages with vanilla HTML/JS (no framework for simplicity)
2. **Backend**: Cloudflare Workers with D1 bindings (shared with Telegram bot)
3. **Authentication**: Shared password + Cloudflare Access for deployment
4. **Logging**: Workers KV with structured log entries
5. **Telegram Integration**: Reuse existing bot token for sending messages to clients

---

## Project Structure

### Documentation (this feature)

```text
specs/002-orders-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # REST API contract
└── tasks.md            # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
dashboard/
├── index.html           # Main dashboard page
├── styles.css          # Dashboard styling
├── app.js              # Frontend logic
└── api.js              # API client

workers/
├── dashboard-api/       # Dashboard backend (Workers)
│   ├── index.ts         # Worker entry point
│   ├── handlers/        # API route handlers
│   ├── middleware/     # Auth, logging
│   └── lib/            # Shared utilities
└── telegram-notify/    # Telegram notification worker
    └── index.ts

kv/
└── schema.ts           # KV schema definitions

tests/
├── unit/
└── integration/
```

**Structure Decision**: Separate `dashboard/` (Pages frontend) and `workers/` (Workers backend) from existing bot code. Telegram notification reuses existing bot infrastructure.

## Complexity Tracking

*No violations — all principles pass.*