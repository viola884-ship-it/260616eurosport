# UI Standards

**Feature**: 003-ui-design-system
**Date**: 2026-05-24

## Overview

All web interfaces in this project MUST use **shadcn/ui** as the component library. shadcn/ui is a collection of re-usable components built using Radix UI and Tailwind CSS.

## Required Components

The following shadcn/ui components are available for use:

| Component | Purpose |
|-----------|---------|
| `Button` | Primary interactive element for forms, dialogs, navigation |
| `Table` | Tabular data display (orders, lists) |
| `Dialog` | Modal overlays for confirmations, details |
| `Input` | Form text fields |
| `Select` | Dropdown selections |
| `Badge` | Status indicators, labels |
| `Card` | Container for grouped content |
| `Label` | Form field labels |
| `Avatar` | User/customer avatars |

## Installation

To add a new component to the dashboard:

```bash
cd dashboard
npx shadcn@latest add [component-name]
```

## Customization

- **DO NOT** modify component source files in `src/components/ui/`
- Use `className` props to extend styling
- Use CSS variables in `src/index.css` for theme customization
- Dark mode: Toggle `dark` class on `document.documentElement`

## File Structure

```
dashboard/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components (DO NOT EDIT)
│   │   └── [feature]/     # Custom components
│   ├── App.tsx            # Main application component
│   └── index.css          # Theme CSS variables
└── components.json        # shadcn/ui configuration
```

## Theme Configuration

Light/dark mode is configured via CSS variables in `src/index.css`. Dark mode is toggled by adding/removing the `dark` class on the HTML element.

## Accessibility

All shadcn/ui components maintain accessibility compliance with:
- ARIA attributes
- Keyboard navigation
- Focus management

## Verification

When adding new web interfaces, verify:
1. All UI elements use shadcn/ui components (no vanilla HTML buttons, tables, etc.)
2. No custom CSS for base components (use Tailwind classes)
3. Dark mode works correctly
4. Keyboard navigation works on all interactive elements