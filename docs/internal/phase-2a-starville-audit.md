# Phase 2A internal audit — Starville reference review and reuse classification

Internal developer documentation. Never expose through public `/docs`.

Starville (read-only reference) was audited at
`/Users/marklesteracak/Documents/Marky Files/Programming/starville`.
Nothing in Starville was modified. No Starville secrets, users, player data,
storage, or migration files were copied into Fablesol.

## Supabase project separation (verified)

- Fablesol `.env.local` project ref: `zlsg…hu` (masked) — the new Fablesol project.
- Starville canonical linked ref (`infrastructure/supabase/.temp/project-ref`): `zsvv…oa` (masked).
- SHA-256 fingerprints compared: **different projects confirmed**.
- The Starville ref fingerprint is embedded in `scripts/admin/guard.mjs` as a
  deny-list so no Fablesol remote command can ever run against Starville.

## Remote-write gates at audit time

`SUPABASE_REMOTE_WRITES_APPROVED`, `RUN_HOSTED_SUPABASE_TESTS`, and
`ADMIN_BOOTSTRAP_ENABLED` are **unset** in Fablesol `.env.local`. Phase 2A
therefore creates and statically validates migrations without applying them.
Owner commands to apply are listed in `supabase/README.md`.

## Reuse classification

### Reuse directly with adaptation (rewritten in Fablesol terms, same proven mechanics)

| Starville source                                                                    | Fablesol destination                                       | Notes                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/admin-auth/src/catalog.ts` + `index.ts`                                   | `apps/admin/src/lib/auth/catalog.ts`, `types.ts`           | Role/permission catalog pattern, zod-validated authorization context. Roles reduced to the 7 approved Fablesol roles; permissions reduced to Phase 2A domains.                                                                                                                                                                                                 |
| `20260710090000_admin_authorization_schema.sql`                                     | `supabase/migrations/*_admin_authorization_foundation.sql` | `private` schema lockdown, system-catalog protection triggers, last-active-Super-Admin advisory-lock trigger, append-only audit trigger, `set_updated_at`. `admin_users` becomes `admin_members`; MFA/session-table machinery not carried (see Rewrite).                                                                                                       |
| `20260710092000_..._functions_rls.sql`                                              | `..._admin_authorization_functions.sql`                    | `evaluate_admin_authorization`, `has_admin_permission`, permission-gated RLS policies, bootstrap preview/apply function pair with advisory lock, explicit `revoke all` + minimal grants, fixed `search_path = ''` on every function.                                                                                                                           |
| `20260712106000_live_operations.sql`                                                | `..._admin_operations.sql`                                 | Announcement lifecycle (stored lifecycle + computed effective status), safe CTA URL check constraints, control-character rejection, revision-based optimistic concurrency, before/after audit states, public read via SECURITY DEFINER function that fails safe. Maintenance singleton replaced by `maintenance_versions` (Phase 2A requires version history). |
| `apps/admin-portal/src/components/admin-app-shell.tsx`, `admin-navigation-state.ts` | `apps/admin/src/components/app-shell.tsx`, `navigation.ts` | Sidebar + collapse persistence + mobile drawer with focus trap, breadcrumbs, grouped nav, `aria-current`. Rebranded, glyphs and groups replaced with Fablesol modules.                                                                                                                                                                                         |
| `apps/admin-portal/src/lib/auth/{redirects,messages,password}.ts`                   | `apps/admin/src/lib/auth/`                                 | Outcome→destination routing, enumeration-safe notices, 12–128 char complexity validation.                                                                                                                                                                                                                                                                      |
| `apps/admin-portal/src/app/actions/auth.ts`                                         | `apps/admin/src/app/actions/auth.ts`                       | Server-action login/logout/forgot/reset flow shape; Fablesol drops the separate trusted-session API service (see Rewrite).                                                                                                                                                                                                                                     |
| `apps/admin-portal/src/lib/supabase/{server,client,cookie-options}.ts`              | `apps/admin/src/lib/supabase/`                             | SSR cookie-bound server client, named auth cookie, singleton browser client.                                                                                                                                                                                                                                                                                   |
| `scripts/supabase/{bootstrap-admin,safety,remote-command}.ts`                       | `scripts/admin/*.mjs`                                      | Verified-target guard, dry-run-by-default bootstrap, JSON status output that never prints secrets, gated push/lint commands. Ported to plain Node (Fablesol has no tsx dependency) and extended with the Starville deny-fingerprint.                                                                                                                           |

### Reuse as a design pattern only

- `20260714100000_platform_configuration_schema.sql` — draft → publish → version
  history model, applied to `maintenance_versions`, `feature_availability_versions`,
  and `game_settings_versions`.
- `admin_audit_logs` event-key taxonomy (`domain.action` keys, reason codes,
  metadata JSON without secrets).
- Starville auth pages (`login`, `forgot-password`, `reset-password`,
  `session-expired`, `unauthorized`) — layout and enumeration-safety patterns;
  all UI rewritten with Fablesol identity.
- `premium-select`, `confirmed-submit-button`, `notice`, `dialog-focus` —
  interaction patterns re-implemented in the Fablesol design system.
- Hosted RLS test harness (`hosted-rls-tests.ts`, TAP output, disposable
  records, cleanup functions) — reproduced as Fablesol SQL test documents and
  a smaller hosted runner.

### Rewrite for Fablesol (Starville had no equivalent, or its equivalent does not fit)

- **Invitation system.** Starville has no token-based invitation flow (it uses
  `admin_users.status = 'invited'` plus manual bootstrap activation). Fablesol
  Phase 2A builds `admin_invitations` (single-use, expiring, hashed
  linkage, statuses pending/link_opened/accepted/expired/revoked, resend and
  revoke, full audit) on top of the Supabase auth invite email flow.
- **Trusted-session service.** Starville routes admin session mutations
  through a separate `apps/api` service with an `admin_sessions` table, MFA
  levels, and session version snapshots. Fablesol has no separate API app;
  every request re-evaluates membership server-side and in RLS
  (`evaluate_admin_authorization` on `auth.uid()`), so suspension and role
  changes take effect on the next request without stale-state risk. MFA is
  documented as a later hardening task, not claimed.
- **Password generator.** Starville's reset page only documents complexity;
  the Fablesol generator (crypto-random, guaranteed character classes) is new.
- **Feature availability admin.** Fablesol-specific: seeded `feature_keys`
  registry mirrored from `src/content/game/availability.ts`, versioned
  overrides, published-only public reads, typed-registry fallback.
- **Admin dashboard.** Honest Fablesol setup/status dashboard; Starville's
  overview modules target gameplay systems that do not exist here.

### Exclude (not copied, not referenced at runtime)

Economy/DUST/`$STAR` modules, token claims, wallets, worlds, world assets,
avatars, cosmetics, housing, farming, crafting, progression, chat/social
moderation, realtime, asset pipeline, `apps/api`, `apps/game-client`,
`apps/landing`, `apps/realtime-server`, `apps/worker`, all Starville
migrations as files, Starville branding/logos/copy, Starville env files and
secrets, `admin_sessions`/MFA tables, pnpm/turbo tooling, and every
`infrastructure/` artifact. Starville's local `supabase start` scripts are
excluded (Docker-adjacent; Fablesol is hosted-only).

## Architecture decision

The public Fablesol app stays exactly where it is (repository root) with all
commands, tests, and deployment unchanged. The admin portal is a separate
Next.js app at `apps/admin`, added through minimal npm workspaces
configuration (root `"workspaces": ["apps/admin"]`). No pnpm, no turbo, no
public-app relocation. Admin runs on port 3601 in development; because it is
its own origin its internal routes omit the `/admin` prefix (the same pattern
Starville's admin portal uses).

## Delivered implementation (Phase 2A complete)

- **Database**: four migrations under `supabase/migrations/20260718*`
  (foundation, catalog, authorization/invitation/member functions,
  operations). Statically validated; **not applied** — owner commands in
  `supabase/README.md`.
- **Admin app** (`apps/admin`): auth pages (login, forgot/reset password with
  crypto-random generator, session-expired, unauthorized, suspended),
  invitation acceptance at `/invite/[token]` (single-use token; account
  provisioning via service role at accept time), permission-gated app shell
  (sidebar collapse persistence, mobile drawer with focus trap, breadcrumbs,
  environment badge), and modules: Dashboard, Announcements, Maintenance,
  Feature availability, Game settings, Team (members + invitations), Audit
  log. Every mutation calls the SECURITY DEFINER RPCs; reads flow through
  permission-checked RLS.
- **Environment**: `apps/admin/.env.local` is a gitignored symlink to the
  root `.env.local` (documented in `supabase/README.md`).
- **Scripts** (`scripts/admin/*.mjs`, plain Node): `guard.mjs`
  (Starville-deny fingerprint + target verification + approval gates),
  `remote-db.mjs` (verify/list/dry-run/push/lint), `bootstrap-super-admin.mjs`
  (dry-run default), `hosted-db-tests.mjs` (anon-only TAP smoke tests).
- **Validation** (2026-07-18): admin typecheck, eslint, 39 vitest tests, and
  production build all pass; public app regression (typecheck, lint, 119
  tests, build) all pass; login/invite/auth-error pages screenshot-verified at
  desktop and mobile widths with zero console errors and zero horizontal
  overflow.
