# Task Management (Task Planning Workflow)

Adapted from spec-driven task planning for Next.js + Supabase SaaS. Tasks are the final artifact, derived from the spec (`project-planning.md`) and design (`architecture.md`). The goal is incremental, independently shippable delivery.

## Prerequisites
Only break out tasks once the spec and design exist and the design's gates pass. Tasks trace back to user stories (`P1/P2/P3`), functional requirements (`FR-`), and the data model/contracts.

## Task File Structure
Produce a task list (e.g., `docs/specs/{feature}/tasks.md`) **organized by user story** so each story can be implemented, tested, and shipped on its own.

### Format
`[ID] [P?] [Story] Description (with exact file paths)`
- **`[P]`** — can run in parallel (different files, no dependencies).
- **`[Story]`** — the user story it serves (e.g., `US1`), for traceability.
- Always include concrete file paths (e.g., `app/(dashboard)/billing/page.tsx`, `supabase/migrations/…`).

### Phases
1. **Setup** — project/tooling scaffolding (deps, lint, env config).
2. **Foundational (blocking)** — shared prerequisites that MUST finish before any story: DB schema + migrations, RLS baseline, auth/tenant middleware, base layout, error/logging setup. No story work starts until this is done.
3. **Per User Story (P1 → P2 → P3)** — one phase per story, in priority order:
   - Optional tests first (write failing tests when tests are requested).
   - Data layer → server actions/route handlers → UI → validation/authz → logging.
   - Ends with a **checkpoint**: the story is independently functional and testable.
4. **Polish & Cross-Cutting** — docs, perf tuning, security hardening, extra tests.

## Dependency & Ordering Rules
- Setup → Foundational → user stories → Polish.
- Within a story: tests (if any) before code; **migrations/data model before data access; data access before server actions; server actions before UI**; integration last.
- A story should not introduce cross-story dependencies that break its independence.

## Parallelization
- Tasks touching **different files with no shared dependency** get `[P]`.
- After Foundational completes, separate user stories can proceed in parallel.
- Never mark tasks `[P]` if they edit the same file or depend on each other's output.

## SaaS Task Reminders
- Add an explicit task for **RLS policies + a test proving cross-tenant access is denied** for every new tenant-owned table.
- Add tasks for **entitlement/plan-limit enforcement** where the feature is gated.
- Include a **migration task** and a **regenerate Supabase types** task whenever the schema changes.

## Implementation Strategy
- **MVP first**: deliver Setup + Foundational + P1, then stop and validate P1 independently before continuing.
- **Incremental delivery**: each subsequent story is added, validated, and shipped without breaking prior stories.
- Commit after each task or logical group; stop at any checkpoint to validate.

## Conventions for AI Assistance
- Apply *Goal-Driven Execution* (see `coding-standards.md`): each task carries a verification check, and bugs are reproduced with a failing test before being fixed.
- Keep tasks small, specific, and file-scoped; avoid vague tasks ("make it work") and same-file conflicts.
- Run lint, type-check, and the relevant tests at each checkpoint before marking work complete (see `tech.md`).
