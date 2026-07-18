# Supabase foundation (internal)

Fablesol uses a **hosted Supabase project** as its backend platform.
**Docker is not used anywhere** — no local Supabase stack, no containers,
no Docker-based tests.

## Phase 1 status

Phase 1 ships the client foundation only:

- `src/lib/env.ts` — validated environment access (public vs server-only keys)
- `src/lib/supabase/client.ts` — shared browser client (anon key)
- `src/lib/supabase/server.ts` — server client + service-role client (`server-only`)
- `src/lib/supabase/health.ts` — internal health diagnostic (server-only)
- `scripts/supabase-health.mjs` — `npm run supabase:health` connectivity check

**No database tables were created in Phase 1.** All public pages are static
content generated from the typed game-rule modules; creating tables just to
prove Supabase exists would violate the project rules. Wallet auth, player
profiles, and gameplay tables arrive in Phase 2+ as real needs appear.

## No-Docker workflow

1. Create/open the hosted project at supabase.com.
2. Copy Project Settings → API values into `.env.local` (see `.env.example`).
3. Verify connectivity: `npm run supabase:health`.
4. Schema changes go through SQL migration files in `supabase/migrations/`
   (timestamped `YYYYMMDDHHMMSS_description.sql`), applied to the hosted
   project either with the Supabase CLI **linked to the remote project**
   (`supabase link`, then `supabase db push` — no local stack required) or by
   pasting the migration into the dashboard SQL editor. Keep the file in the
   repo either way so the directory stays the source of truth.

## Rules for future migrations

- Every table gets Row Level Security enabled before any client can reach it.
- No anonymous writes without a strong documented reason.
- Clear snake_case naming; one concern per migration.
- Timestamps stored in UTC (`timestamptz`).
- Test against the hosted project only with owner-approved environments.

## Key handling

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only
  values allowed in the browser bundle.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; `src/lib/supabase/server.ts`
  imports `server-only` so a client-side import fails the build.
- Missing configuration degrades gracefully: clients return `undefined` and
  public pages render normally.

None of this file's contents may appear in public `/docs` — that space is
player documentation only.
