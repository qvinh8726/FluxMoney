# Coding Standards

## TypeScript
- Use **strict** TypeScript. Avoid `any`; prefer `unknown` with narrowing, generics, or precise types.
- Type all function boundaries (params and return types) for exported functions and Server Actions.
- Derive DB types from generated Supabase types rather than hand-writing row shapes.
- Prefer `type` aliases for unions/props and `interface` for extendable object contracts; stay consistent within a file.

## React / Next.js
- Default to **Server Components**. Mark client components with `"use client"` only when necessary (state, effects, event handlers, browser APIs).
- Keep client bundles small: push data fetching and secrets to the server; pass plain serializable props to client components.
- Use **Server Actions** for mutations; validate all inputs server-side (e.g., with Zod) before touching the database.
- Co-locate route-specific components, but extract shared UI into a common components directory.
- Use `loading.tsx`, `error.tsx`, and Suspense boundaries for resilient UX.

## Data & Security
- Enforce authorization on the server for every mutation and sensitive read. Never trust the client.
- Rely on **RLS** as the last line of defense; still scope queries by tenant/user in application code.
- Never expose the Supabase service role key or other secrets to the client.
- Validate and sanitize all external input. Use parameterized queries / the Supabase client (no string-built SQL).

## Naming & Files
- Components: `PascalCase`. Hooks: `useCamelCase`. Variables/functions: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- Files for components in `PascalCase.tsx`; utilities and route segments in `kebab-case`.
- One primary export per component file; keep files focused and reasonably small.

## Error Handling & Quality
- Handle expected failures explicitly; return typed results or throw meaningful errors. Avoid swallowing errors.
- Log server errors with enough context for debugging without leaking sensitive data to users.
- Keep functions pure where possible; isolate side effects.
- Write code that passes `npm run lint` and `npx tsc --noEmit` with no warnings.

## Working Principles
These four principles govern how to write, review, and change code. They bias toward caution over speed; for trivial tasks (typos, obvious one-liners), use judgment.

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly; if uncertain, ask rather than guess.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so and push back when warranted.
- If something is unclear, stop, name what's confusing, and ask.

### 2. Simplicity First
Write the minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked; no abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- Add complexity (caching, strategy patterns, config) only when the requirement actually arrives — not preemptively.
- The test: would a senior engineer call this overcomplicated? If 200 lines could be 50, rewrite it.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting; don't refactor what isn't broken.
- Match existing style even if you'd do it differently (quotes, type hints, spacing).
- Remove imports/variables/functions that *your* change orphaned; leave pre-existing dead code alone but mention it.
- The test: every changed line should trace directly to the request.

### 4. Goal-Driven Execution
Define verifiable success criteria, then loop until met.
- Transform vague tasks into testable goals: "fix the bug" → "write a test that reproduces it, then make it pass"; "add validation" → "write tests for invalid inputs, then make them pass."
- Reproduce bugs with a failing test before fixing; confirm the test passes after.
- For multi-step work, state a brief plan where each step has a verification check, and ensure tests pass before and after refactors.

## Conventions for AI Assistance
- Read neighboring code first and match existing patterns, imports, and conventions before introducing new ones (see Surgical Changes).
- Make minimal, well-scoped changes. Don't refactor unrelated code as part of a feature or fix.
- Add or update tests when changing behavior, and prefer a failing-test-first loop (see Goal-Driven Execution).
