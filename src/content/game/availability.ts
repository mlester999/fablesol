/**
 * Feature availability — the single source of truth for what is Live, Beta,
 * Planned, Balancing, or Temporarily unavailable across all public surfaces.
 *
 * Update a feature here once and every badge, docs page, and explorer follows.
 * Statuses must stay honest: a system is only Live when it actually works in
 * the shipped product.
 */

export const AVAILABILITY_STATUSES = [
  {
    id: 'live',
    label: 'Live',
    symbol: '●',
    description: 'Available to players now.',
  },
  {
    id: 'beta',
    label: 'Beta',
    symbol: '◐',
    description: 'Playable early version. Details may still change.',
  },
  {
    id: 'planned',
    label: 'Planned',
    symbol: '◇',
    description: 'Approved design that is not playable yet.',
  },
  {
    id: 'balancing',
    label: 'Balancing',
    symbol: '⚖',
    description: 'Working values are provisional and subject to tuning.',
  },
  {
    id: 'temporarily-unavailable',
    label: 'Temporarily unavailable',
    symbol: '⏸',
    description: 'Normally available but paused right now.',
  },
] as const;

export type AvailabilityStatusId = (typeof AVAILABILITY_STATUSES)[number]['id'];

export function getAvailabilityStatus(id: AvailabilityStatusId) {
  const status = AVAILABILITY_STATUSES.find((entry) => entry.id === id);
  if (status === undefined) throw new Error(`Unknown availability status: ${id}`);
  return status;
}

export interface FeatureAvailability {
  readonly id: string;
  readonly name: string;
  readonly status: AvailabilityStatusId;
  /** Short honest qualifier shown next to the badge where helpful. */
  readonly note?: string;
}

/**
 * Honest Phase 1 reality: the player guides are live; the game itself and all
 * gameplay systems are documented but not yet playable.
 */
export const FEATURE_AVAILABILITY = [
  { id: 'guides', name: 'Player guides and documentation', status: 'live' },
  { id: 'how-to-play', name: 'How to Play experience', status: 'live' },
  { id: 'docs-search', name: 'Documentation search', status: 'live' },
  {
    id: 'wallet-connect',
    name: 'Wallet connection',
    status: 'beta',
    note: 'Newly opened. Requires a compatible Solana wallet.',
  },
  {
    id: 'access-check',
    name: '$FABLE access requirement check',
    status: 'beta',
    note: 'Newly opened. Verification can be briefly unavailable while service setup completes.',
  },
  {
    id: 'game-world',
    name: 'Playable game world',
    status: 'planned',
    note: 'In active development.',
  },
  { id: 'farming', name: 'Farming', status: 'planned' },
  { id: 'animal-care', name: 'Animal care and ranching', status: 'planned' },
  { id: 'animal-progression', name: 'Animal levels and materials', status: 'planned' },
  { id: 'fishing', name: 'Fishing', status: 'planned' },
  { id: 'mining', name: 'Mining', status: 'planned' },
  { id: 'woodcutting', name: 'Woodcutting', status: 'planned' },
  { id: 'cooking', name: 'Cooking', status: 'planned' },
  { id: 'crafting', name: 'Crafting', status: 'planned' },
  { id: 'housing', name: 'Housing and decoration', status: 'planned' },
  { id: 'exploration', name: 'Exploration', status: 'planned' },
  { id: 'social', name: 'Social multiplayer', status: 'planned' },
  {
    id: 'farm-visits',
    name: 'Personal farm visits',
    status: 'planned',
    note: 'This approved feature is planned and is not available in the current game build.',
  },
  {
    id: 'community-care',
    name: 'Community Care',
    status: 'planned',
    note: 'Care benefit values are provisional and subject to balancing.',
  },
  { id: 'inventory', name: 'Inventory', status: 'planned' },
  { id: 'copper', name: 'COPPER economy', status: 'planned' },
  {
    id: 'copper-exchange',
    name: 'Copper Exchange',
    status: 'planned',
    note: 'Intended primary COPPER pathway; detailed rules publish when confirmed.',
  },
  {
    id: 'npc-selling',
    name: 'NPC selling',
    status: 'planned',
    note: 'Cap values are provisional and subject to balancing.',
  },
  { id: 'auction-house', name: 'Auction House', status: 'planned' },
  { id: 'player-trading', name: 'Player trading', status: 'planned' },
  { id: 'cat-companion', name: 'Permanent cat companion', status: 'planned' },
  { id: 'cat-dice', name: 'Cat Dice', status: 'planned' },
  { id: 'cat-battle', name: 'Cat Battle', status: 'planned' },
  { id: 'equipment', name: 'Cat Battle equipment', status: 'planned' },
  { id: 'matchmaking', name: 'Cat Battle matchmaking', status: 'planned' },
  {
    id: 'wagers',
    name: 'Optional Cat Battle wagers',
    status: 'planned',
    note: 'Wager values are provisional and subject to balancing.',
  },
  {
    id: 'tournaments-community',
    name: 'Community Tournaments',
    status: 'planned',
    note: 'Fee values are provisional and subject to balancing.',
  },
  { id: 'tournaments-official', name: 'Official Sponsored Tournaments', status: 'planned' },
] as const satisfies readonly FeatureAvailability[];

export type FeatureAvailabilityId = (typeof FEATURE_AVAILABILITY)[number]['id'];

export function getFeatureAvailability(id: FeatureAvailabilityId): FeatureAvailability {
  const feature = FEATURE_AVAILABILITY.find((entry) => entry.id === id);
  if (feature === undefined) throw new Error(`Unknown feature availability: ${id}`);
  return feature;
}

/** True project status shown on the landing page — keep honest. */
export const PROJECT_STATUS = {
  label: 'In development',
  detail: 'The guides below are live today. The playable world is in active development.',
} as const;
