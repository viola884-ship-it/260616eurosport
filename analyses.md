# Codebase Analysis: Specs vs Implementation vs Beads

**Date**: 2026-06-16
**Branch**: `002-orders-dashboard`
**Working tree**: clean

---

## 1. Spec 001 — Telegram Order Bot (`001-telegram-order-bot`) — **P1, CLOSED**

**Status**: Tasks T001–T025 all marked complete; bead `digital_euro-u5b` closed.

### Implementation Summary
- `src/index.ts` — entry point, raw `fetch()` to `api.telegram.org`
- `src/db/queries.ts` — `OrderQueries` class with full CRUD (customer/order/items/transitions)
- `src/db/schema.sql` — D1 schema (customers, orders, order_items, status_transitions)
- `src/handlers/helpers.ts` — link extraction, spec parsing, summary formatter
- `src/index.ts` (current entry) implements all manager & customer logic inline (commands, duplicate detection, manager notification, customer notification)
- `tests/db/queries.test.ts`, `tests/handlers/helpers.test.ts` — 16 unit tests

### Findings

| #   | Issue                                                                                                                                                                                                                                                                                          | Severity |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1.1 | `src/types.ts` imports `BotContext = Context` from `grammy` (line 41) and `src/handlers/manager.ts` + `src/handlers/customer.ts` are grammy-based; but the active entry `src/index.ts` uses raw `fetch()`. The two handler files are **orphans** — never wired up.                              | Medium   |
| 1.2 | `package.json` lists `grammy` as a runtime dep even though production code does not use it.                                                                                                                                                                                                    | Low      |
| 1.3 | FR-003 says "create an order for any customer message that appears to be an order attempt" but `src/index.ts` only creates an order when `extractLinks(text).length > 0`. If the user sends text with no URL, the catch-all reply is sent. Spec edge case "broken or invalid product link" implies creating an order with raw text is also supported. | Low      |
| 1.4 | Spec says "manager chat is not configured → silently skip manager notification" — implemented in `src/index.ts`.                                                                                                                                                                                | OK       |

---

## 2. Spec 002 — Orders Dashboard (`002-orders-dashboard`) — **P2, IN PROGRESS**

**Status**: All tasks T001–T036 marked [X] in `tasks.md`; one open bead `digital_euro-eh3` for unit tests.

### Implementation Summary
- `workers/dashboard-api/index.ts` (entry, has **inline** handler functions)
- `workers/dashboard-api/handlers/{orders-list,order-detail,order-status,order-message,activity-logs,customer-detail,base}.ts` — **duplicate handler files, unused in production**
- `workers/dashboard-api/middleware/{auth,logging,rate-limit}.ts` — used
- `workers/dashboard-api/lib/{db,kv-schema}.ts` — used
- Dashboard frontend: `dashboard/src/` (React + shadcn/ui) — current implementation
- Old vanilla files: `dashboard/{app.js,api.js,styles.css}` — left over from 002 phase 1, no longer served

### Findings

| #   | Issue                                                                                                                                                                                                                                                                                                                                            | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 2.1 | **`workers/dashboard-api/index.ts` re-implements all handlers inline (lines 100–200) and does NOT import from `handlers/*.ts`**. The handlers/ directory is dead code. Tests in `handlers/handlers.test.ts` test the unused files.                                                                                                                  | HIGH     |
| 2.2 | `lib/db.ts` and `handlers/order-status.ts` and `handlers/order-detail.ts` query `order_status_transitions` — but the D1 schema (and `src/db/schema.sql`) has table **`status_transitions`**. The unused handlers would crash at runtime.                                                                                                            | HIGH     |
| 2.3 | `handlers/orders-list.ts` SELECTs `display_id, customer_name, customer_username, status, item_count, created_at FROM orders` — but orders table has none of `customer_name`, `customer_username`, `item_count`. Needs JOIN to `customers` and subquery for item count (which the inline `getOrders` in `index.ts` does correctly).                  | HIGH     |
| 2.4 | `handlers/customer-detail.ts` queries the same broken columns.                                                                                                                                                                                                                                                                                   | HIGH     |
| 2.5 | `lib/db.ts` SELECTs `c.name as customer_name` — customers table column is **`first_name`**, not `name`.                                                                                                                                                                                                                                            | HIGH     |
| 2.6 | Spec FR-005: search debounce 300ms (✅ implemented) and **minimum 2 characters** (❌ not enforced — `App.tsx` debounces on every keystroke).                                                                                                                                                                                                         | Medium   |
| 2.7 | Spec FR-005: "Search is client-side filtering of loaded orders" — `App.tsx` actually does two things: (a) sends `status` to API, (b) client-side `filteredOrders = sortedOrders.filter(...)` for search. The search doesn't hit the API, but the **status** filter hits the API, which contradicts the "not a server API call" note (the note applies to search only). | OK       |
| 2.8 | Spec FR-009: Failed login attempts limited to 5 before 15-min lockout — implemented in `auth.ts`. ✅                                                                                                                                                                                                                                               | OK       |
| 2.9 | Auth uses `X-Session-Token` header + `HttpOnly` cookie with `SameSite=Lax` — ✅ matches spec                                                                                                                                                                                                                                                       | OK       |
| 2.10 | Session timeout 30 min — ✅ implemented in `auth.ts`                                                                                                                                                                                                                                                                                              | OK       |
| 2.11 | Bead `digital_euro-eh3` ("Add unit tests for API handlers") — `handlers.test.ts` exists with 14 tests, but they test the **unused** handlers. Either the dead handlers should be removed and tests migrated, or the inline handlers in `index.ts` should be replaced with the handlers/ files (after fixing the table/column bugs).                       | HIGH     |
| 2.12 | Old vanilla `dashboard/{app.js,api.js,styles.css}` (12 KB) and `dashboard/index.html` (vanilla shell) are still on disk; current entry is `dashboard/src/main.tsx` and `dashboard/index.html` only contains a `<div id="root">`.                                                                                                                       | Medium   |
| 2.13 | `dashboard/components.json` was created but vite/tsconfig alias `@` → `dashboard/src`. Yet the spec describes `dashboard/components/ui/` as the install path — actual install went to `dashboard/src/components/ui/`.                                                                                                                                   | OK       |
| 2.14 | Spec 002 plan says "Single Worker (dashboard-api) serves both API routes and static assets via Workers Assets binding. … static files at root path (not /dashboard/ subdirectory)" but actual `index.ts` serves assets at `/dashboard/...`.                                                                                                            | Minor    |

---

## 3. Spec 003 — shadcn-ui Design System (`003-ui-design-system`) — **P3, IN PROGRESS**

**Status**: All tasks T001–T032 in `tasks.md` are **unchecked [ ]** but the implementation is mostly done. No open bead for this feature.

### Implementation Summary
- `dashboard/src/App.tsx` — `DashboardApp` (auth state, orders, sort, filter, pagination, dark mode)
- `dashboard/src/components/{LoginScreen,OrdersTable,OrderDetailDialog,FilterControls}.tsx` — all four required components
- `dashboard/src/components/ui/{avatar,badge,button,card,dialog,input,label,select,skeleton,table}.tsx` — all 9 required + skeleton
- `dashboard/src/main.tsx` — entry
- `dashboard/src/index.css` — shadcn CSS variables (light + dark) with class strategy
- `dashboard/tailwind.config.js` — `darkMode: 'class'`, color extensions
- `dashboard/components.json` — shadcn config
- Dark mode toggle in `App.tsx`; persisted in `localStorage.theme`
- Badge variants per status: new=default, confirmed=secondary, processing/shipped=outline, completed=secondary, cancelled=destructive — matches spec
- `dashboard/@/components/ui/` — **exact duplicate of `dashboard/src/components/ui/`** (orphaned)

### Findings

| #   | Issue                                                                                                                                                                                                                                                                                                                          | Severity |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 3.1 | **`dashboard/@/components/ui/`** is an exact byte-for-byte duplicate of `dashboard/src/components/ui/`. The `@` path is not aliased by vite (vite alias `@` → `dashboard/src`); the `@/` directory was likely created by a relative-import mistake and is never imported.                                                            | Medium   |
| 3.2 | All required shadcn components present: `button, table, dialog, input, select, badge, card, label, avatar` (10 incl. skeleton). ✅                                                                                                                                                                                              | OK       |
| 3.3 | FR-004 light/dark themes: ✅ CSS variables in `index.css`, `darkMode: 'class'` in `tailwind.config.js`, toggle in `App.tsx`.                                                                                                                                                                                                      | OK       |
| 3.4 | FR-006: custom styling via Tailwind className, not modifying `components/ui/*` source. Confirmed. ✅                                                                                                                                                                                                                            | OK       |
| 3.5 | US2 (T022–T024) about telegram-notify worker pages — `specs/003-ui-design-system/contracts/telegram-pages.md` documents the finding: **no telegram-notify worker exists**, no migration needed. ✅                                                                                                                                | OK       |
| 3.6 | US3 (T025–T027) about establishing the standard — T025 (AGENTS.md mention) and T026 (CONTRIBUTING.md) not done. Only `AGENTS.md` exists at project root; no shadcn mandate.                                                                                                                                                       | Low      |
| 3.7 | T028–T032 (Phase 6 polish: keyboard nav, focus trap, mobile responsive, screen reader) — partial: `OrderDetailDialog` uses Radix Dialog (focus trap built-in), no explicit keyboard test. Mobile responsive: tailwind classes used (`flex-wrap`, `sm:max-w-[600px]`); no `<sm` media-query test.                                   | Low      |
| 3.8 | Old `dashboard/{app.js,api.js,styles.css}` (vanilla) are still present alongside the new React app. FR-001 says "all web interfaces in this project MUST use shadcn/ui" — these old files are not imported by the new app but are untracked leftovers.                                                                          | Medium   |
| 3.9 | `specs/003-ui-design-system/tasks.md` task list is **not updated** — all checkboxes are still [ ], but actual work was committed (`Phase 1: Setup React + shadcn/ui`, `Phase 2-6: React dashboard with shadcn/ui components`).                                                                                                    | Low      |

---

## 4. Beads Status

```
○ digital_euro-eh3 ● P2  Add unit tests for Orders Dashboard API handlers   OPEN
○ digital_euro-p8n ● P3  Structured quantity field for orders                OPEN
✓ digital_euro-u5b ● P1  Telegram Order Bot feature                         CLOSED
```

- `digital_euro-eh3` — tests exist (`handlers.test.ts`, 14 tests pass) but they target the unused `handlers/*.ts` files. Whether to close depends on whether those files are kept/refactored or removed.
- `digital_euro-p8n` — future feature, not covered by any of the three specs, no implementation expected.

---

## 5. Recommended Actions (priority order)

1. **HIGH — Decide on the dashboard handler architecture.** Either:
   - (a) Delete the dead `handlers/*.ts` files + `lib/db.ts` and migrate tests to cover the inline handlers in `index.ts`; or
   - (b) Fix the table-name (`status_transitions`) and column references in `handlers/*.ts` and `lib/db.ts`, then refactor `index.ts` to import from them.
   - Currently both exist and the production code path is untested.
2. **HIGH — Close or update bead `digital_euro-eh3`** to reflect the architectural decision above.
3. **MEDIUM — Remove `dashboard/@/components/ui/` duplicate directory.**
4. **MEDIUM — Remove old vanilla `dashboard/{app.js,api.js,styles.css}`** (also leaves `dashboard/@/components/` empty).
5. **MEDIUM — Enforce 2-character minimum for customer search** (`App.tsx` → `handleSearchChange`).
6. **LOW — Remove grammy orphans** in `src/handlers/{manager,customer}.ts` and `BotContext` from `src/types.ts`; drop `grammy` from root `package.json`.
7. **LOW — Update `specs/003-ui-design-system/tasks.md`** to mark completed tasks, or treat tasks.md as decoupled.
8. **LOW — Update `AGENTS.md`** (US3) to mandate shadcn/ui for new web work.
