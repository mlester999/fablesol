/**
 * Tournament types, statuses, registration, and refund principles.
 * Fees are derived from economy LEVEL_TIERS — import from there.
 */

import { LEVEL_TIERS } from './economy';

export const TOURNAMENT_TYPES = {
  community: {
    id: 'community',
    name: 'Community Tournament',
    playerFunded: true,
    minimumPlayers: 2,
    entranceCurrency: 'COPPER',
    tax: 0,
    burn: 0,
    developerCut: 0,
    prizePoolRule: '100% of all entrance fees form the COPPER prize pool.',
    refundIfBelowMinimum: true,
    sponsoredRewardsDefault: false,
    designReason:
      'A player who reaches their NPC daily cap can afford two community tournament entries if they spend nothing else, because the fee is half the daily cap.',
  },
  official: {
    id: 'official',
    name: 'Official Sponsored Tournament',
    playerFunded: true,
    lowerCopperFeeWhereConfigured: true,
    copperToRewards: '100% of collected COPPER also goes into tournament rewards.',
    tax: 0,
    mayAddSponsoredRewards: true,
    sponsoredRewardExamples: [
      '$FABLE',
      'COPPER',
      'Cosmetics',
      'Titles',
      'Other explicitly configured rewards',
    ],
    noGuaranteedFableEveryEvent: true,
  },
} as const;

export const TOURNAMENT_STATUSES = [
  { id: 'upcoming', label: 'Upcoming', description: 'Announced but registration is not open yet.' },
  {
    id: 'registration_open',
    label: 'Registration Open',
    description: 'Players may register while seats remain.',
  },
  { id: 'full', label: 'Full', description: 'No remaining registration slots.' },
  {
    id: 'starting_soon',
    label: 'Starting Soon',
    description: 'Registration closed or closing; event is imminent.',
  },
  { id: 'live', label: 'Live', description: 'Tournament is currently running.' },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Event finished and rewards settled according to rules.',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    description: 'Event will not run; refund policy applies.',
  },
] as const;

export const REGISTRATION_CONFIRMATION_FIELDS = [
  'Tournament name',
  'Cat Dice tier or relevant tournament tier',
  'Start date and time in UTC',
  'Expected duration',
  'Registration deadline in UTC',
  'COPPER entrance fee',
  'Player’s current regular COPPER balance',
  'Remaining regular COPPER balance after payment',
  '$FABLE prize when applicable',
  'Other sponsored rewards when applicable',
  'Refund conditions',
  'Confirmation action',
  'Cancel action',
] as const;

export const REFUND_CONDITIONS = {
  community: [
    'Fewer than two players registered',
    'Tournament cancellation',
    'Qualifying system failure according to implementation',
  ],
  official: [
    'Tournament cancellation',
    'Minimum participants not reached',
    'Qualifying system failure',
  ],
  notAutomatic: [
    'Losing a match',
    'Missing a match after valid registration',
    'Changing your mind after the registration deadline',
    'Failing eligibility after knowingly confirming (unless policy explicitly allows)',
  ],
} as const;

export const TRANSACTION_STATES = [
  'Pending confirmation',
  'Registered',
  'Charged',
  'Refunded',
  'Tournament completed',
  'Registration failed',
] as const;

export const CAT_DICE_VS_BATTLE_TOURNAMENTS = {
  catDice: {
    nature: 'Luck-based',
    separateTiers: true,
    separateBalance: true,
    separateRewards: true,
    levelAffectsOdds: false,
  },
  catBattle: {
    nature: 'Strategic',
    usesBattleRules: true,
    usesBattlePowerAndTier: true,
    separateBalance: true,
    separateRewards: true,
  },
} as const;

export function getCommunityFeesTable() {
  return LEVEL_TIERS.map((tier) => ({
    levels: `${tier.minLevel}–${tier.maxLevel}`,
    dailyNpcCap: tier.dailyNpcCap,
    communityFee: tier.communityTournamentFee,
    wager: tier.wagerAmount,
  }));
}

export const TIMEZONE_RULE = {
  canonical: 'UTC',
  statement: 'All official game schedules and timestamps are displayed in UTC.',
  appliesTo: [
    'Tournament start times',
    'Tournament registration deadlines',
    'Check-in windows',
    'Event schedules',
    'Leaderboard cutoffs',
    'Reward settlements',
    'Copper Exchange order expiry',
    'Logs and audit records',
    'Treasury actions',
    'Maintenance windows',
    'Announcements',
    'Claims',
    'Official records and timestamps',
  ],
  noAutoLocalConversion:
    'Official interfaces and documentation preserve UTC as the authoritative schedule. Players may convert privately, but local time is never treated as official.',
} as const;
