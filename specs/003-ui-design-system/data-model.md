# Data Model: shadcn-ui Design System

## Overview

This feature introduces no new data entities. It replaces the existing dashboard UI with shadcn/ui components. The data model for the dashboard (orders, customers, order items) is unchanged from the existing implementation.

## UI Component Registry

The following shadcn/ui components will be used in the dashboard:

### Button

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions (login, submit) |
| `secondary` | Secondary actions (cancel, back) |
| `outline` | Toolbar actions (filter, sort) |
| `ghost` | Icon-only buttons (close modal) |
| `destructive` | Delete/danger actions |

### Table

| Column | Component Used |
|--------|----------------|
| Order ID | `TableCell` with monospace font |
| Customer | `TableCell` with `Avatar` + name |
| Status | `TableCell` with `Badge` |
| Created At | `TableCell` with formatted date |
| Items Count | `TableCell` with plain number |

### Dialog (Order Detail Modal)

Uses `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.

### Form Components

| Element | Component Used |
|---------|----------------|
| Password input | `Input` with `Label` |
| Status filter | `Select`, `SelectTrigger`, `SelectContent` |
| Customer search | `Input` with debounced onChange |

### Badge (Status Badges)

| Status | Badge Variant |
|--------|--------------|
| new | `default` (blue) |
| confirmed | `secondary` |
| processing | `outline` |
| shipped | `outline` (blue tint) |
| completed | `secondary` (green tint) |
| cancelled | `destructive` |

### Card (Order Detail Panel)

Uses `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### Avatar (Customer in Order Detail)

Uses `Avatar`, `AvatarImage`, `AvatarFallback`.

## Theme Configuration

shadcn/ui uses CSS variables for theming. The theme will be defined in `dashboard/app.css`.

### CSS Variable Naming Convention

```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring
--radius
```

### Dark Mode

Dark mode is supported via Tailwind's `class` strategy. The `darkMode: 'class'` configuration in `tailwind.config.ts` enables `class="dark"` on the `<html>` element to switch themes.