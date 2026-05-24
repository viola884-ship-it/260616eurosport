# Feature Specification: Orders Dashboard

**Feature Branch**: `002-orders-dashboard`
**Created**: 2026-05-24
**Status**: Implemented
**Input**: User description: "create simple dashboard of all orders"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manager Views Orders Dashboard (Priority: P1)

A manager can view a web dashboard that displays all orders from all customers in a sortable table.

**Why this priority**: Provides a bird's-eye view of all orders without needing to use bot commands.

**Independent Test**: Manager opens dashboard URL and sees a table of all orders with key details.

**Acceptance Scenarios**:

1. **Given** a manager opens the dashboard URL, **When** the page loads, **Then** a table displays all orders showing at minimum: order ID, customer name/username, status, timestamp, item count.
2. **Given** the dashboard is loaded, **When** there are 100+ orders, **Then** pagination handles the volume with 50 orders per page; manager can navigate forward/backward
3. **Given** the dashboard is loaded, **When** manager clicks a column header, **Then** the table sorts by that column.

---

### User Story 2 - Manager Filters Orders (Priority: P2)

A manager can filter the dashboard table to show only orders with a specific status or from a specific customer.

**Why this priority**: Reduces noise when managing a busy order queue.

**Independent Test**: Manager applies a status filter and verifies only matching orders appear.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** manager selects a status filter (e.g., "new", "confirmed"), **Then** the table shows only orders with that status.
2. **Given** the dashboard is loaded, **When** manager enters a customer name in a search box, **Then** the table shows only orders from matching customers.

---

### User Story 3 - Manager Views Order Details (Priority: P2)

A manager can click an order in the dashboard table to see full details including all product links and specifications.

**Why this priority**: Saves time compared to using bot commands for details.

**Independent Test**: Manager clicks an order row and a detail panel opens.

**Acceptance Scenarios**:

1. **Given** the dashboard is loaded, **When** manager clicks an order row, **Then** a side panel or modal shows: customer info, all product links, specifications, status history.
2. **Given** the order detail panel is open, **When** manager clicks a product link, **Then** it opens in a new tab.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST be accessible via a URL (Workers Assets serves at root, e.g., `https://example.com/` or `/dashboard/` depending on binding configuration)
- **FR-002**: Dashboard MUST display all orders in a table with columns: Order ID, Customer, Status, Created At, Items Count
- **FR-003**: Dashboard table MUST be sortable by clicking column headers (Order ID, Customer, Status, Created At)
- **FR-004**: Dashboard MUST support filtering by order status
- **FR-005**: Dashboard MUST support searching by customer name or username
  - Minimum 2 characters required to trigger search
  - Case-insensitive partial match on name or username
  - Results update as user types (debounced 300ms)
  - Empty search shows all orders (no filter applied)
  - Note: Search is client-side filtering of loaded orders (not a server API call)
- **FR-006**: Dashboard MUST show order detail view when clicking an order row
- **FR-007**: Order detail view MUST show: customer name, all product links, specifications, current status, and status history (history of all status transitions with timestamps and actor)
- **FR-008**: Dashboard MUST display timestamps in human-readable format (relative format like "2 hours ago", absolute format on hover like "May 24, 14:30")
- **FR-009**: Manager authentication MUST be required to access the dashboard
  - Primary: X-Session-Token passed via `X-Session-Token` response header and `X-Session-Token` request header
  - Fallback: HTTP-only cookie with SameSite=Lax for browser clients
  - Session stored in localStorage for programmatic access
  - Session timeout: 30 minutes of inactivity
  - Logout mechanism available to manager (POST /dashboard-api/logout)
  - Failed login attempts limited to 5 before 15-minute lockout

### Key Entities *(include if feature involves data)*

- **Order**: Display ID, customer reference, status, specs (free-text), created timestamp, item count
- **Customer**: Username, first name, telegram_id (Cloudflare Telegram binding)
- **OrderItem**: Product link, sort order within order

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Manager can open dashboard and see all orders within 3 seconds of navigation
- **SC-002**: Table sorting responds within 500ms of click
- **SC-003**: Status filter updates table within 1 second of selection
- **SC-004**: Dashboard is readable on mobile devices (responsive layout)
- **SC-005**: Pagination controls are visible and functional when order count exceeds page size

### Performance Verification

SC-001 through SC-003 are **post-deployment performance criteria**. They are verified manually or via Cloudflare Analytics/real user monitoring after deployment, not via unit tests. For automated verification, consider integrating Cloudflare Metrics or a synthetic monitoring service (e.g., Checkly, Grafana Synthetic).

**Manual verification steps** (deploy and then verify):
1. Open dashboard in browser, measure load time with Network tab → should be <3s
2. Click column headers, measure sorting response with Network tab → should be <500ms
3. Select status filter, measure update time → should be <1s

## Assumptions

- Manager already has bot access — dashboard is an additional interface, not a replacement
- Dashboard data comes from the same D1 database as the Telegram bot
- Authentication uses a simple shared password or Cloudflare Access (no individual user accounts needed for v1)