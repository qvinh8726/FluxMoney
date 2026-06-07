# Project Planning (Requirements Workflow)

Adapted from spec-driven development for Next.js + Supabase SaaS. This is the **first** artifact for any non-trivial feature: define *what* and *why* before *how*. Keep it technology-agnostic — implementation choices belong in `architecture.md`.

## When to Write a Spec
- Any feature spanning more than one route, table, or component.
- Anything touching auth, tenancy, billing, or data access.
- Skip for trivial changes (copy edits, single-line fixes) — use judgment.

## Spec Structure
Capture the following for each feature (e.g., in `docs/specs/{feature}/spec.md`):

### 1. User Scenarios (mandatory)
- Write **prioritized user stories** (P1, P2, P3…) ordered by value. P1 must be a viable MVP on its own.
- Each story must be **independently testable**: developable, testable, and demonstrable as a standalone slice.
- For each story include: the journey in plain language, *why this priority*, an *independent test*, and **acceptance scenarios** in Given/When/Then form.
- List **edge cases**: boundary conditions, error scenarios, empty/loading states.

### 2. Functional Requirements (mandatory)
- Number them `FR-001`, `FR-002`, … and phrase as testable obligations using **MUST/SHALL**.
  - e.g., `FR-001: The system MUST scope every query to the active tenant.`
- Mark unknowns inline with `[NEEDS CLARIFICATION: ...]` rather than guessing. Resolve all before moving to design.

### 3. Key Entities (if data is involved)
- Describe each entity, its meaning, key attributes, and relationships — **without** committing to table schemas or column types yet.

### 4. Success Criteria (mandatory)
- Number them `SC-001`, … and make them **measurable and technology-agnostic**.
  - e.g., `SC-001: A user completes onboarding in under 2 minutes.`
  - Include performance, UX, and business metrics where relevant.

### 5. Assumptions
- Record reasonable defaults chosen when the request was underspecified (scope boundaries, target users, reused systems/services).

## SaaS-Specific Requirement Checklist
Every spec should explicitly state, where applicable:
- **Tenancy**: which entities are tenant-scoped and the isolation expectation.
- **Roles & permissions**: who can perform each action.
- **Entitlements**: how the feature is gated by plan tier or usage limits.
- **Auth**: authenticated vs. public surfaces.
- **Data sensitivity**: PII handling, retention, and audit expectations.

## Conventions for AI Assistance
- Apply *Think Before Coding* (see `coding-standards.md`): surface assumptions and `[NEEDS CLARIFICATION]` markers instead of silently picking an interpretation.
- Do not write design or code until requirements are agreed and clarifications resolved.
- Keep requirements declarative (the *what*); defer stack and structure decisions to `architecture.md`.
