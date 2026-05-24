---

description: "Task list for Orders Dashboard feature implementation"

---

# Tasks: Orders Dashboard

**Input**: Design documents from `/specs/002-orders-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `dashboard/` at repository root
- Backend: `workers/dashboard-api/` at repository root
- KV schema: `workers/dashboard-api/lib/kv-schema.ts` (referenced from plan structure)
- Paths shown follow the project structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, configuration, and shared infrastructure

- [X] T001 [P] Create dashboard/ directory structure (index.html, styles.css, app.js, api.js)
- [X] T002 [P] Create workers/dashboard-api/ directory structure (index.ts, handlers/, middleware/, lib/)
- [X] T003 [P] Create workers/dashboard-api/wrangler.toml with D1 and KV bindings
- [X] T004 Create KV schema in workers/dashboard-api/lib/kv-schema.ts (ActivityLogEntry interface, log helper functions)
- [X] T005 [P] Add shared TypeScript types in workers/dashboard-api/types.ts (OrderSummary, OrderDetail, ActivityLogEntry, Env)
- [X] T006 Create D1 database helper in workers/dashboard-api/lib/db.ts (reuse queries from existing bot)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create authentication middleware in workers/dashboard-api/middleware/auth.ts (password validation, session cookie)
- [X] T008 [P] Create logging middleware in workers/dashboard-api/middleware/logging.ts (KV log writes on each request)
- [X] T009 Create dashboard API entry point in workers/dashboard-api/index.ts (router, CORS, error handling)
- [X] T010 [P] Create API base handler in workers/dashboard-api/handlers/base.ts (auth guard, logging, error wrapper)
- [X] T011 [P] Create orders list endpoint handler in workers/dashboard-api/handlers/orders-list.ts (GET /orders with pagination)
- [X] T012 [P] Create order detail endpoint handler in workers/dashboard-api/handlers/order-detail.ts (GET /orders/:id)
- [X] T013 [P] Create status update endpoint handler in workers/dashboard-api/handlers/order-status.ts (PATCH /orders/:id/status)
- [X] T014 [P] Create activity logs endpoint handler in workers/dashboard-api/handlers/activity-logs.ts (GET /activity-logs)

**Checkpoint**: Foundation ready - dashboard API endpoints functional, auth and logging in place

---

## Phase 3: User Story 1 - Manager Views Orders Dashboard (Priority: P1) 🎯 MVP

**Goal**: Manager opens dashboard URL and sees a sortable table of all orders

**Independent Test**: Open dashboard URL, verify table displays with Order ID, Customer, Status, Created At, Items Count columns; click column headers to verify sorting works

- [X] T015 [P] [US1] Create API client module in dashboard/api.js (fetch wrappers for all API endpoints)
- [X] T016 [P] [US1] Create main dashboard page in dashboard/index.html (HTML structure, CSS classes)
- [X] T017 [US1] Create dashboard styles in dashboard/styles.css (table styles, responsive layout, status badges)
- [X] T018 [US1] Create dashboard app logic in dashboard/app.js (fetch and display orders, render table, handle sorting)
- [X] T019 [US1] Implement table sorting in dashboard/app.js (client-side sort by Order ID, Customer, Status, Created At)
- [X] T020 [US1] Implement human-readable timestamps in dashboard/app.js (relative time + absolute on hover)

**Checkpoint**: At this point, manager can open dashboard and view all orders in sortable table

---

## Phase 4: User Story 2 - Manager Filters Orders (Priority: P2)

**Goal**: Manager can filter table by order status or search by customer name

**Independent Test**: Apply status filter, verify only matching orders appear; enter customer name, verify only matching orders appear

- [X] T021 [US2] Create status filter dropdown in dashboard/index.html
- [X] T022 [US2] Create customer search input in dashboard/index.html
- [X] T023 [US2] Implement status filter in dashboard/app.js (filter sent to API, re-render table)
- [X] T024 [US2] Implement customer search in dashboard/app.js (client-side filter, debounce 300ms, minimum 2 characters to trigger)

---

## Phase 5: User Story 3 - Manager Views Order Details (Priority: P2)

**Goal**: Manager clicks an order row to see full details in a modal/panel

**Independent Test**: Click order row, verify modal shows customer info, all product links, specifications, status history

- [X] T025 [US3] Create order detail modal/panel in dashboard/index.html
- [X] T026 [US3] Implement order detail view in dashboard/app.js (fetch and display order detail on row click)
- [X] T027 [US3] Add click handlers to open product links in new tab in dashboard/app.js
- [X] T028 [US3] Add status history display in dashboard/app.js (show transitions with timestamps)

**Checkpoint**: Manager can view complete order details without using bot commands

---

## Phase 6: API Endpoints - Messaging & Customer Access (Priority: P2)

**Goal**: Allow sending custom messages to customers and viewing customer orders via API

**Independent Test**: POST message to customer, verify Telegram message sent; GET customer details, verify orders returned

- [X] T029 [P] Create send message endpoint in workers/dashboard-api/handlers/order-message.ts (POST /orders/:id/message)
- [X] T030 [P] Create customer detail endpoint in workers/dashboard-api/handlers/customer-detail.ts (GET /customers/:id)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T031 [P] Add error handling and loading states to dashboard/app.js
- [X] T032 Add responsive CSS for mobile devices in dashboard/styles.css
- [X] T033 Add session timeout handling in dashboard/app.js
- [X] T034 [P] Add API rate limiting middleware in workers/dashboard-api/middleware/rate-limit.ts
- [X] T035 Add vitest unit tests for API handlers in workers/dashboard-api/handlers/handlers.test.ts (test orders-list, order-detail, order-status, order-message, activity-logs, customer-detail handlers) — all 14 tests passing
- [X] T036 [P] Add login lockout in workers/dashboard-api/middleware/auth.ts (checkLoginLockout, recordFailedLogin, clearLoginLockout; 5 attempts before 15-minute lockout) + integrate into login handler in workers/dashboard-api/index.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
- **API Endpoints (Phase 6)**: Depends on Foundational completion, independent of user stories
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P2)**: Can start after Foundational AND US1 (uses same table, extends filtering)
- **US3 (P2)**: Can start after Foundational AND US1 (detail view builds on row click from US1)
- US2, US3 are independent of each other after US1 is complete

### Within Each User Story

- API client (T015) before UI components (T016-T018) that use it
- Foundational endpoints before dashboard frontend that calls them

### Parallel Opportunities

- T001, T002, T003, T004, T005 can run in parallel (different directories)
- T007 and T008 can run in parallel (different middleware)
- T010, T011, T012, T013, T014 can run in parallel (different handlers)
- T015 and T016 can run in parallel (api.js and index.html)
- T021 and T022 can run in parallel (filter and search UI)
- T029 and T030 can run in parallel (different API endpoints)
- T031 and T034 can run in parallel (frontend polish and backend polish)

---

## Parallel Example: User Story 1

```bash
# Launch T015 and T016 in parallel (api.js and index.html):
Task: "Create API client module in dashboard/api.js"
Task: "Create main dashboard page in dashboard/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open dashboard URL, verify table with orders, verify sorting works
5. Deploy if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP: view orders)
3. Add User Story 2 → Test independently → Deploy (manager can filter)
4. Add User Story 3 → Test independently → Deploy (full detail view)
5. Add Phase 6 API → Deploy (programmatic access)
6. Add Phase 7 Polish → Deploy (mobile + rate limiting)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (dashboard frontend)
   - Developer B: Phase 6 API endpoints
3. After US1 complete: Developer A continues with US2 + US3
4. Developer B works on Phase 7 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are included per Phase 7 for API handlers (Quality Gates)
- Frontend tests not included - UI testing out of scope for v1