# Research: shadcn-ui Design System

## Decision: Component Library Choice

**Chosen**: shadcn/ui

**Rationale**: shadcn/ui is a collection of re-usable components built on top of Radix UI primitives and Tailwind CSS. Unlike a traditional npm package, shadcn/ui copies component source code into your project (`components/ui/`), giving full control over customization without forking a library. This approach fits well with the project's existing vanilla HTML/CSS + Tailwind setup.

**Key benefits**:
- Excellent accessibility via Radix UI primitives (ARIA-compliant out of the box)
- Fully customizable via Tailwind CSS (matches project's existing CSS approach)
- Components are copied as source (not a black-box dependency)
- Active community, regular updates
- Single-command installation per component (`npx shadcn@latest add [component]`)

**Alternatives considered**:
- Headless UI: Good Tailwind integration but less default styling; shadcn/ui provides better out-of-box appearance
- Material UI / Ant Design: Too opinionated on visual design, heavier bundle
- DaisyUI: Lightweight but less accessible; Radix foundation in shadcn/ui provides better accessibility

## Decision: Integration with Cloudflare Workers

**Challenge**: shadcn/ui is typically used in a Vite/Next.js/Remix frontend project. The dashboard runs as static assets served from a Cloudflare Worker via Workers Assets binding.

**Solution**: shadcn/ui components are plain TypeScript/React files that can run in the browser. The existing dashboard uses vanilla HTML/JS, so React is not currently used. We have two options:

1. **Option A — Migrate to React + shadcn/ui**: Replace vanilla JS with React; shadcn/ui works natively with React
2. **Option B — Extract shadcn/ui patterns without React**: Use shadcn/ui as inspiration for accessible HTML/CSS patterns without using React

**Recommendation**: Option A — The dashboard's client-side interactivity (sorting, filtering, modal) is already implemented in vanilla JS. A React migration would:
- Preserve all existing API contract behavior
- Simplify state management for the dashboard app
- Allow direct use of shadcn/ui components with zero adaptation
- Be a straightforward migration given the existing TypeScript in the project

## Decision: Theme System

shadcn/ui uses CSS variables for theming. The theme is defined in `app.css` (or a dedicated theme CSS file) and referenced in `tailwind.config.ts`.

**Light/dark mode**: shadcn/ui supports both via Tailwind's `darkMode: 'class'` strategy. The dashboard should support system preference detection plus a manual toggle.

## Decision: Migration Order

1. Install shadcn/ui CLI and initialize in `dashboard/` directory
2. Add components one by one: Button, Table, Dialog, Input, Select, Badge, Card, Label, Avatar
3. Replace existing HTML/CSS with shadcn/ui equivalents per user story
4. Verify acceptance criteria after each component migration
5. Add dark mode support

## Conclusion

All NEEDS CLARIFICATION items resolved. The implementation approach is:
- Migrate dashboard to React + shadcn/ui
- Components installed via CLI into `dashboard/components/ui/`
- Existing API contracts unchanged
- Theme system via Tailwind CSS variables