# Implementation Plan: Orders Dashboard

**Branch**: `002-orders-dashboard` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-orders-dashboard/spec.md`

## Summary

A web-based dashboard for managers to view and manage all orders, deployed as a Cloudflare Worker (single Worker serving both API and static assets).

## Technical Context

**Architecture**: Single Cloudflare Worker (dashboard-api) serving both REST API and static assets via Workers Assets binding
**Frontend**: Vanilla HTML/CSS/JS served as static assets from the Worker
**Backend**: Cloudflare Workers with D1 database and KV for activity logging
**Authentication**: Password-based login returning X-Session-Token header (fallback to HttpOnly cookie with SameSite=Lax)
**Performance Goals**: Dashboard loads within 3s, API responses <500ms
**Constraints**: KV eventual consistency; Workers Assets serve static files at root path
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

1. **Frontend**: Vanilla HTML/JS/CSS served as static assets from the Cloudflare Worker (Workers Assets binding)
2. **Backend**: Single Cloudflare Worker (dashboard-api) with D1 and KV bindings
3. **Authentication**: Password-based login returning X-Session-Token response header; HttpOnly cookie with SameSite=Lax as fallback
4. **Logging**: Workers KV with structured activity log entries (kv-schema.ts in workers/dashboard-api/lib/)
5. **Deployment**: Cloudflare Workers Assets serve static files at root path (not /dashboard/ subdirectory)

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
├── app.js              # Frontend logic (auth, rendering, filtering)
├── api.js              # API client module (fetch wrappers)
└── favicon.svg         # Dashboard favicon

workers/
├── dashboard-api/       # Dashboard backend (Workers)
│   ├── index.ts         # Worker entry point (router, CORS, auth)
│   ├── handlers/        # API route handlers
│   │   ├── base.ts      # jsonResponse helper with CORS headers
│   │   ├── orders-list.ts
│   │   ├── order-detail.ts
│   │   ├── order-status.ts
│   │   ├── order-message.ts
│   │   ├── activity-logs.ts
│   │   └── customer-detail.ts
│   ├── middleware/     # Auth, logging, rate limiting
│   │   ├── auth.ts
│   │   ├── logging.ts
│   │   └── rate-limit.ts
│   ├── lib/            # Shared utilities
│   │   ├── db.ts       # D1 query helpers
│   │   └── kv-schema.ts # KV activity logging schema
│   ├── types.ts        # Shared TypeScript types
│   └── wrangler.toml   # Workers + Assets + D1 + KV bindings
└── telegram-notify/    # Telegram notification worker
    └── index.ts
```

**Structure Decision**: Single Worker (dashboard-api) serves both API routes and static assets via Workers Assets binding. No separate Cloudflare Pages deployment needed.

## Complexity Tracking

*No violations — all principles pass.*