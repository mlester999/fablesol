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
import * as FARM_VISITS from '@/content/game/farm-visits';

/**
 * Editorial style rules for public player-facing copy. The owner does not
 * want em dashes anywhere in public content, and availability must read
 * like a game guide, not a project-status dashboard. Developer comments
 * are excluded automatically because only exported strings serialize.
 */
const BANNED_COPY: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'em dash (—)', pattern: /—/ },
  { label: '"Feature status:" dashboard wording', pattern: /feature status:/i },
  { label: '"Nothing here is playable yet" scolding', pattern: /nothing here is playable yet/i },
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
  farmVisits: FARM_VISITS,
  brand: { GAME_NAME, GAME_TAGLINE, GAME_DESCRIPTION },
};

describe('public copy style check', () => {
  for (const [name, content] of Object.entries(PUBLIC_CONTENT)) {
    it(`${name} follows the public copy style rules`, () => {
      const serialized = JSON.stringify(content);
      for (const { label, pattern } of BANNED_COPY) {
        const match = serialized.match(pattern);
        expect(
          match,
          `Found banned copy (${label}) in ${name}: "…${serialized.slice(
            Math.max(0, (match?.index ?? 0) - 60),
            (match?.index ?? 0) + 60,
          )}…"`,
        ).toBeNull();
      }
    });
  }
});
