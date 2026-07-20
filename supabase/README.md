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

## Phase 2A: admin authorization and operations schema

Phase 2A adds four migrations (roles/permissions/members/invitations/audit
log, the seeded system catalog, authorization + invitation + member
functions, and announcements/maintenance/features/settings). They are
**created and statically validated locally; nothing is applied to the hosted
project automatically.**

Every remote command runs through `scripts/admin/guard.mjs`, which verifies
the target is the Fablesol project (the Starville reference project is
deny-listed by SHA-256 fingerprint) and enforces explicit approval gates.

### One-time environment setup for the admin portal

The admin app reads the same root `.env.local` through a symlink (gitignored,
recreate after a fresh clone):

```bash
ln -s ../../.env.local apps/admin/.env.local
```

Optional admin-only keys: `NEXT_PUBLIC_ADMIN_URL` (defaults to
`http://localhost:3601`; set to the deployed admin origin in production —
invitation links are built from it) and `NEXT_PUBLIC_ADMIN_ENV_LABEL`
(environment badge in the portal header).

### Owner: apply the Phase 2A migrations

```bash
# One-time: link the CLI to the Fablesol project (no Docker, remote only)
npx supabase link --project-ref <fablesol-project-ref>

npm run db:verify-target        # confirm the guarded target
npm run db:migrations:list      # see remote vs local migrations
npm run db:migrations:dry-run   # preview what a push would apply

# Approve writes for this session, then push
SUPABASE_REMOTE_WRITES_APPROVED=true npm run db:migrations:push

npm run db:lint:hosted          # optional: lint public+private schemas
```

### Owner: create the first Super Admin

```bash
# Dry run (no writes)
npm run admin:bootstrap -- --email you@example.com --full-name "Your Name"

# Apply (single-use by construction; the database refuses a second active Super Admin)
ADMIN_BOOTSTRAP_ENABLED=true npm run admin:bootstrap -- \
  --email you@example.com --full-name "Your Name" --apply --print-recovery-link
```

Open the printed one-time recovery link to set your password, then sign in at
the admin portal (`npm run admin:dev`, port 3601). Further administrators are
invited from the portal's Team page — never by editing the database.

### Owner: hosted read-only smoke tests

```bash
RUN_HOSTED_SUPABASE_TESTS=true npm run db:test:hosted
```

These use only the anon key: they confirm the fail-safe public read
functions respond and that RLS denies anonymous reads of administrator
tables. They never write.

None of this file's contents may appear in public `/docs` — that space is
player documentation only.

## Phase 2B: player identity, wallets, and $FABLE access schema

Phase 2B adds four migrations:

- `20260719120000_player_identity_foundation.sql` — `player_profiles`,
  `player_wallets`, `wallet_signature_challenges` (hash-only, single-use),
  `wallet_verification_events`, `player_security_events`, protection
  triggers, RLS, and default-deny grants.
- `20260719121000_player_access_foundation.sql` — immutable
  `player_access_evaluations` (integer base-unit evidence) and short-lived
  `player_access_sessions` with one-way invalidation.
- `20260719122000_player_catalog.sql` — `players.access_history.view` and
  `players.security_events.view` permissions plus conservative role
  mappings. No player mutation permissions exist.
- `20260719123000_player_functions.sql` — narrow security-definer functions:
  challenge issue/verify/consume (service role), profile registration and
  wallet replacement (service role), the canonical access-evaluation
  recorder (service role), `get_player_me` (players), and
  `get_player_directory` / `get_player_detail` (admins, permission-checked).

Design rules carried from Phase 2A: every table has RLS; the service role
has **no direct table grants** and works only through the narrow functions;
challenge nonces and signed messages are stored as SHA-256 hashes only; the
append-only histories are trigger-protected.

### Owner: apply the Phase 2B migrations

Same guarded workflow as Phase 2A:

```bash
npm run db:verify-target
npm run db:migrations:list
npm run db:migrations:dry-run
SUPABASE_REMOTE_WRITES_APPROVED=true npm run db:migrations:push
npm run db:lint:hosted
RUN_HOSTED_SUPABASE_TESTS=true npm run db:test:hosted
```

`db:test:hosted` now runs two suites: the Phase 2A read-only smoke tests
(anon key) and the Phase 2B player schema tests. The player suite connects
with `SUPABASE_DATABASE_URL`, runs entirely inside one transaction, and
always rolls back, so its disposable test users, profiles, wallets, and
challenges never persist. It covers profile and wallet uniqueness,
challenge single-use and expiration, replay denial, evaluation and session
immutability, wallet-replacement invalidation, RLS self/cross/anonymous
behavior, admin permission enforcement, and Read-only Analyst masking.
Run the player suite alone with `db:test:players:hosted`.

If the CLI's management API rejects the linked commands (403 login-role
errors were observed with limited-privilege access tokens), re-run
`npx supabase login` with an owner account first.

### Owner: wallet environment

Fill the Phase 2B values in `.env.local` (see `.env.example`):
`NEXT_PUBLIC_REOWN_PROJECT_ID`, `NEXT_PUBLIC_SOLANA_NETWORK`,
`SOLANA_RPC_URL`, `FABLE_TOKEN_MINT`, `FABLE_ACCESS_REQUIRED_TOKENS=10000`.
Until the mint and RPC are configured, wallet connection still works and
protected access fails safe with an honest "verification not available"
state; no balance is ever fabricated.

Player auth sessions use Supabase's own email-token exchange with synthetic
`@players.fablesol.invalid` addresses (permanently undeliverable by
construction). No additional auth provider needs to be enabled.
