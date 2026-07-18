# Fablesol — internal developer documentation

Internal notes for people building Fablesol. Nothing in this file may be
exposed through public `/docs` — that space is player documentation only.

## Project structure

```
fablesol/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing: full-viewport game-world hero
│   │   ├── layout.tsx               # Root shell (skip link only)
│   │   ├── not-found.tsx            # 404 with recovery links
│   │   ├── sitemap.ts, robots.ts
│   │   └── (guides)/                # Route group with site header/footer
│   │       ├── layout.tsx
│   │       ├── how-to-play/page.tsx
│   │       ├── play/page.tsx        # Honest "world in development" page
│   │       └── docs/                # /docs index + [...slug] catch-all
│   ├── components/
│   │   ├── landing/                 # world-scene (3D), SVG fallback, nav
│   │   ├── site/                    # header, footer, connect, socials, badges
│   │   ├── docs/                    # shell, sidebar, search, TOC, blocks
│   │   ├── how-to-play/             # scroll-driven experience
│   │   ├── interactive/             # calculators, explorers, simulators
│   │   └── three/                   # legacy diorama used inside how-to-play
│   ├── content/
│   │   ├── game/                    # ★ GAME-RULE SOURCE OF TRUTH
│   │   └── docs/                    # page definitions, search index, metadata
│   └── lib/                         # env validation, supabase clients, utils
├── supabase/                        # migrations dir + internal Supabase docs
├── scripts/supabase-health.mjs      # hosted connectivity check (no Docker)
└── DEVELOPMENT.md                   # this file
```

## Sources of truth

| Concern                                                            | File                                                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Game name, tagline, site URL                                       | `src/content/game/brand.ts`                                                                           |
| Access rules (10,000 $FABLE, Solana)                               | `src/content/game/access.ts`                                                                          |
| Animals, materials, rarities, Divine 1%                            | `src/content/game/animals.ts`                                                                         |
| Economy: NPC caps, 10% auction tax, fees, wagers                   | `src/content/game/economy.ts`                                                                         |
| Cat, Cat Dice, Cat Battle, Energy, classes, equipment, matchmaking | `src/content/game/cat-battle.ts`                                                                      |
| Tournaments, refunds, UTC rule                                     | `src/content/game/tournaments.ts`                                                                     |
| **Feature availability (Live/Beta/Planned/…)**                     | `src/content/game/availability.ts`                                                                    |
| Fair play + player security                                        | `src/content/game/fair-play.ts`                                                                       |
| FAQ / Glossary                                                     | `src/content/game/faq.ts`, `glossary.ts`                                                              |
| Docs pages + routes                                                | `src/content/docs/pages.ts`                                                                           |
| Search index                                                       | `src/content/docs/search.ts` (built from pages + glossary + FAQ at render time — no external service) |

Change a value once in `content/game` and every docs page, calculator,
badge, and search entry follows. Do not hardcode rule values in components.

## Commands

```bash
npm run dev          # http://localhost:3600
npm run build        # production build
npm start            # serve production build (port 3600)
npm test             # vitest (rules, leak check, components, search)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write
npm run supabase:health  # hosted Supabase connectivity check
```

## Environment variables

See `.env.example`. All optional in Phase 1; missing values degrade
gracefully (no crashes, honest "opens soon" social chips, Supabase clients
return `undefined`). Validation lives in `src/lib/env.ts` — always read env
through it, never `process.env` directly elsewhere.

Owner actions pending:

- Set `NEXT_PUBLIC_DISCORD_URL` and `NEXT_PUBLIC_X_URL` when official
  communities exist (until then the UI shows "opens soon").
- Set hosted Supabase keys when Phase 2 starts (see `supabase/README.md`).

## Supabase (no Docker)

Hosted project only — see `supabase/README.md` for the full no-Docker
workflow, migration rules, and key-handling policy. Phase 1 created **zero
tables** deliberately: all public content is static and typed.

## Landing world scene

`src/components/landing/world-scene.tsx` renders the isometric farm village
(orthographic camera, instanced ground tiles, swaying trees, pond, animals,
cat, drifting clouds + shadows). Contract:

- Lazy-loaded client-side; `world-scene-fallback.tsx` (inline SVG) renders
  first and stays underneath, so the page is never blank (no-JS, loading,
  or WebGL-failure states all show the illustration).
- Reduced motion → one static rendered frame, no animation loop.
- DPR capped at 1.6; loop pauses when offscreen or tab hidden.
- Everything disposed on unmount (geometries, materials, renderer,
  observers, listeners).
- Title/CTAs are plain HTML and never wait on the scene.

## Public-content rules (enforced by tests)

`src/content/docs/public-content-leak.test.ts` scans every public content
module for internal technology terms (Supabase, Docker, framework names,
wallet library, "server", "database", …). If you add public content, add its
module to that test's `PUBLIC_CONTENT` map. Player-facing copy says
"validated by the game", never "server-authoritative".

Only Discord and X are approved social platforms. The Connect button is an
honest shell — it must never fake a connected state, show an address, or
invent a balance (tested in `site-chrome.test.tsx`).

## Availability honesty

`FEATURE_AVAILABILITY` marks only the documentation surfaces as `live`.
Everything gameplay-related is `planned`. When a system actually ships,
flip its entry — badges across landing, docs, and explorers update
automatically. The test suite fails if a gameplay feature is marked live.

## Phase 2 integration points

- Wallet connect: replace `ConnectButton`'s educational dialog with the real
  wallet flow; keep the honest-empty-state behavior for disconnected users.
- $FABLE access check: `access-check` feature flag + `src/lib/supabase/*`
  clients are ready; add server-side verification, then flip availability.
- Play route: `/play` currently explains development status; point the
  Play Now CTA at the real client when a safe build exists.
- First tables: follow `supabase/README.md` migration rules (RLS on, UTC
  timestamps, no anonymous writes).

## QA notes

- Test at 320/360/390/412px widths — no horizontal overflow allowed.
- Reduced motion (macOS: System Settings → Accessibility → Display) must
  show the stable scene with all content available.
- Search: ⌘K, arrows, Enter, Escape all keyboard-only.
