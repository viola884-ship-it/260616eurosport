# Component Contracts: shadcn-ui Design System

## Overview

This document defines the UI component usage contracts for the shadcn/ui migration. All components are sourced from shadcn/ui library.

## Component Registry

| Component | shadcn/ui Path | Purpose |
|-----------|-----------------|---------|
| Button | `components/ui/button` | Login, submit, pagination, filter actions |
| Table | `components/ui/table` | Orders display table |
| Dialog | `components/ui/dialog` | Order detail modal |
| Input | `components/ui/input` | Login password, customer search |
| Select | `components/ui/select` | Status filter dropdown |
| Badge | `components/ui/badge` | Order status display |
| Card | `components/ui/card` | Order detail panel sections |
| Label | `components/ui/label` | Form field labels |
| Avatar | `components/ui/avatar` | Customer avatar in order detail |

## Usage Contracts

### Button Contract

```tsx
// Variants available
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Action</Button>
<Button variant="ghost">Ghost Action</Button>
<Button variant="destructive">Destructive Action</Button>
<Button size="default">Default size</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon only</Button>

// Used in dashboard:
// - Login button (variant="default")
// - Logout button (variant="secondary") in header
// - Pagination: Previous/Next (variant="outline", size="sm")
// - Modal close (variant="ghost", size="icon")
```

### Table Contract

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead data-sort="display_id">Order ID</TableHead>
      <TableHead data-sort="customer_name">Customer</TableHead>
      <TableHead data-sort="status">Status</TableHead>
      <TableHead data-sort="created_at">Created At</TableHead>
      <TableHead data-sort="item_count">Items</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow data-display-id={order.display_id}>
      <TableCell>{order.display_id}</TableCell>
      ...
    </TableRow>
  </TableBody>
</Table>
```

### Dialog Contract

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Order {order.display_id}</DialogTitle>
      <DialogDescription>Order details</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <!-- Order detail content -->
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Input Contract

```tsx
// Login screen
<div className="grid gap-2">
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" />
</div>

// Search
<Input
  type="text"
  placeholder="Search by customer name or username..."
  onChange={debouncedSearchHandler}
/>
```

### Select Contract

```tsx
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All Statuses</SelectItem>
    <SelectItem value="new">New</SelectItem>
    <SelectItem value="confirmed">Confirmed</SelectItem>
    <SelectItem value="processing">Processing</SelectItem>
    <SelectItem value="shipped">Shipped</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
    <SelectItem value="cancelled">Cancelled</SelectItem>
  </SelectContent>
</Select>
```

### Badge Contract

```tsx
// Status badge variants per status
<Badge variant="default">{status}</Badge>    // new
<Badge variant="secondary">{status}</Badge>  // confirmed, completed
<Badge variant="outline">{status}</Badge>     // processing, shipped
<Badge variant="destructive">{status}</Badge> // cancelled
```

### Card Contract

```tsx
<Card>
  <CardHeader>
    <CardTitle>Order {order.display_id}</CardTitle>
    <CardDescription>Created {formatDate(order.created_at)}</CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Customer, items, specs, status history -->
  </CardContent>
  <CardFooter>
    <!-- Actions if needed -->
  </CardFooter>
</Card>
```

### Avatar Contract

```tsx
<Avatar>
  <AvatarImage src={customer.avatarUrl} />
  <AvatarFallback>{customer.initials}</AvatarFallback>
</Avatar>
```

## Accessibility Contracts

All shadcn/ui components provide:
- Proper ARIA attributes (role, aria-*)
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus management (focus traps in Dialog)
- Screen reader announcements

## Theme Customization Contract

Custom styling MUST be applied via Tailwind utility classes or CSS variables, not by modifying shadcn/ui source files.

```tsx
// Correct: extend via className
<Button className="bg-primary hover:bg-primary/90">

// Incorrect: modify shadcn/ui source
// Do NOT modify components/ui/button.tsx
```