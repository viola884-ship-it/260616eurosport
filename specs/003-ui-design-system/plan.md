# Implementation Plan: shadcn-ui Design System

**Branch**: `003-ui-design-system` | **Date**: 2026-05-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ui-design-system/spec.md`

## Summary

Migrate all web interfaces in the project to use shadcn/ui as the standard component library. The dashboard (existing, vanilla HTML/CSS) will be re-implemented using shadcn/ui components (Button, Table, Dialog, Input, Select, Badge, Card, Label, Avatar) while preserving all existing functionality. The component library uses Tailwind CSS as its styling foundation, which is compatible with the project's existing CSS approach.

## Technical Context

**Language/Version**: TypeScript (existing Cloudflare Workers project)  
**Primary Dependencies**: shadcn/ui, Tailwind CSS, Radix UI primitives  
**Storage**: N/A (UI migration, no data layer changes)  
**Testing**: vitest (existing project test runner)  
**Target Platform**: Web browser (dashboard UI)  
**Project Type**: Web UI migration  
**Performance Goals**: No performance changes expected; UI behavior preserved  
**Constraints**: Must maintain backward compatibility with existing API endpoints; dashboard must remain functional during migration  
**Scale/Scope**: Single dashboard (dashboard/), 8 core components to migrate  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Specification-First | ✅ Pass | Spec with 3 user stories, 6 FRs, measurable success criteria defined |
| II. Incremental Delivery | ✅ Pass | 3 user stories prioritized P1-P3; each independently testable |
| III. Quality Gates | ✅ Pass | vitest available in project; linting via existing CI |
| Security: No secrets in repo | ✅ Pass | No new secrets; UI migration only |

## Phase 0: Research

### Decisions

1. **Component library**: shadcn/ui — a collection of re-usable components built using Radix UI and Tailwind CSS. Unlike a component library you install from npm, shadcn/ui copies component source into your project for full customization.
2. **Integration approach**: shadcn/ui CLI (`npx shadcn@latest add [component]`) to add components to the project. Components are copied as source files into `components/ui/` directory.
3. **Theme system**: shadcn/ui uses CSS variables for theming. `components/ui` uses a `tailwind.config.ts` with CSS variables for light/dark mode. The existing dashboard CSS will be replaced with shadcn/ui's theme CSS.
4. **Migration strategy**: Migrate the dashboard HTML first (P1), verify all acceptance criteria, then establish the standard for future work (P3).

### Alternatives Considered

- **Option A — shadcn/ui (chosen)**: Copy-paste components into project, full control, excellent accessibility, Tailwind-based, aligns with Cloudflare Workers + vanilla HTML approach
- **Option B — Headless UI**: Good but Tailwind-native only; shadcn/ui provides better default styling out of the box
- **Option C — Material UI / Ant Design**: Too opinionated on design, heavier, not ideal for the dashboard's utilitarian purpose
- **Option D — DaisyUI**: Lightweight but less accessible; shadcn/ui's Radix foundation provides better accessibility out of the box

## Project Structure

### Documentation (this feature)

```text
specs/003-ui-design-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (entity definitions for UI components)
├── quickstart.md        # Phase 1 output (setup instructions)
├── contracts/           # Phase 1 output (UI contracts)
│   └── components.md    # Component registry and usage contracts
└── tasks.md            # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
dashboard/
├── index.html           # Main dashboard page (MIGRATED to shadcn/ui)
├── styles.css          # Dashboard styling (REPLACED with shadcn/ui theme)
├── app.js              # Frontend logic (updated for shadcn/ui component APIs)
├── api.js              # API client module (unchanged)
├── favicon.svg         # Dashboard favicon (unchanged)
└── components/         # NEW: shadcn/ui components (added via CLI)
    └── ui/             # shadcn/ui component library
        ├── button.tsx
        ├── table.tsx
        ├── dialog.tsx
        ├── input.tsx
        ├── select.tsx
        ├── badge.tsx
        ├── card.tsx
        ├── label.tsx
        └── avatar.tsx

workers/
├── dashboard-api/      # Dashboard backend (unchanged by this feature)
└── telegram-notify/    # Telegram notification worker (unchanged)
```

**Structure Decision**: The dashboard frontend (`dashboard/`) is migrated from vanilla HTML/CSS to shadcn/ui. The backend (`workers/dashboard-api/`) is unchanged. shadcn/ui components are installed into `dashboard/components/ui/`. No new top-level directories are introduced.

## Complexity Tracking

*No violations — all principles pass.*