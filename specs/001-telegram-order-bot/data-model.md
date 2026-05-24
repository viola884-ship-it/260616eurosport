# Data Model: Telegram Order Bot

## Entity Relationship

```
Customer (1) ──< (many) Order (1) ──< (many) StatusTransition
```

## Tables

### customers

| Column       | Type    | Constraints          | Notes                              |
|-------------|---------|----------------------|-------------------------------------|
| id          | INTEGER | PK, AUTOINCREMENT    |                                     |
| telegram_id | INTEGER | UNIQUE, NOT NULL     | Telegram user ID                   |
| username    | TEXT    |                      | @username if available             |
| first_name  | TEXT    |                      | From Telegram profile              |
| created_at  | TEXT    | NOT NULL, DEFAULT now| ISO 8601 timestamp                 |

### orders

| Column        | Type    | Constraints          | Notes                              |
|--------------|---------|----------------------|-------------------------------------|
| id           | INTEGER | PK, AUTOINCREMENT    |                                     |
| display_id   | TEXT    | UNIQUE, NOT NULL     | Human-readable (e.g., "001")       |
| customer_id  | INTEGER | FK → customers.id    |                                     |
| status       | TEXT    | NOT NULL, DEFAULT 'new' | new/confirmed/processing/shipped/completed/cancelled |
| specs        | TEXT    |                      | Free-text: quantity, color, model, size |
| is_duplicate | INTEGER | DEFAULT 0            | 0 or 1; flag for possible dupes    |
| created_at   | TEXT    | NOT NULL, DEFAULT now | ISO 8601                          |
| updated_at   | TEXT    | NOT NULL, DEFAULT now | ISO 8601                          |

### order_items

| Column    | Type    | Constraints          | Notes                              |
|----------|---------|----------------------|-------------------------------------|
| id       | INTEGER | PK, AUTOINCREMENT    |                                     |
| order_id | INTEGER | FK → orders.id       |                                     |
| link     | TEXT    | NOT NULL             | Product URL or raw text if no URL  |
| sort_order| INTEGER| DEFAULT 0            | Ordering within the order          |

### status_transitions

| Column     | Type    | Constraints          | Notes                              |
|-----------|---------|----------------------|-------------------------------------|
| id        | INTEGER | PK, AUTOINCREMENT    |                                     |
| order_id  | INTEGER | FK → orders.id       |                                     |
| from_status| TEXT   |                      | NULL on first transition           |
| to_status  | TEXT   | NOT NULL             |                                     |
| changed_by | TEXT   | NOT NULL             | 'manager' or 'system'              |
| created_at | TEXT   | NOT NULL, DEFAULT now | ISO 8601                          |

## Status Lifecycle

```
new → confirmed → processing → shipped → completed
  ↓        ↓          ↓           ↓
cancelled cancelled cancelled cancelled
```

Any status can transition to `cancelled`. Transitions forward through the pipeline; skipping intermediate states is allowed. Once `completed` or `cancelled`, no further transitions permitted.
