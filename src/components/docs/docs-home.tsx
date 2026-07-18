import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { DOCUMENTATION_PAGES, DOCUMENTATION_SECTIONS } from '@/content/docs/pages';
import type { DocumentationSection } from '@/content/docs/types';
import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { DocsSearch } from './docs-search';
import {
  AnimalPortrait,
  IlloBattle,
  IlloBook,
  IlloCat,
  IlloCoins,
  IlloCottage,
  IlloGuideScene,
  IlloSprout,
  IlloTrophy,
} from '@/components/site/game-illustrations';

/** Editorial identity for each documentation category. */
const CATEGORY_META: Record<
  DocumentationSection,
  { readonly accent: string; readonly blurb: string; readonly icon: ReactNode }
> = {
  'Getting Started': {
    accent: '#2f5d46',
    blurb: 'Entry requirements, your first day, and how the world fits together.',
    icon: <IlloSprout />,
  },
  'Cozy World': {
    accent: '#4f8a62',
    blurb: 'Animals, materials, farm visits, and every peaceful activity in a farm day.',
    icon: <IlloCottage />,
  },
  Economy: {
    accent: '#b06b2c',
    blurb: 'COPPER, $FABLE, the Copper Exchange, the Auction House, and trading.',
    icon: <IlloCoins />,
  },
  'Your Cat': {
    accent: '#d9873c',
    blurb: 'Your one permanent companion: personality, Cat Dice, and lifelong play.',
    icon: <IlloCat />,
  },
  'Cat Battle': {
    accent: '#40758c',
    blurb: 'Classes, stats, Energy, skills, equipment, Battle Power, and matchmaking.',
    icon: <IlloBattle />,
  },
  Tournaments: {
    accent: '#c9a227',
    blurb: 'Community and Official events, fees, prize pools, refunds, and UTC times.',
    icon: <IlloTrophy />,
  },
  'Rules and Support': {
    accent: '#6b4f35',
    blurb: 'Fair play, account safety, the FAQ, and the full glossary.',
    icon: <IlloBook />,
  },
};

const FEATURED = [
  {
    href: '/docs/getting-started',
    section: 'Getting Started',
    title: 'Getting Started',
    text: 'How to enter the world and take your first cozy steps.',
    accent: '#2f5d46',
    art: <IlloSprout />,
  },
  {
    href: '/docs/animals',
    section: 'Cozy World',
    title: 'Animals and Materials',
    text: 'Five animals, fifty levels, and seven material rarities.',
    accent: '#4f8a62',
    art: <AnimalPortrait animal="cow" />,
  },
  {
    href: '/docs/economy',
    section: 'Economy',
    title: 'Economy',
    text: 'How COPPER circulates and how $FABLE opens the gate.',
    accent: '#b06b2c',
    art: <IlloCoins />,
  },
  {
    href: '/docs/cat',
    section: 'Your Cat',
    title: 'Your Permanent Cat',
    text: 'One companion for your whole journey, never disposable.',
    accent: '#d9873c',
    art: <IlloCat />,
  },
  {
    href: '/docs/cat-battle',
    section: 'Cat Battle',
    title: 'Cat Battle',
    text: 'Optional strategic Best-of-1 duels, easy to learn.',
    accent: '#40758c',
    art: <IlloBattle />,
  },
  {
    href: '/docs/tournaments',
    section: 'Tournaments',
    title: 'Tournaments',
    text: 'Player-funded prize pools and sponsored official events.',
    accent: '#c9a227',
    art: <IlloTrophy />,
  },
] as const;

const QUICK_ANSWERS = [
  { href: '/docs/farm-visits', label: 'Can other players visit my farm?' },
  { href: '/docs/access', label: 'Why 10,000 $FABLE?' },
  { href: '/docs/copper', label: 'Is COPPER on-chain?' },
  { href: '/docs/animal-progression', label: 'What happens at animal level 50?' },
  { href: '/docs/cat-dice', label: 'Does cat level affect Cat Dice?' },
  { href: '/docs/cat-battle/battle-power', label: 'What is Battle Power?' },
  { href: '/docs/auction-house', label: 'What is the Auction House tax?' },
  { href: '/docs/utc', label: 'Are tournament times UTC?' },
  { href: '/docs/copper-exchange', label: 'What is the Copper Exchange?' },
  { href: '/docs/tournaments/refunds', label: 'When are tournament fees refunded?' },
] as const;

/** Editorially selected rules — a static list, not popularity analytics. */
const IMPORTANT_TOPICS = [
  { href: '/docs/auction-house', label: 'The 10% Auction House tax' },
  { href: '/docs/animal-progression', label: 'Level 50: Mythic plus a 1% Divine chance' },
  { href: '/docs/cat-battle/energy', label: 'How Energy limits each battle' },
  { href: '/docs/cat-battle/matchmaking', label: 'Matchmaking ranges' },
  { href: '/docs/npc-selling', label: 'NPC selling caps' },
  { href: '/docs/fair-play', label: 'One-account fair play' },
] as const;

export function DocsHome() {
  const totalGuides = DOCUMENTATION_PAGES.length;

  return (
    <div className="dhome">
      <header className="dhome-hero">
        <div className="dhome-hero__art" aria-hidden="true">
          <IlloGuideScene />
        </div>
        <p className="docs-eyebrow">{GAME_NAME} field guide</p>
        <h1>{GAME_NAME} Player Guide</h1>
        <p>
          Every confirmed rule of the cozy farming world in one place: animals, materials, the
          COPPER economy, your permanent cat, Cat Battle, and tournaments. {GAME_PHILOSOPHY}
        </p>
        <div className="dhome-hero__actions">
          <DocsSearch variant="hero" />
          <Link className="btn btn-primary" href="/how-to-play">
            Start with How to Play
          </Link>
        </div>
        <p className="docs-meta" style={{ margin: 0 }}>
          <span>{totalGuides} guides, updated as the game grows</span>
        </p>
      </header>

      <section aria-labelledby="dhome-featured-heading">
        <div className="dhome-section-head" style={{ marginBottom: 'var(--stack-gap)' }}>
          <h2 id="dhome-featured-heading">Featured guides</h2>
          <p>The six chapters most players read first.</p>
        </div>
        <div className="dhome-featured">
          {FEATURED.map((entry) => (
            <Link
              className="dhome-card"
              href={entry.href}
              key={entry.href}
              style={{ '--cat-accent': entry.accent } as CSSProperties}
            >
              <span className="dhome-card__art" aria-hidden="true">
                {entry.art}
              </span>
              <span className="dhome-card__body">
                <small>{entry.section}</small>
                <strong>{entry.title}</strong>
                <p>{entry.text}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="dhome-quick-heading">
        <div className="dhome-section-head" style={{ marginBottom: 'var(--stack-gap)' }}>
          <h2 id="dhome-quick-heading">Quick answers</h2>
          <p>Jump straight to one exact rule.</p>
        </div>
        <div className="dhome-quick">
          {QUICK_ANSWERS.map((entry) => (
            <Link href={entry.href} key={entry.label}>
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="dhome-categories-heading">
        <div className="dhome-section-head" style={{ marginBottom: 'var(--stack-gap)' }}>
          <h2 id="dhome-categories-heading">Browse by category</h2>
          <p>Every guide, organized the way the game unfolds.</p>
        </div>
        <div className="dhome-cats">
          {DOCUMENTATION_SECTIONS.map((sectionName) => {
            const meta = CATEGORY_META[sectionName];
            const pages = DOCUMENTATION_PAGES.filter((page) => page.section === sectionName);
            return (
              <section
                className="dhome-cat"
                key={sectionName}
                aria-label={sectionName}
                style={{ '--cat-accent': meta.accent } as CSSProperties}
              >
                <div className="dhome-cat__head">
                  <span className="dhome-cat__icon" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div>
                    <h3>{sectionName}</h3>
                    <p>{meta.blurb}</p>
                  </div>
                  <span className="dhome-cat__count">
                    {pages.length} guide{pages.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="dhome-cat__links">
                  {pages.map((page) => (
                    <Link href={page.route} key={page.route}>
                      {page.title}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="dhome-topics-heading">
        <div className="dhome-section-head" style={{ marginBottom: 'var(--stack-gap)' }}>
          <h2 id="dhome-topics-heading">Important topics</h2>
          <p>Hand-picked rules worth knowing before opening day.</p>
        </div>
        <div className="dhome-quick">
          {IMPORTANT_TOPICS.map((entry) => (
            <Link href={entry.href} key={entry.label}>
              {entry.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Glossary and FAQ" className="dhome-duo">
        <Link className="dhome-entry" href="/docs/glossary">
          <strong>Glossary</strong>
          <p>Every game term defined in one alphabetical reference.</p>
        </Link>
        <Link className="dhome-entry" href="/docs/faq">
          <strong>FAQ</strong>
          <p>Short, direct answers to the questions players ask most often.</p>
        </Link>
      </section>
    </div>
  );
}
