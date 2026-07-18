# Fablesol

Public web experience for **Fablesol** — a cozy multiplayer 2D top-down
pixel-art animal farming game with a Web3-enabled economy.

This repository contains the premium landing page (original isometric
game-world hero), the interactive **How to Play** journey, the complete
player **/docs** field guide with search, the typed game-rule source of
truth, and the hosted-Supabase foundation (no Docker anywhere).

## Philosophy

> Cozy first, competitive second.

Everything public stays honest: real availability labels (Live / Beta /
Planned / Balancing), no fake player counts, no invented mechanics, no
internal technology details on player-facing pages.

## Commands

```bash
npm install
npm run dev             # http://localhost:3600
npm run build
npm test
npm run typecheck
npm run lint
npm run format
npm run supabase:health # hosted Supabase connectivity check (no Docker)
```

## Where things live

- `src/content/game/` — **game-rule source of truth** (change a value once,
  every page/calculator/badge updates)
- `src/content/game/availability.ts` — feature availability source of truth
- `src/content/docs/` — docs page definitions, search index, metadata
- `src/components/landing/` — landing world scene + static fallback
- `supabase/` — migrations directory + internal Supabase workflow docs
- `DEVELOPMENT.md` — full internal developer documentation

## Important rules (summary)

- Access requires holding at least **10,000 $FABLE** (Solana, on-chain)
- **COPPER** is the off-chain in-game currency (not a blockchain token)
- Auction House tax is **exactly 10%**
- All official schedules use **UTC**
- Animal max level is **50**; level 50 materials are Mythic with a **1% Divine** chance
- One permanent cat; Cat Dice odds are **not** affected by cat level
- Cat Battle is turn-based, **Best-of-1**, validated by the game
- Community tournament fees form **100%** of the prize pool (no tax / developer cut)
- Only **Discord** and **X** are approved social platforms
