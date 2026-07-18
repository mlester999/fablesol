'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ACCESS } from '@/content/game/access';
import { PLAYER_JOURNEY } from '@/content/game/activities';
import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { CAT_BATTLE, CAT_DICE } from '@/content/game/cat-battle';
import { FAIR_PLAY } from '@/content/game/fair-play';
import { TIMEZONE_RULE } from '@/content/game/tournaments';
import { AnimalProgression } from '@/components/interactive/animal-progression';
import { ActivityExplorer } from '@/components/interactive/activity-explorer';
import { RarityLadder } from '@/components/interactive/rarity-ladder';
import { EconomyExplorer } from '@/components/interactive/economy-explorer';
import { CurrencyComparison } from '@/components/interactive/currency-comparison';
import { BattleFlow } from '@/components/interactive/battle-flow';
import { BattleClassSelector } from '@/components/interactive/battle-class-selector';
import { CatDiceDemo } from '@/components/interactive/cat-dice-demo';
import { PrizePoolDemo } from '@/components/interactive/prize-pool-demo';
import { AccessFlow } from '@/components/interactive/access-flow';

const FarmHero = dynamic(() => import('@/components/three/farm-hero').then((mod) => mod.FarmHero), {
  ssr: false,
  loading: () => (
    <div className="hero-3d">
      <div className="hero-3d__fallback">
        <div className="hero-3d__fallback-card">
          <strong>Loading farm diorama…</strong>
          <p style={{ margin: '0.35rem 0 0' }}>
            Text content remains available while the scene loads.
          </p>
        </div>
      </div>
    </div>
  ),
});

const SECTIONS = [
  { id: 'hero', label: 'Enter' },
  { id: 'first-day', label: 'First day' },
  { id: 'activities', label: 'Activities' },
  { id: 'animals', label: 'Animals' },
  { id: 'materials', label: 'Materials' },
  { id: 'economy', label: 'Economy' },
  { id: 'cat', label: 'Cat' },
  { id: 'dice-battle', label: 'Dice vs Battle' },
  { id: 'battle', label: 'Cat Battle' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'fair-play', label: 'Fair play' },
  { id: 'next', label: 'Next steps' },
] as const;

export function HowToPlayExperience() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="htp-shell">
      <div className="progress-rail" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="htp-nav-wrap">
        <nav aria-label="How to Play sections">
          <div className="chip-row">
            {SECTIONS.map((section) => (
              <a key={section.id} className="chip" href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <section className="htp-hero home-hero" id="hero">
        <div className="htp-hero__copy">
          <p className="docs-eyebrow">How to Play</p>
          <h1>Welcome to {GAME_NAME}</h1>
          <p>
            A cozy multiplayer animal farming world with a transparent economy, a permanent cat
            companion, and optional strategic Cat Battle. {GAME_PHILOSOPHY}
          </p>
          <p>
            This page is a scroll-driven introduction. Critical rules stay visible as text — nothing
            essential is hover-only. For reference tables and search, open the full docs.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/docs/getting-started">
              Open getting started
            </Link>
            <Link className="btn btn-secondary" href="/docs">
              Browse all docs
            </Link>
          </div>
        </div>
        <FarmHero />
      </section>

      <div className="htp-body">
        <section className="htp-section" id="first-day">
          <h2>Your first day</h2>
          <p>
            Connect a compatible Solana wallet, hold at least 10,000 $FABLE, then meet the farm
            systems at your own pace.
          </p>
          <AccessFlow />
          <ol className="docs-steps">
            {ACCESS.accessSteps.map((step) => (
              <li key={step.id}>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
          <div className="htp-grid">
            {PLAYER_JOURNEY.slice(0, 6).map((step) => (
              <div className="panel" key={step.id}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="htp-section" id="activities">
          <h2>Core activity explorer</h2>
          <p>
            Farming, gathering, crafting, housing, trading, and cat play can fill a day. Cat Battle
            and tournaments are optional — never required for cozy play.
          </p>
          <ActivityExplorer />
        </section>

        <section className="htp-section" id="animals">
          <h2>Animal progression</h2>
          <p>
            Five animals — Cow, Pig, Horse, Chicken, Goat — grow from level 1 to 50. Visual
            milestones arrive every 10 levels without resetting the animal.
          </p>
          <AnimalProgression />
        </section>

        <section className="htp-section" id="materials">
          <h2>Material rarity</h2>
          <p>
            Materials climb seven rarities. At level 50 the normal result is Mythic, with a 1%
            Divine chance — never a guarantee.
          </p>
          <RarityLadder />
        </section>

        <section className="htp-section" id="economy">
          <h2>Economy flow</h2>
          <p>
            COPPER is off-chain and intentionally scarce. NPC selling is capped. The Copper Exchange
            is the main meaningful COPPER pathway. The Auction House tax is exactly 10%.
          </p>
          <CurrencyComparison />
          <EconomyExplorer />
        </section>

        <section className="htp-section" id="cat">
          <h2>Your permanent cat</h2>
          <p>
            One long-term companion. Personality shapes identity; Battle Class shapes combat when
            you unlock Cat Battle. No breeding gacha or disposable cats.
          </p>
          <div className="htp-grid">
            <div className="panel">
              <h3>Identity</h3>
              <p>Personality plus lifelong companionship across casual and competitive modes.</p>
            </div>
            <div className="panel">
              <h3>Optional competition</h3>
              <p>Cat Dice for luck-based leisure. Cat Battle for strategic Best-of-1 fights.</p>
            </div>
          </div>
        </section>

        <section className="htp-section" id="dice-battle">
          <h2>Cat Dice versus Cat Battle</h2>
          <div className="htp-grid">
            <div className="panel">
              <h3>Cat Dice</h3>
              <p>
                {CAT_DICE.nature}. {CAT_DICE.keyRule}
              </p>
              <CatDiceDemo />
            </div>
            <div className="panel">
              <h3>Cat Battle</h3>
              <p>
                {CAT_BATTLE.style}. {CAT_BATTLE.format}. {CAT_BATTLE.philosophy}
              </p>
              <ul className="docs-list">
                <li>Turn-based, one action per turn</li>
                <li>{CAT_BATTLE.turnTimerSeconds}-second timer</li>
                <li>Outcomes validated by the game</li>
                <li>Battle Power is build-based, not win-based MMR</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="htp-section" id="battle">
          <h2>Cat Battle explainer</h2>
          <p>
            Easy to learn, hard to master, mobile-friendly strategy without esports mechanical
            noise.
          </p>
          <BattleFlow />
          <BattleClassSelector />
        </section>

        <section className="htp-section" id="tournaments">
          <h2>Tournament journey</h2>
          <p>
            Community tournaments are player-funded with 100% of COPPER fees in the prize pool.
            Official sponsored events may add rewards such as $FABLE when configured. All schedules
            use UTC.
          </p>
          <p>
            <strong>{TIMEZONE_RULE.statement}</strong>
          </p>
          <PrizePoolDemo />
          <div className="cta-row">
            <Link className="btn btn-secondary" href="/docs/tournaments">
              Tournament docs
            </Link>
            <Link className="btn btn-ghost" href="/docs/tournaments/registration">
              Registration confirmation flow
            </Link>
          </div>
        </section>

        <section className="htp-section" id="fair-play">
          <h2>Fair play and security</h2>
          <p>{FAIR_PLAY.multiAccountPrinciple}</p>
          <div className="htp-grid">
            <div className="panel">
              <h3>Not allowed</h3>
              <ul className="docs-list">
                {FAIR_PLAY.prohibited.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h3>Stay safe</h3>
              <ul className="docs-list">
                <li>Never share seed phrases</li>
                <li>Verify the official domain</li>
                <li>COPPER actions are not automatic chain transfers</li>
                <li>Tournament charges require explicit confirmation</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="htp-section" id="next">
          <h2>Continue into the full field guide</h2>
          <p>
            You now have the journey map. Use documentation search when you need one exact rule —
            Auction House tax, Energy caps, matchmaking ranges, Divine chance, or tournament
            refunds.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/docs">
              Open documentation
            </Link>
            <Link className="btn btn-secondary" href="/docs/faq">
              Read the FAQ
            </Link>
            <Link className="btn btn-ghost" href="/docs/glossary">
              Browse glossary
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
