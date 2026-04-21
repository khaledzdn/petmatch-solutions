# AgDR-0001 — Next.js App Router as the Application Framework

> In the context of the PetMatch Solutions v1 greenfield build, facing the need for a full-stack React framework that supports server-side rendering, API routes, and Vercel deployment, I decided to use **Next.js 15 with the App Router** to deliver both the frontend and backend API in a single deployable unit, accepting the framework's opinionated conventions over a decoupled SPA + API setup.

## Context

PetMatch Solutions is a dual-arm web platform (adoption + health). It needs:
- Server-rendered pages for SEO on public-facing animal listings
- API routes for Supabase data access (keeping secrets server-side)
- Role-gated routing (adopter / shelter_admin / pet_owner / vet / clinic_admin)
- PWA-first approach (no native apps in v1)
- Fast deployment to Vercel for the beta milestone (2026-08-03)

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Next.js 15 App Router** | Full-stack, SSR/RSC, file-based routing, Vercel-native, TypeScript first-class, large ecosystem | App Router learning curve; React Server Components add complexity |
| Next.js 15 Pages Router | Familiar, stable, same deployment story | Being de-emphasised; no RSC; more boilerplate for data fetching |
| Remix | File-based routing, good data loading model, SSR | Smaller ecosystem; less Supabase tooling; team unfamiliarity |
| Vite + Express SPA + API | Maximum flexibility | Two repos to deploy; no SSR out of the box; more infra overhead |

## Decision

Chosen: **Next.js 15 App Router**, because it delivers SSR, API routes, and Vercel deployment in one unit with minimal infra overhead. The App Router's React Server Components reduce client bundle size for the animal browse feed (pagination can happen server-side). The team has existing Next.js experience.

## Consequences

- All routes live under `src/app/` following the App Router file convention
- API routes use Next.js Route Handlers (`route.ts`) rather than a separate Express/Hono server
- Role-gated routing is implemented via Next.js middleware (`middleware.ts` — future ticket)
- Supabase SSR client (`@supabase/ssr`) is required for cookie-based auth in Server Components
- Deployed to Vercel; `next build` produces an optimised production bundle

## Artifacts

- `package.json` — `next@16`, `react@19`
- PR [khaledzdn/petmatch-solutions#10](https://github.com/khaledzdn/petmatch-solutions/pull/10)
