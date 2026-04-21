# AgDR-0002 — Supabase as Database, Auth, and Storage Backend

> In the context of the PetMatch Solutions v1 greenfield build, facing the need for a managed PostgreSQL database with row-level security, OAuth-capable auth, and file storage — all GDPR-compliant in the EU — I decided to use **Supabase (EU/FRA region)** as the unified backend, accepting vendor lock-in over running self-managed Postgres + Auth + Storage separately.

## Context

PetMatch Solutions handles health records (GDPR Art. 9 sensitive category), pet photos, and multi-role access control. The requirements are:
- PostgreSQL with row-level security (RLS) for per-user data scoping
- OAuth + email auth with JWT claims carrying the user role
- File storage for health documents and animal photos (signed URLs, never public)
- EU data residency (DACH market)
- Low operational overhead for a two-engineer team targeting a 2026-08-03 beta

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Supabase (EU/FRA)** | Managed Postgres + RLS + Auth + Storage in one platform; EU region available; `@supabase/ssr` integrates cleanly with Next.js; generous free tier for beta | Vendor lock-in; Supabase-specific RLS DSL; storage limits on free tier |
| PlanetScale + Auth0 + S3 | Best-in-class per component | Three vendors, three DPAs, higher cost, more integration surface |
| Neon + Clerk + Cloudflare R2 | Serverless Postgres, strong auth DX, cheap storage | Newer vendors; less battle-tested RLS tooling |
| Self-hosted Postgres + Keycloak | Full control, no lock-in | High ops burden; two-engineer team; incompatible with beta timeline |

## Decision

Chosen: **Supabase EU/FRA region**, because it is the only option that satisfies EU data residency, RLS, Auth, and Storage in a single DPA agreement at the project's current scale. The `@supabase/ssr` package handles cookie-based JWT refresh in Next.js Server Components cleanly.

## Consequences

- All DB schema changes go through Supabase migrations (`supabase/migrations/`)
- RLS policies are the primary access-control layer; API route role checks are a secondary guard
- Health document URLs are Supabase Storage signed URLs (never public bucket)
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` required in `.env.local`
- A DPA with Supabase (and Resend, Stripe) must be executed before beta (legal review pending)
- Upgrade from free to Pro tier required before 500 MAU

## Artifacts

- `supabase/migrations/20260420000001_initial_schema.sql`
- PR [khaledzdn/petmatch-solutions#10](https://github.com/khaledzdn/petmatch-solutions/pull/10)
