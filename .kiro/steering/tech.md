# Tech Stack

## Core
- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives + Tailwind)
- **Backend / Data**: Supabase (Auth, Postgres, Storage, Row Level Security)
- **Database**: PostgreSQL (via Supabase)
- **Hosting / Deploy**: Vercel

## Architecture Notes
- Prefer **Server Components** by default; add `"use client"` only when a component needs state, effects, or browser APIs.
- Use **Server Actions** and Route Handlers for mutations and data access rather than ad-hoc client fetching where possible.
- Access Supabase via a server client for privileged operations and a browser client only for user-scoped reads. Never expose the service role key to the client.
- Enforce data isolation with **Row Level Security (RLS)** policies in Postgres — do not rely solely on application-layer checks.
- Keep environment secrets in Vercel env vars / `.env.local`. Never commit secrets.

## Common Commands
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Production build
npm run build

# Start production server locally
npm run start

# Lint
npm run lint

# Type-check
npx tsc --noEmit
```

### shadcn/ui
```bash
# Add a component
npx shadcn@latest add <component>
```

### Supabase
```bash
# Start local stack
npx supabase start

# Create a migration
npx supabase migration new <name>

# Apply migrations / push schema
npx supabase db push

# Generate TypeScript types from the DB schema
npx supabase gen types typescript --local > src/types/database.types.ts
```

## Conventions for AI Assistance
- Check `package.json` for the exact package manager and script names before running commands; match what the project already uses.
- **Verify against goals**: turn the task into a testable success criterion, then loop until it passes (e.g., reproduce a bug with a failing test first). See `coding-standards.md` → Working Principles.
- After code changes, run `npm run lint` and `npx tsc --noEmit`, plus the relevant tests, before considering the work complete.
- Pin dependency versions; avoid introducing new libraries when an existing one (or the standard stack) already covers the need.
