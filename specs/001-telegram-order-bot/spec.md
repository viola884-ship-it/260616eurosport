# Feature Specification: Telegram Order Bot

**Feature Branch**: `001-telegram-order-bot`
**Created**: 2026-05-24
**Status**: Draft
**Input**: User description: "order creation and tracking system with telegram bot as user interface, telegram chat as backend interface, sqlite as dbase and cloudflare as deployment engine. User can send the links to desirebale goods with specs such as quantity, color, model etc. to telegram bot. manager got the message about the order in telegram chat and can manage the order process further."

## Clarifications

### Session 2026-05-24

- Q: How does the manager update an order's status — commands, replies, or inline buttons? → A: Manager types commands in the chat (e.g., `/status 001 confirmed`)
- Q: Which specification fields are required when placing an order? → A: No fields required — bot accepts links with or without specs and asks nothing
- Q: How should duplicate order submissions be handled? → A: Always accept — create the order even if duplicate, add a note flagging possible duplicate
- Q: How should the bot handle a message containing multiple product links? → A: Single combined order — all links grouped into one order with multiple line items
- Q: How should the bot handle a broken or invalid product link? → A: Create order anyway — bot still creates an order with the invalid link text, letting the manager sort it out

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Places an Order (Priority: P1)

A customer wants to order a product. They send the product link along with desired specifications (quantity, color, model, size) to the Telegram bot. The bot confirms receipt and the order is created.

**Why this priority**: This is the core action — without order placement, nothing else matters.

**Independent Test**: Can be fully tested by sending a product link with specs to the bot and verifying the order is recorded and confirmed.

**Acceptance Scenarios**:

1. **Given** a customer has a product link with optional specifications (quantity, color, model, size), **When** they send the message to the bot, **Then** the bot confirms receipt with a summary of what was captured and the order is recorded.
2. **Given** a customer sends only a product link without any specifications, **When** the message is received, **Then** the bot creates the order with the link and empty spec fields.
3. **Given** a customer sends an unsupported message (no link, just text), **When** the bot receives it, **Then** the bot replies with usage instructions.

---

### User Story 2 - Manager Receives and Reviews Orders (Priority: P1)

The manager receives new order notifications in a dedicated Telegram chat. They can view order details and decide how to proceed.

**Why this priority**: The manager must see orders to act on them — this completes the basic order flow.

**Independent Test**: Place an order as a customer and verify it appears in the manager's chat with all specifications.

**Acceptance Scenarios**:

1. **Given** a customer places an order, **When** the order is created, **Then** the manager's chat receives a notification with product link, specifications, and order timestamp.
2. **Given** the manager sees an order notification, **When** they view it, **Then** all details (product link, quantity, color, model, status) are clearly displayed.

---

### User Story 3 - Manager Manages Order Lifecycle (Priority: P2)

The manager can update an order's status through the Telegram chat using commands (e.g., `/update <order-id> <new-status>`). The customer is notified of status changes.

**Why this priority**: Order management adds operational value but can follow after basic placement and notification.

**Independent Test**: Update an existing order's status via the manager chat and verify the customer receives the update.

**Acceptance Scenarios**:

1. **Given** an order exists, **When** the manager updates its status to "confirmed", **Then** the customer receives a notification with the new status.
2. **Given** an order exists, **When** the manager cancels it, **Then** the customer receives a cancellation notification with an optional reason.
3. **Given** an order is being processed, **When** the manager updates it to "completed", **Then** the customer receives a completion notification.

---

### User Story 4 - Customer Checks Order Status (Priority: P3)

A customer can query the bot for the current status of their orders.

**Why this priority**: Self-service status checks reduce manager workload but are additive, not foundational.

**Independent Test**: Ask the bot for order status and verify it returns the correct status for the requesting customer's orders.

**Acceptance Scenarios**:

1. **Given** a customer has active orders, **When** they send a status check command to the bot, **Then** the bot returns a list of their orders with current statuses.
2. **Given** a customer with no orders requests status, **When** they query, **Then** the bot responds that no orders were found.

---

### Edge Cases

- What happens when a customer sends multiple product links in one message? → All links are grouped into a single order, each as a separate line item.
- What happens when the manager's chat is not configured or unavailable? → Bot notifies the customer of order creation and silently skips the manager notification.
- How does the system handle duplicate order submissions (same link, same specs, same customer within a short time)? → System always accepts the order and flags it as a possible duplicate; the manager decides whether to merge or reject.
- What happens when a customer sends a broken or invalid product link? → Bot creates the order anyway with the provided text; the manager handles validation manually.
- How does the bot handle very long messages or links that exceed Telegram's message limits? → Bot processes the first 4000 characters of the message; longer input is truncated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept incoming messages from a Telegram bot and identify the sender (customer vs. manager).
- **FR-002**: System MUST parse product links and optional specifications (quantity, color, model, size) from customer messages. All specification fields are optional.
- **FR-003**: System MUST create an order for any customer message that appears to be an order attempt, even if no valid link is detected — using the raw message text as the order content.
- **FR-004**: System MUST identify and flag orders that may be duplicates (same customer, same link within a short time window).
- **FR-005**: System MUST assign a unique identifier to each order upon creation.
- **FR-006**: System MUST forward new orders to the designated manager chat with all order details.
- **FR-007**: System MUST allow the manager to update an order's status via text commands (e.g., `/update <order-id> <new-status>`) from a defined set (new, confirmed, processing, shipped, completed, cancelled).
- **FR-008**: System MUST notify the customer when their order status changes.
- **FR-009**: System MUST allow customers to query the status of their active orders.
- **FR-010**: System MUST persist all orders and their status history for later retrieval.
- **FR-011**: System MUST handle messages from multiple customers concurrently without data mixing.
- **FR-012**: System MUST support grouping multiple product links from a single message into one order as separate line items.

### Key Entities

- **Customer**: A Telegram user identified by their Telegram user ID. Has a chat history of orders and interactions.
- **Order**: A record containing one or more product links (line items), specifications (quantity, color, model, size), status, timestamps (created, updated), and reference to the customer who placed it.
- **Manager**: A Telegram user or group chat identified by a configured chat ID. Authorized to view and update all orders.
- **Status Transition**: A record of when an order moved from one status to another, including timestamp and who made the change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can place an order by sending a product link with specifications in under 2 minutes.
- **SC-002**: The manager receives a new order notification within 30 seconds of the customer submitting it.
- **SC-003**: Customers can self-serve order status checks without needing to contact the manager.
- **SC-004**: The system handles at least 50 concurrent users with 95% of responses completing in under 3 seconds.
- **SC-005**: 100% of order status changes are persisted and traceable through the order history.

## Assumptions

- Telegram is the sole communication channel — no web interface or other messaging platform.
- The manager is a single authorized chat/user configured during deployment.
- Product links are standard URLs pointing to product pages on any public website.
- Customers interact only with the bot; they cannot send messages to the manager directly through this system.
- Specification fields (quantity, color, model, size) are free-text inputs, not structured form fields — the bot parses them from natural language.
- The system operates in a single timezone (configurable) for timestamps.
- No authentication beyond Telegram's built-in user identity is needed.
