# Product

## Overview
A production SaaS web application delivering subscription-based functionality to end users. The product is built for reliability, multi-tenancy, scalability, and a polished, responsive user experience.

## Core Principles
- **User-first**: Every feature should reduce friction and provide clear value. Optimize for fast, accessible, intuitive flows.
- **Secure by default**: User data is protected with proper authentication, authorization, and tenant isolation. Never expose data across accounts.
- **Production-grade**: Code ships to real customers. Favor stability, observability, and graceful error handling over clever shortcuts.
- **Scalable by design**: Assume growth in tenants, users, and data volume. Avoid patterns that only work at small scale.
- **Maintainable**: Optimize for the next engineer. Clarity and consistency beat cleverness.

## Multi-Tenancy Model
- Every tenant-owned record carries a tenant/organization identifier and is isolated at the database layer (RLS) and in application queries.
- A user may belong to one or more tenants with a defined role; all access is evaluated in the context of the active tenant.
- Never allow data, IDs, or aggregates to leak across tenant boundaries — treat cross-tenant exposure as a critical defect.

## Key Domains
- **Authentication & Accounts**: Sign-up, sign-in, session management, and account settings (backed by Supabase Auth).
- **Tenancy & Membership**: Organizations/workspaces, invitations, roles, and permissions.
- **Subscriptions & Billing**: Plan tiers, entitlements, usage metering, and limits gating access to features.
- **Core Application**: The primary value-delivering features of the product surface.
- **Admin & Settings**: Workspace/team configuration and member management.

## Product-Wide Quality Bars
- **Reliability**: Features degrade gracefully; failures are handled and surfaced clearly to users.
- **Performance**: Pages and key interactions feel instant; expensive work is deferred, cached, or backgrounded.
- **Entitlements**: Feature access and usage limits are enforced consistently against the tenant's plan.
- **Observability**: User-impacting errors and key business events are logged/measured.

## Conventions for AI Assistance
- **Think before coding**: when a request is ambiguous (scope, data exposure, which "faster"/"better" is meant), surface your assumptions and present tradeoffs before implementing rather than picking silently. See `coding-standards.md` → Working Principles.
- When adding a feature, consider its impact on authorization, tenant isolation, billing entitlements, performance at scale, and observability.
- Prefer incremental, well-scoped changes that match existing patterns over large rewrites.
- Flag any change that touches auth, billing, tenant isolation, or data access controls for explicit review.
