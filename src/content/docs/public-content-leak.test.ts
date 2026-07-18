import { describe, expect, it } from 'vitest';
import { DOCUMENTATION_PAGES } from './pages';
import { docsIndexPage } from './index-page';
import { createDocumentationSearchIndex } from './search';
import {
  ACCESS,
  ACTIVITIES,
  AVAILABILITY_STATUSES,
  ECONOMY_NOTES,
  FAIR_PLAY,
  FAQ_ITEMS,
  FEATURE_AVAILABILITY,
  GAME_DESCRIPTION,
  GAME_NAME,
  GAME_TAGLINE,
  GLOSSARY,
  PLAYER_JOURNEY,
  PROJECT_STATUS,
  SECURITY,
  TIMEZONE_RULE,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
} from '@/content/game';

/**
 * Public player-facing content must never expose the internal technology
 * stack. This test serializes every content module that feeds public pages
 * and scans for banned internal terms.
 */
const BANNED_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'Supabase', pattern: /supabase/i },
  { label: 'PostgreSQL', pattern: /postgres/i },
  { label: 'Docker', pattern: /docker/i },
  { label: 'Next.js', pattern: /next\.?js/i },
  { label: 'React', pattern: /\breact\b/i },
  { label: 'Vite', pattern: /\bvite\b/i },
  { label: 'Phaser', pattern: /\bphaser\b/i },
  { label: 'Three.js', pattern: /three\.?js/i },
  { label: 'Tailwind', pattern: /tailwind/i },
  { label: 'Framer', pattern: /framer/i },
  { label: 'Vercel', pattern: /vercel/i },
  { label: 'wallet library (Reown/AppKit)', pattern: /reown|appkit/i },
  { label: 'TypeScript', pattern: /typescript/i },
  { label: 'WebGL', pattern: /webgl/i },
  { label: 'RLS', pattern: /\bRLS\b/ },
  { label: 'database', pattern: /database/i },
  { label: 'API route', pattern: /\bapi\b/i },
  { label: 'migration', pattern: /migration/i },
  { label: 'environment variable', pattern: /environment variable/i },
  { label: 'CI/CD', pattern: /\bci\/cd\b/i },
  { label: 'GitHub', pattern: /github/i },
  { label: 'backend/frontend', pattern: /\bbackend\b|\bfrontend\b/i },
  { label: 'server', pattern: /\bserver\b/i },
];

const PUBLIC_CONTENT: Record<string, unknown> = {
  documentationPages: DOCUMENTATION_PAGES,
  docsIndexPage,
  searchIndex: createDocumentationSearchIndex(),
  access: ACCESS,
  activities: ACTIVITIES,
  playerJourney: PLAYER_JOURNEY,
  economyNotes: ECONOMY_NOTES,
  fairPlay: FAIR_PLAY,
  security: SECURITY,
  faq: FAQ_ITEMS,
  glossary: GLOSSARY,
  timezoneRule: TIMEZONE_RULE,
  tournamentTypes: TOURNAMENT_TYPES,
  tournamentStatuses: TOURNAMENT_STATUSES,
  availabilityStatuses: AVAILABILITY_STATUSES,
  featureAvailability: FEATURE_AVAILABILITY,
  projectStatus: PROJECT_STATUS,
  brand: { GAME_NAME, GAME_TAGLINE, GAME_DESCRIPTION },
};

describe('public content technology leak check', () => {
  for (const [name, content] of Object.entries(PUBLIC_CONTENT)) {
    it(`${name} contains no internal technology terms`, () => {
      const serialized = JSON.stringify(content);
      for (const { label, pattern } of BANNED_PATTERNS) {
        const match = serialized.match(pattern);
        expect(
          match,
          `Found banned term (${label}) in ${name}: "…${serialized.slice(
            Math.max(0, (match?.index ?? 0) - 60),
            (match?.index ?? 0) + 60,
          )}…"`,
        ).toBeNull();
      }
    });
  }
});
