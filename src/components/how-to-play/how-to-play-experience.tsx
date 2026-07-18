'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ACCESS } from '@/content/game/access';
import { ANIMALS } from '@/content/game/animals';
import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { CAT_BATTLE, CAT_COMPANION, CAT_DICE } from '@/content/game/cat-battle';
import { FAIR_PLAY } from '@/content/game/fair-play';
import { TIMEZONE_RULE } from '@/content/game/tournaments';
import { AnimalProgression } from '@/components/interactive/animal-progression';
import { ActivityExplorer } from '@/components/interactive/activity-explorer';
import { RarityLadder } from '@/components/interactive/rarity-ladder';
import { EconomyExplorer } from '@/components/interactive/economy-explorer';
import { CurrencyComparison } from '@/components/interactive/currency-comparison';
import { BattleFlow } from '@/components/interactive/battle-flow';
import { BattleClassSelector } from '@/components/interactive/battle-class-selector';
import { BattlePowerBreakdown } from '@/components/interactive/battle-power-breakdown';
import { EquipmentLoadout } from '@/components/interactive/equipment-loadout';
import { CatDiceDemo } from '@/components/interactive/cat-dice-demo';
import { PrizePoolDemo } from '@/components/interactive/prize-pool-demo';
import { TournamentRegistrationDemo } from '@/components/interactive/tournament-registration-demo';
import { AccessFlow } from '@/components/interactive/access-flow';
import { FarmVisitExplorer } from '@/components/interactive/farm-visit-explorer';
import { AnimalPortrait, IlloCat, IlloShield } from '@/components/site/game-illustrations';
import { AvailabilityBadge } from '@/components/site/availability-badge';
import {
  COMMUNITY_CARE,
  FARM_VISIT_CAPACITY,
  VISITOR_RESTRICTIONS,
} from '@/content/game/farm-visits';

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

const CHAPTERS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'first-day', label: 'First day' },
  { id: 'your-day', label: 'Your day' },
  { id: 'animals', label: 'Animals' },
  { id: 'growth', label: 'Growth' },
  { id: 'materials', label: 'Materials' },
  { id: 'farm-visits', label: 'Farm visits' },
  { id: 'economy', label: 'Economy' },
  { id: 'currencies', label: 'Currencies' },
  { id: 'cat', label: 'Your cat' },
  { id: 'dice-vs-battle', label: 'Dice vs Battle' },
  { id: 'battle', label: 'Cat Battle' },
  { id: 'power', label: 'Power' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'fair-play', label: 'Fair play' },
  { id: 'continue', label: 'Full docs' },
] as const;

type ChapterId = (typeof CHAPTERS)[number]['id'];

interface ChapterProps {
  readonly id: ChapterId;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly tone?: 'parchment' | 'meadow' | 'forest';
  /** Compact status badge shown once beside the chapter title. */
  readonly badge?: ReactNode;
  readonly children?: ReactNode;
}

function Chapter({ id, eyebrow, title, lead, tone, badge, children }: ChapterProps) {
  const number = CHAPTERS.findIndex((chapter) => chapter.id === id) + 1;
  return (
    <section className="htp-chapter" id={id} data-tone={tone} aria-labelledby={`${id}-title`}>
      <div className="chapter-inner reveal">
        <header className="chapter-head">
          <div className="chapter-kicker">
            <span className="chapter-num" aria-hidden="true">
              {String(number).padStart(2, '0')}
            </span>
            <p className="chapter-eyebrow">
              <span className="sr-only">Chapter {number}: </span>
              {eyebrow}
            </p>
          </div>
          <div className="chapter-title-row">
            <h2 id={`${id}-title`}>{title}</h2>
            {badge}
          </div>
          <p className="chapter-lead">{lead}</p>
        </header>
        {children}
      </div>
    </section>
  );
}

function RuleCallout({
  tone,
  symbol,
  title,
  children,
}: {
  readonly tone: 'rule' | 'safety' | 'important';
  readonly symbol: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <aside className="docs-callout" data-tone={tone} style={{ margin: 0 }}>
      <div className="docs-callout__head">
        <span className="docs-callout__icon" aria-hidden="true">
          {symbol}
        </span>
        <strong>{title}</strong>
      </div>
      <p>{children}</p>
    </aside>
  );
}

export function HowToPlayExperience() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<ChapterId>('welcome');
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track the chapter currently in view for the journey navigation.
  useEffect(() => {
    const sections = CHAPTERS.map((chapter) => document.getElementById(chapter.id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id as ChapterId | undefined;
        if (top) setActive(top);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.2, 0.6] },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Keep the active chapter chip visible inside the scrollable journey nav.
  // Scrolls only the nav strip itself, never the page.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const nav = shell.querySelector<HTMLElement>('.htp-chapnav__inner');
    const chip = nav?.querySelector<HTMLElement>('a[aria-current="true"]');
    if (!nav || !chip || typeof nav.scrollTo !== 'function') return;
    const navRect = nav.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const left =
      nav.scrollLeft + (chipRect.left - navRect.left) - (navRect.width - chipRect.width) / 2;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left: Math.max(0, left), behavior: reduced ? 'auto' : 'smooth' });
  }, [active]);

  // Gentle chapter reveals — enabled only once JS is live; reduced motion
  // and no-JS both render everything immediately via CSS guards.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    // Flip the flag on the DOM directly: hidden reveal states must only
    // ever exist when JS is running, so no-JS visitors see everything.
    shell.dataset.animate = 'true';
    const targets = shell.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="htp-shell" ref={shellRef} data-animate="false">
      <div className="progress-rail" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <nav className="htp-chapnav" aria-label="Journey chapters">
        <div className="htp-chapnav__inner">
          {CHAPTERS.map((chapter, index) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={active === chapter.id ? 'true' : undefined}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>

      {/* 01 — Welcome */}
      <section className="htp-chapter" id="welcome" aria-labelledby="welcome-title">
        <div className="chapter-inner">
          <div className="htp-hero">
            <div className="htp-hero__copy">
              <p className="docs-eyebrow">How to Play · Chapter 01</p>
              <h1 id="welcome-title">Welcome to {GAME_NAME}</h1>
              <p>
                A cozy multiplayer animal farming world with a transparent economy, a permanent cat
                companion, and optional strategic Cat Battle. {GAME_PHILOSOPHY}
              </p>
              <p>
                This page is a guided journey through every system, in the order you will meet them.
                Critical rules stay visible as plain text; nothing essential hides behind a hover.
                When you want reference tables and search, open the full docs.
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
          </div>
        </div>
      </section>

      {/* 02 — First day */}
      <Chapter
        id="first-day"
        tone="parchment"
        eyebrow="Getting in"
        title="Your first day"
        lead={`Connect a compatible ${ACCESS.chain} wallet, hold at least ${ACCESS.minimumHoldings.toLocaleString('en-US')} ${ACCESS.tokenSymbol}, and step into the world at your own pace.`}
      >
        <AccessFlow />
        <RuleCallout tone="safety" symbol="⚠" title="Keep your keys yours">
          {GAME_NAME} will never ask for your seed phrase. Access only requires holding
          {' ' + ACCESS.tokenSymbol} in a wallet you control.
        </RuleCallout>
      </Chapter>

      {/* 03 — Choose your day */}
      <Chapter
        id="your-day"
        eyebrow="Daily life"
        title="Choose how to spend your day"
        lead="Care for animals, gather, craft, trade, decorate, or simply relax. Competitive cat modes are optional, never required for cozy play."
      >
        <ActivityExplorer />
      </Chapter>

      {/* 04 — Meet the animals */}
      <Chapter
        id="animals"
        tone="meadow"
        eyebrow="The farm"
        title="Meet the five animals"
        lead="Cow, Pig, Horse, Chicken, and Goat each produce a signature material. Their care is the heart of the farm."
      >
        <div className="animal-gallery">
          {ANIMALS.map((animal) => (
            <div className="animal-tile" key={animal.id}>
              <AnimalPortrait animal={animal.id} />
              <strong>{animal.name}</strong>
              <em>{animal.material}</em>
              <span>{animal.personality}</span>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 05 — Growth */}
      <Chapter
        id="growth"
        eyebrow="Progression"
        title="Animal growth and transformations"
        lead="Animals grow from level 1 to 50. A visual transformation milestone arrives every 10 levels, and the animal is never reset or replaced."
      >
        <AnimalProgression />
      </Chapter>

      {/* 06 — Materials */}
      <Chapter
        id="materials"
        tone="parchment"
        eyebrow="Progression"
        title="Material rarities"
        lead="Materials climb seven rarities as animals level. Slide through the ladder to see each band."
      >
        <RarityLadder />
        <RuleCallout tone="rule" symbol="§" title="Level 50 rule">
          At level 50 the normal result remains Mythic, with a 1% chance of Divine material. Divine
          is never a guarantee.
        </RuleCallout>
      </Chapter>

      {/* 07 — Farm visits */}
      <Chapter
        id="farm-visits"
        tone="meadow"
        eyebrow="Together"
        title="Visit friends’ farms"
        badge={<AvailabilityBadge feature="farm-visits" />}
        lead="Your farm is also a stage. Friends will drop by live: admiring showcase animals, leaving guestbook notes, and helping a little when you allow it. This approved feature is planned and is not available in the current game build."
      >
        <div className="htp-grid">
          <div className="panel">
            <h3>How a visit goes</h3>
            <ol className="docs-steps">
              <li>
                <strong>Find a farm</strong>
                <span>Open a player profile or receive an invitation, then select Visit Farm.</span>
              </li>
              <li>
                <strong>Step in live</strong>
                <span>
                  See the owner and other visitors move, emote, and sit in real time, and they see
                  you.
                </span>
              </li>
              <li>
                <strong>Explore and admire</strong>
                <span>
                  Walk the public areas, inspect showcase animals, and enjoy trophies, decorations,
                  and photo spots.
                </span>
              </li>
              <li>
                <strong>Socialize</strong>
                <span>
                  Pet animals, leave a guestbook note, and give one Farm Appreciation per farm per
                  UTC day.
                </span>
              </li>
              <li>
                <strong>Help, if allowed</strong>
                <span>
                  When the owner enables Allow Helpers, water one crop or brush one animal as
                  validated Community Care.
                </span>
              </li>
              <li>
                <strong>Leave nothing but goodwill</strong>
                <span>
                  Private areas stay closed, and you can never claim the owner’s production.
                </span>
              </li>
            </ol>
          </div>
          <div className="panel" style={{ alignContent: 'start' }}>
            <h3>One farm, at a glance</h3>
            <div className="fv-stats">
              <div className="fv-stat">
                <strong>{FARM_VISIT_CAPACITY.maxVisitors}</strong>
                <span>visitors at once</span>
              </div>
              <div className="fv-stat">
                <strong>1</strong>
                <span>owner (never counted)</span>
              </div>
              <div className="fv-stat">
                <strong>{FARM_VISIT_CAPACITY.maxTotalPlayers}</strong>
                <span>players maximum</span>
              </div>
              <div className="fv-stat">
                <strong>{COMMUNITY_CARE.maxContributionsPerFarmPerDay}</strong>
                <span>daily care (UTC)</span>
              </div>
            </div>
            <p>
              Sightseeing is unlimited: revisit any farm as often as you like. When a farm is full,
              new visitors simply wait for a spot.
            </p>
            <div style={{ display: 'grid', justifyItems: 'center', gap: '0.35rem' }}>
              <AnimalPortrait animal="cow" className="animal-tile-art" />
              <p style={{ margin: 0, textAlign: 'center' }}>
                <strong>Buttercup</strong> · Cow · Level 34 · Epic Milk · Gentle temperament: an
                example of the public showcase info visitors can admire.
              </p>
            </div>
          </div>
        </div>
        <FarmVisitExplorer />
        <RuleCallout tone="important" symbol="!" title="The visitor rule">
          {VISITOR_RESTRICTIONS.coreRule}
        </RuleCallout>
        <div className="cta-row">
          <Link className="btn btn-secondary" href="/docs/farm-visits">
            Full farm-visit rules
          </Link>
        </div>
      </Chapter>

      {/* 08 — Economy */}
      <Chapter
        id="economy"
        eyebrow="The market"
        title="How the economy flows"
        lead="Materials become items, items become COPPER, and COPPER keeps circulating between players. Pick a lens to follow one path at a time."
      >
        <EconomyExplorer />
      </Chapter>

      {/* 09 — Currencies */}
      <Chapter
        id="currencies"
        tone="meadow"
        eyebrow="The market"
        title={`COPPER and ${ACCESS.tokenSymbol}`}
        lead="Two currencies with two very different jobs. COPPER lives inside the game; $FABLE lives on Solana and opens the gate."
      >
        <CurrencyComparison />
        <RuleCallout tone="important" symbol="!" title="No automatic conversion">
          {ACCESS.tokenSymbol} does not automatically convert into COPPER. The Auction House tax is
          exactly 10%, and NPC selling is capped by level tier.
        </RuleCallout>
      </Chapter>

      {/* 10 — Your cat */}
      <Chapter
        id="cat"
        tone="parchment"
        eyebrow="Companion"
        title="Meet your permanent cat"
        lead={`You have exactly ${CAT_COMPANION.permanentCount} permanent cat: a lifelong companion with a personality of its own, at your side in cozy play and in competition.`}
      >
        <div className="htp-grid">
          <div className="panel" style={{ justifyItems: 'center', textAlign: 'center' }}>
            <IlloCat className="animal-tile-art" />
            <h3>One cat, your whole journey</h3>
            <p>
              Personality shapes identity. Battle Class shapes combat once you unlock Cat Battle.
            </p>
          </div>
          <div className="panel">
            <h3>What cats are never</h3>
            <ul className="docs-list">
              {CAT_COMPANION.notIncluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Chapter>

      {/* 11 — Dice vs Battle */}
      <Chapter
        id="dice-vs-battle"
        eyebrow="Two cat games"
        title="Cat Dice versus Cat Battle"
        lead="Both are optional, both star your cat, and they could not be more different."
      >
        <div className="versus-grid">
          <div className="versus-panel" data-side="dice">
            <span className="versus-panel__tag">Casual · luck</span>
            <h3>Cat Dice</h3>
            <p>
              {CAT_DICE.nature}. A light way to spend time with your cat: no builds, no ladders, no
              pressure.
            </p>
            <CatDiceDemo />
          </div>
          <div className="versus-panel" data-side="battle">
            <span className="versus-panel__tag">Strategic · skill</span>
            <h3>Cat Battle</h3>
            <p>
              {CAT_BATTLE.style}. {CAT_BATTLE.format} duels with one action per turn and a{' '}
              {CAT_BATTLE.turnTimerSeconds}-second timer, validated by the game.
            </p>
            <ul className="docs-list">
              <li>Outcomes come from stats, skills, and decisions</li>
              <li>Battle Power grows from your build, not win-streak ratings</li>
              <li>{CAT_BATTLE.philosophy}</li>
            </ul>
          </div>
        </div>
        <RuleCallout tone="rule" symbol="§" title="The Cat Dice fairness rule">
          {CAT_DICE.keyRule} A level-50 cat and a brand-new cat roll with identical odds.
        </RuleCallout>
      </Chapter>

      {/* 12 — Learn Cat Battle */}
      <Chapter
        id="battle"
        tone="forest"
        eyebrow="Competition"
        title="Learn Cat Battle"
        lead="Easy to learn, hard to master: mobile-friendly strategy without esports mechanical noise."
      >
        <BattleFlow />
        <BattleClassSelector />
      </Chapter>

      {/* 13 — Equipment and Battle Power */}
      <Chapter
        id="power"
        tone="forest"
        eyebrow="Competition"
        title="Equipment and Battle Power"
        lead="Three equipment slots and a build-based power score. Battle Power reflects what you bring into the arena, not a hidden matchmaking rating."
      >
        <EquipmentLoadout />
        <BattlePowerBreakdown />
      </Chapter>

      {/* 14 — Tournaments */}
      <Chapter
        id="tournaments"
        tone="parchment"
        eyebrow="Events"
        title="Tournaments"
        lead="Community tournaments are player-funded: 100% of COPPER entry fees form the prize pool. Official sponsored events may add rewards when configured."
      >
        <PrizePoolDemo />
        <TournamentRegistrationDemo />
        <RuleCallout tone="rule" symbol="§" title="Official time is UTC">
          {TIMEZONE_RULE.statement} Convert privately if you like; local time is never treated as
          official.
        </RuleCallout>
        <div className="cta-row">
          <Link className="btn btn-secondary" href="/docs/tournaments">
            Tournament docs
          </Link>
          <Link className="btn btn-ghost" href="/docs/tournaments/refunds">
            Refund rules
          </Link>
        </div>
      </Chapter>

      {/* 15 — Fair play */}
      <Chapter
        id="fair-play"
        eyebrow="Trust"
        title="Fair play and security"
        lead={FAIR_PLAY.multiAccountPrinciple}
      >
        <div className="htp-grid">
          <div className="panel">
            <h3>Not allowed</h3>
            <ul className="docs-list">
              {FAIR_PLAY.prohibited.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel" style={{ alignContent: 'start' }}>
            <IlloShield className="panel-art" />
            <h3>Stay safe</h3>
            <ul className="docs-list">
              <li>Never share seed phrases</li>
              <li>Verify the official domain</li>
              <li>COPPER actions are not automatic chain transfers</li>
              <li>Tournament charges require explicit confirmation</li>
            </ul>
          </div>
        </div>
      </Chapter>

      {/* 16 — Continue */}
      <Chapter
        id="continue"
        tone="meadow"
        eyebrow="Keep going"
        title="Continue into the full docs"
        lead="You now have the journey map. Use documentation search whenever you need one exact rule: the Auction House tax, Energy caps, matchmaking ranges, the Divine chance, or tournament refunds."
      >
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
      </Chapter>
    </div>
  );
}
