import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { definePage, links, list, section, callout } from './helpers';
import { DOCUMENTATION_PAGES, DOCUMENTATION_SECTIONS } from './pages';

const sectionLinks = DOCUMENTATION_SECTIONS.map((sectionName) => {
  const first = DOCUMENTATION_PAGES.find((page) => page.section === sectionName);
  return {
    label: sectionName,
    href: first?.route ?? '/docs',
    description: `${DOCUMENTATION_PAGES.filter((p) => p.section === sectionName).length} guides`,
  };
});

export const docsIndexPage = definePage({
  slug: 'index',
  route: '/docs',
  title: 'Documentation',
  eyebrow: `${GAME_NAME} field guide`,
  description: `Player documentation for ${GAME_NAME}: progression, animals, economy, cats, Cat Battle, tournaments, and fair play.`,
  section: 'Getting Started',
  audience: 'All players',
  keywords: ['docs', 'documentation', 'guides', 'fablesol'],
  related: ['getting-started', 'game-overview', 'faq', 'glossary'],
  content: [
    section(
      'intro',
      'Find the rule you need',
      [
        `${GAME_NAME} documentation is written for ordinary players. Start with Getting Started if you are new, or search for one exact rule if you already play.`,
        `Philosophy: “${GAME_PHILOSOPHY}”`,
      ],
      [
        callout(
          'tip',
          'Prefer interactive intro?',
          'Visit How to Play for a scroll-driven journey, then return here for reference tables and calculators.',
        ),
        links([
          {
            label: 'How to Play',
            href: '/how-to-play',
            description: 'Cinematic interactive introduction',
          },
          {
            label: 'Getting started',
            href: '/docs/getting-started',
            description: 'Access, first day, and orientation',
          },
          {
            label: 'FAQ',
            href: '/docs/faq',
            description: 'Short answers to common rules questions',
          },
        ]),
      ],
    ),
    section(
      'categories',
      'Browse by category',
      [
        'Every route below contains real player-facing rules. Closely related topics share patterns, but no page is an empty shell.',
      ],
      [
        links(sectionLinks),
        list(
          DOCUMENTATION_PAGES.map((page) => `${page.section} · ${page.title}: ${page.description}`),
        ),
      ],
    ),
    section(
      'accuracy',
      'Accuracy promises',
      [
        'Critical numbers such as the 10,000 $FABLE access requirement, 10% Auction House tax, level-50 1% Divine chance, Energy values, matchmaking ranges, and tournament fee relationships are centralized in typed source-of-truth modules.',
      ],
      [callout('rule', 'UTC', 'All official game schedules and timestamps are displayed in UTC.')],
    ),
  ],
});
