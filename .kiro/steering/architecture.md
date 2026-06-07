# Architecture (Design Workflow)

Adapted from spec-driven planning for Next.js + Supabase SaaS. The design turns an agreed spec (`project-planning.md`) into a technical plan *before* tasks are broken out. Re-validate the gates below after design as well as before.

## Design Inputs
Start only when the spec's functional requirements are agreed and all `[NEEDS CLARIFICATION]` markers are resolved. Reference the spec by feature name.

## Design Document Structure
Produce the following (e.g., in `docs/specs/{feature}/plan.md`):

### 1. Summary
- The primary requirement plus the chosen technical approach in a few sentences.

### 2. Technical Context
- Stack specifics for this feature: Next.js rendering strategy (Server Components, Server Actions, Route Handlers), Supabase usage (Auth, Postgres, Storage, Realtime), and any new dependency.
- **Performance goals** and **constraints** (e.g., p95 latency, payload size, query budgets).
- **Scale/scope** (expected tenants, rows, concurrency).

### 3. Constitution Check (gate)
Design MUST pass these project gates before proceeding. If a gate is violated, justify it in Complexity Tracking or simplify:
- **Tenant isolation**: every tenant-owned table has RLS; queries are tenant-scoped in app code.
- **Server-side authorization**: mutations and sensitive reads enforce authz on the server; the service role key never reaches the client.
- **Simplicity first**: no speculative abstraction or configurability (see `coding-standards.md`).
- **Test strategy defined**: success criteria from the spec map to verifiable tests.
- **Observability**: user-impacting errors and key events are logged/measured.

### 4. Data Model
- Concrete Postgres schema: tables, columns, types, constraints, indexes, and foreign keys.
- **RLS policies** per table (the authoritative isolation boundary).
- Migration approach (`supabase migration new …`) and how generated types are refreshed.

### 5. Contracts
- Server Action signatures, Route Handler endpoints, and request/response shapes.
- Input validation schema (e.g., Zod) and error contract.
- Auth/entitlement checks applied at each boundary.

### 6. Project Structure
- The concrete file/folder layout for this feature (routes, components, server actions, data access), consistent with the existing repo conventions.

### 7. Complexity Tracking
- Only if a gate is violated: record the violation, why it's needed, and why the simpler alternative was rejected.

## Default Architecture Patterns (Next.js + Supabase)
- **Server Components by default**; client components only for interactivity.
- **Server Actions / Route Handlers** for mutations and privileged reads; validate all input server-side.
- **Two Supabase clients**: a server client for privileged/tenant-scoped work, a browser client only for user-scoped reads. Never expose the service role key.
- **RLS as the last line of defense**, with app-level tenant scoping in front of it.
- Defer expensive work via caching, streaming/Suspense, or background jobs to meet performance goals.

## Conventions for AI Assistance
- Keep design decisions traceable to specific `FR-`/`SC-` items in the spec.
- Re-run the Constitution Check after the design is drafted; don't proceed to tasks with unresolved gate violations.
- Prefer the established patterns above over introducing new libraries or layers (see `coding-standards.md` → Simplicity First).
