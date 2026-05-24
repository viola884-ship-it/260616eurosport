---

description: "Task list for Telegram Order Bot feature implementation"

---

# Tasks: Telegram Order Bot

**Input**: Design documents from `/specs/001-telegram-order-bot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown follow the project structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize npm project and install dependencies (TypeScript, grammY, vitest, wrangler)
- [x] T002 [P] Create tsconfig.json with strict TypeScript config
- [x] T003 [P] Create wrangler.toml with D1 binding and environment variable placeholders
- [x] T004 Create D1 database schema in src/db/schema.sql (customers, orders, order_items, status_transitions tables)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Create shared TypeScript types in src/types.ts (Customer, Order, OrderItem, StatusTransition, Env)
- [x] T006 [P] Create all bot logic in src/index.ts (webhook handler, raw Telegram API integration)
- [x] T007 Create Worker entry point in src/index.ts (webhook handler, error handling, startup)
- [x] T008 Create database query functions in src/db/queries.ts (customer CRUD, order CRUD, status transitions)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Customer Places an Order (Priority: P1) 🎯 MVP

**Goal**: A customer can send a product link with optional specs to the bot and receive a confirmation

**Independent Test**: Send a product link with specs to the bot and verify the bot confirms with an order summary

- [x] T009 [P] [US1] Create customer message handler in src/index.ts (link extraction, spec parsing, order creation, confirmation)
- [x] T010 [US1] Implement order creation flow in src/index.ts (lookup-or-create customer, insert order + line items, assign display_id)
- [x] T011 [US1] Implement duplicate detection and flagging in order creation (check same customer + same links in recent window)
- [x] T012 [US1] Implement order confirmation reply to customer (order summary with display_id)

**Checkpoint**: At this point, a customer can place an order via the bot and receive a confirmation

---

## Phase 4: User Story 2 - Manager Receives and Reviews Orders (Priority: P1)

**Goal**: The manager receives new order notifications in their chat and can view order details

**Independent Test**: Place an order as a customer and verify a notification appears in the manager's chat

- [x] T013 [P] [US2] Create manager command handlers in src/index.ts (/ping, /list, /customer, /update commands)
- [x] T014 [US2] Send new order notification to manager chat from order creation flow (format per contracts/bot-api.md)
- [x] T015 [US2] Implement /list command for manager in src/handlers/manager.ts (list all orders, optional status filter)
- [x] T016 [US2] Implement /customer command for manager in src/handlers/manager.ts (view order by display_id)

**Checkpoint**: At this point, the full order flow works end-to-end: customer places → manager receives → manager reviews

---

## Phase 5: User Story 3 - Manager Manages Order Lifecycle (Priority: P2)

**Goal**: The manager can update order status via commands; the customer is notified of changes

**Independent Test**: Update an order's status via the manager chat and verify the customer receives a notification

- [x] T017 [US3] Implement /update command for manager in src/index.ts (parse <order-id> <new-status>, validate transition)
- [x] T018 [US3] Implement status transition logic with validation in src/db/queries.ts (record transition, enforce lifecycle rules)
- [x] T019 [US3] Implement customer notification on status change (send message to customer's Telegram chat)

**Checkpoint**: At this point, the manager can manage the full order lifecycle and customers are notified

---

## Phase 6: User Story 4 - Customer Checks Order Status (Priority: P3)

**Goal**: A customer can query the bot for the current status of their orders

**Independent Test**: Ask the bot for order status and verify the correct list of orders with statuses is returned

- [x] T020 [P] [US4] Implement /status command for customers in src/index.ts (lookup orders by customer)
- [x] T021 [US4] Add customer order lookup query in src/db/queries.ts (get orders by customer_id with current status)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Create wrangler.example.toml with documented env vars for team reference
- [x] T023 Add .gitignore (node_modules, .wrangler, wrangler.toml with secrets, dist/)
- [x] T024 End-to-end validation: deploy to Cloudflare Workers, set webhook, verify full flow
- [x] T025 [P] Add inline documentation to all source files (JSDoc on exports)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 2 depends on User Story 1 (order creation triggers manager notification)
  - User Story 3 depends on User Story 1 (orders must exist to manage)
  - User Story 4 depends on User Story 1 (orders must exist to query)
  - User Stories 2, 3, 4 are otherwise independent of each other
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational AND US1 (notification triggered during order creation)
- **User Story 3 (P2)**: Can start after Foundational AND US1 (needs orders to manage)
- **User Story 4 (P3)**: Can start after Foundational AND US1 (needs orders to query)

### Within Each User Story

- Models before services
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (different config files)
- T005 and T006 can run in parallel (unrelated files)
- T013 is the only independent US2 task (other US2 tasks depend on US1 implementation)
- T020 and T021 can run in parallel (handler + query addition)
- T022, T023, T025 can run in parallel (independent files)

---

## Parallel Example: User Story 1

```bash
# Launch T009 (all customer logic is in index.ts):
Task: "Create customer message handler in src/index.ts (link extraction, spec parsing, order creation)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Send a product link to the bot, verify order is created and confirmation received
5. Deploy if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP: basic ordering works)
3. Add User Story 2 → Test independently → Deploy (manager sees orders)
4. Add User Story 3 → Test independently → Deploy (manager controls lifecycle)
5. Add User Story 4 → Test independently → Deploy (customer self-service)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 + 2 (single-file implementation)
   - Developer B: User Story 4 (same file, independent command branch)
3. After US1 complete: Developer A can continue with User Story 3

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- No test tasks are included; tests were not requested in the feature specification
- All bot logic is in src/index.ts using the raw Telegram REST API