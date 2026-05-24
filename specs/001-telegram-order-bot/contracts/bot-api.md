# Bot API Contracts: Telegram Order Bot

## Customer → Bot (Messages)

### Place Order

```
Customer sends: <URL> <optional specs>
Example: https://example.com/product/123 quantity:2 color:blue model:XL
Example: https://example.com/item/456
Example: https://example.com/a https://example.com/b quantity:1 each

Bot replies: "Order #005 created! I'll notify you when the manager updates it."
```

### Check Status

```
Customer sends: /status

Bot replies:
"Your orders:
 #003 — processing
 #005 — new"
```

### Help / Invalid Input

```
Customer sends: hello

Bot replies: "Send me a product link to create an order. Use /status to check your orders."
```

## Manager → Bot (Commands)

### Update Order Status

```
Manager sends: /update <order-id> <new-status>
Example: /update 005 confirmed

Valid statuses: new, confirmed, processing, shipped, completed, cancelled

Bot replies: "Order #005 updated to confirmed. Customer notified."
```

### List Orders

```
Manager sends: /list
Manager sends: /list new
Manager sends: /list processing

Bot replies:
"Orders:
 #003 processing — 1 item(s)
 #005 new — 2 item(s)
Use /customer <order-id> to view details."
```

### List Customer Orders

```
Manager sends: /customer <order-id>
Example: /customer 005

Bot replies: "Order #005 by @username:
Items: https://example.com/a, https://example.com/b
Specs: quantity:1 each
Status: new"
```

## Bot → Manager (Notifications)

### New Order Notification

```
Bot sends to manager chat:
"🆕 New Order #005
From: @customer_username
Items: 2 link(s)
Specs: quantity:1 each
Time: 2026-05-24 14:30:00
Manage: /customer 005"
```

### Duplicate Flag

```
Bot sends to manager chat:
"🆕 New Order #006 ⚠️ Possible duplicate of #005
From: @customer_username
Items: 1 link(s)
Specs: quantity:1
Manage: /customer 006"
```

## Bot → Customer (Notifications)

### Status Change

```
Bot sends to customer:
"📦 Order #005 is now: confirmed"
```

### Cancellation

```
Bot sends to customer:
"❌ Order #005 has been cancelled. Reason: out of stock"
```
