<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial constitution)
  Modified principles: N/A (all new)
  Added sections:
    - Core Principles (3)
    - Security & Compliance
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    ✅ plan-template.md — already references constitution check
    ✅ spec-template.md — no changes needed (generic)
    ✅ tasks-template.md — no changes needed (generic)
    ✅ checklist-template.md — no changes needed (generic)
    ✅ agent-file-template.md — no changes needed (generic)
  Follow-up TODOs: None
-->

# Digital Euro Constitution

## Core Principles

### I. Specification-First

Every feature MUST begin with a specification document before any code is written. Specs define user stories with independent acceptance criteria. This ensures clear requirements and enables incremental delivery.

### II. Incremental Delivery

User stories MUST be prioritized (P1, P2, P3...) and independently testable. Each story delivers standalone value — implement P1 first, validate, then iterate. No feature is complete until its acceptance criteria are verified.

### III. Quality Gates

All code changes MUST pass quality gates before completion:
- Tests pass (when tests exist for the project)
- Linting and formatting checks pass
- Session completion protocol enforced (stage, commit, push)

Complexity beyond what is strictly necessary MUST be justified in the implementation plan.

## Security & Compliance

As a project handling financial infrastructure concepts:
- Secrets, keys, and credentials MUST never be committed to the repository
- Sensitive configuration MUST use environment variables or secure vaults
- Data models MUST consider privacy and regulatory implications by default

## Development Workflow

This project uses a specification-driven workflow:
- **Specify**: Write feature spec with user stories
- **Plan**: Create implementation plan with technical context
- **Tasks**: Generate granular, ordered task list
- **Implement**: Execute tasks, validating at each checkpoint
- **Checklist**: Verify completion against acceptance criteria

Issue tracking uses **bd (beads)** — all task tracking goes through beads, not ad-hoc TODO lists. Run `bd prime` for workflow context.

## Governance

This constitution supersedes all other development practices. Amendments require:
1. Documentation of the change and rationale
2. Review of impact on dependent templates and workflows
3. Version increment following semantic versioning

Compliance is verified during the plan phase via the Constitution Check gate. Any deviation from these principles must be explicitly documented and justified in the implementation plan's Complexity Tracking section.

**Version**: 1.0.0 | **Ratified**: 2026-05-24 | **Last Amended**: 2026-05-24
