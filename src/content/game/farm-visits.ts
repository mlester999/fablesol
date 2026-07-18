/**
 * Personal farm visits, realtime social presence, and Community Care —
 * the approved shared source of truth for every farm-visit rule shown
 * on public surfaces.
 *
 * The whole feature is approved but NOT playable yet: every surface that
 * renders these values must show the honest Planned status via the
 * `farm-visits` entry in availability.ts.
 */

/** Capacity of one live personal-farm visit. */
export const FARM_VISIT_CAPACITY = {
  /** Maximum simultaneous visitors inside one farm. */
  maxVisitors: 10,
  /** The owner does not count against the visitor limit. */
  ownerCountsAsVisitor: false,
  /** Owner plus visitors — the most players one farm instance can show. */
  maxTotalPlayers: 11,
  /** Sightseeing is unlimited: players may visit and revisit freely. */
  dailySightseeingLimit: 'unlimited',
  fullMessage: 'This farm is currently full. Try again shortly.',
  entryNote:
    'Entry is not guaranteed to be immediate: when a farm is at capacity, new visitors wait until a spot opens.',
} as const;

/** Who may enter a farm — selected by the owner. */
export const FARM_VISIBILITY_OPTIONS = [
  {
    id: 'public',
    name: 'Public',
    description: 'Any eligible player may visit while capacity allows.',
  },
  {
    id: 'friends',
    name: 'Friends Only',
    description: 'Only accepted friends may enter.',
  },
  {
    id: 'invite',
    name: 'Invite Only',
    description: 'Only players with a valid invitation may enter.',
  },
  {
    id: 'private',
    name: 'Private',
    description: 'Only the owner may enter unless a future explicit exception is approved.',
  },
] as const;

/** What visitors may do — selected by the owner. Each mode includes the previous one. */
export const VISITOR_INTERACTION_MODES = [
  {
    id: 'view-only',
    name: 'View Only',
    summary: 'Admire the farm without touching anything.',
    permissions: [
      'Walk through public farm areas',
      'View animals and inspect public animal information',
      'View transformations, temperament, and cosmetics',
      'View showcase animals',
      'View trophies and achievements',
      'Use approved photo areas',
    ],
    note: 'Visitors may not interact with farm production.',
  },
  {
    id: 'social',
    name: 'Social Interactions',
    summary: 'Everything in View Only, plus friendly social play.',
    permissions: [
      'Pet animals',
      'Use emotes',
      'Sit on guest furniture',
      'Leave a guestbook message',
      'Give a Farm Appreciation reaction',
      'Interact with approved social props',
    ],
    note: 'Social play never touches the owner’s production or storage.',
  },
  {
    id: 'helpers',
    name: 'Allow Helpers',
    summary: 'Everything in Social Interactions, plus limited owner-approved help.',
    permissions: [
      'Water one approved crop',
      'Brush one animal',
      'Clean one approved barn area',
      'Refill one basic water trough',
      'Complete one small approved daily farm-help action',
    ],
    note: 'Helpers assist within daily limits; they never manage the farm.',
  },
] as const;

/** Community Care — the daily social-help system. All limits reset on the UTC day. */
export const COMMUNITY_CARE = {
  /** Maximum valid contributions one farm may receive per UTC day. */
  maxContributionsPerFarmPerDay: 5,
  /** One visitor may validly contribute to the same farm this many times per UTC day. */
  maxContributionsPerVisitorPerFarmPerDay: 1,
  /** Each valid contribution must come from a different player. */
  contributorsMustBeDifferentPlayers: true,
  /** One helper may validly care for at most this many different farms per UTC day. */
  maxFarmsHelpedPerVisitorPerDay: 5,
  /** Provisional balancing value: Animal Care progress per care point. */
  benefitPerContributionPercent: 1,
  /** Provisional balancing value: maximum daily Animal Care progress from care. */
  maxDailyBenefitPercent: 5,
  provisional: true,
  provisionalLabel:
    'The 1% per point and 5% daily maximum are provisional balancing values and subject to tuning.',
  resetRule: 'All Community Care limits reset according to the game’s canonical UTC schedule.',
  afterCapNote:
    'Players may continue sightseeing and socializing after a farm reaches 5/5 daily care.',
  repeatVisitNote: 'Repeated visits do not create additional valid care contributions.',
  coreRule:
    'Community Care provides a small social assistance benefit, but it does not create currency, valuable materials, or rare production.',
  /** Community Care must never do any of these. */
  never: [
    'Generate COPPER',
    'Generate Milk, Meat, Leather, Eggs, or Goat Wool',
    'Generate valuable materials',
    'Improve material rarity',
    'Improve the 1% Divine chance',
    'Automatically increase animal levels',
    'Create tradeable rewards',
    'Bypass normal animal-care requirements',
    'Stack beyond the daily maximum',
  ],
} as const;

/** Requirements before any helper action counts. */
export const HELPER_ACTION_REQUIREMENTS = [
  'The owner has enabled Allow Helpers',
  'The visitor has permission to enter the farm',
  'The visitor is within their own daily helper limits',
  'The farm is below its 5/5 daily care limit',
  'The action is valid for the selected object',
  'The action passes the game’s authoritative validation',
] as const;

/** What everyone inside the same live farm visit will eventually see. */
export const LIVE_PRESENCE = {
  events: [
    'Each other’s positions and facing direction',
    'Walk and idle animations',
    'Emotes and sitting',
    'Animal petting and brushing',
    'Crop watering, barn cleaning, and trough refilling',
    'Farm Appreciation reactions',
    'Visitors arriving and leaving',
    'Community Care meter changes',
  ],
  example:
    'MJ visits Mark’s farm and brushes a cow. Mark and the other visitors see MJ perform the brushing action, the cow reacts, and the Community Care meter updates.',
} as const;

/** Hard boundary: what visitors must never be able to do. */
export const VISITOR_RESTRICTIONS = {
  coreRule:
    'Visitors can admire, socialize, and optionally help, but only the owner can manage, collect from, or economically benefit from the farm.',
  never: [
    'Collect Milk, Meat, Leather, Eggs, or Goat Wool',
    'Harvest crops for themselves or claim production',
    'Claim daily rewards',
    'Access owner storage or private inventory',
    'View private balances, unclaimed production, or secret production timers',
    'Spend owner resources or feed rare items',
    'Rename, sell, or trade animals',
    'Move, rotate, or delete decorations',
    'Change farm permissions or helper settings',
    'Enter private management rooms or private barn storage',
    'Use owner crafting materials',
    'Damage animals or crops',
    'Modify animal levels, temperament, or rarity chances',
  ],
} as const;

/** Barn layout: proud public showcase in front, owner-only management behind. */
export const BARN_ACCESS = {
  publicShowcase: [
    'Showcase animals and their public information',
    'Trophies and achievements',
    'Decorative displays',
    'Guest seating',
    'Photo areas',
  ],
  privateOwnerArea: [
    'Storage and private inventory',
    'Production and animal management',
    'Farm settings',
    'Unclaimed resources',
    'Other owner-only controls',
  ],
  rule: 'Private owner areas stay closed to visitors in every visibility and interaction mode.',
} as const;

/** Showcase — how players proudly display progress. */
export const FARM_SHOWCASE = {
  /** Maximum Showcase Animals on the player profile. */
  maxProfileShowcaseAnimals: 3,
  /** Maximum animals featured near the farm entrance or showcase pen. */
  maxEntranceShowcaseAnimals: 3,
  publicInfo: [
    'Animal name and species',
    'Level and transformation stage',
    'Material type and current material rarity',
    'Temperament',
    'Cosmetic accessories',
    'Public achievements',
    'Owner name',
  ],
  privateInfo: [
    'Exact production timer',
    'Private care state',
    'Private economic value',
    'Unclaimed materials',
    'Owner balances',
    'Hidden stats',
  ],
  prestigeNote:
    'A level-50 animal should eventually look visibly more prestigious than an early-level animal.',
} as const;

/**
 * Farm animals use TEMPERAMENT (the permanent cat keeps Personality).
 * The example list is illustrative, not final.
 */
export const FARM_ANIMAL_TEMPERAMENT = {
  term: 'Temperament',
  catTermNote:
    'Farm animals have a Temperament. The permanent cat keeps its own Personality as part of its identity and Cat Battle.',
  exampleValues: ['Gentle', 'Playful', 'Proud', 'Curious', 'Sleepy', 'Energetic', 'Shy'],
  exampleNote: 'Example temperaments; the final list is not confirmed yet.',
  affects: [
    'Idle behavior',
    'Reactions',
    'Social animations',
    'Public description',
    'Animal identity',
  ],
  neverAffects: [
    'Material rarity',
    'The 1% Divine chance',
    'COPPER generation',
    'Major economic advantage',
  ],
} as const;

/** Social interaction limits inside farm visits. */
export const FARM_SOCIAL_LIMITS = {
  farmAppreciation: 'Once per visitor per farm per UTC day.',
  guestbook:
    'One message per visitor per farm every 24 hours. Future moderation and spam protections will apply.',
  petting:
    'Petting is social and may be repeated; future animation cooldowns may apply. Repeated petting does not generate additional Community Care.',
  emotes:
    'Emotes, sitting, and photo areas are generally unrestricted, with reasonable spam and abuse protections.',
} as const;

/** Offline-owner visits: intended direction only. */
export const OFFLINE_VISITS = {
  direction: [
    'A farm may remain visitable while its owner is offline when the selected visibility permits it.',
    'Visitors may admire public areas and use permitted social interactions.',
    'Owner-only actions remain unavailable.',
    'Helper actions may be limited or disabled according to future implementation and anti-abuse review.',
  ],
  unresolvedNote:
    'Exact offline-helper behavior is subject to future implementation and balancing.',
} as const;

/** Reconnection: player-friendly promise, no technical details. */
export const VISIT_RECONNECTION = {
  promises: [
    'A briefly disconnected visitor may be restored to the same farm visit when possible.',
    'Reconnecting never duplicates the player.',
    'Reconnecting never creates a second Community Care contribution.',
    'A visitor spot may be briefly reserved while a visitor reconnects.',
  ],
} as const;

/** Farm-visit abuse — extends the general fair-play rules. */
export const FARM_VISIT_ABUSE = [
  'Using multiple accounts to bypass helper limits',
  'Repeated fake Care Contributions',
  'Automated farm visiting',
  'Guestbook spam',
  'Harassment inside farms',
  'Attempting to access private areas',
  'Attempting to collect owner resources',
  'Manipulating visitor capacity',
  'Exploiting reconnection to duplicate contributions',
  'Circumventing farm privacy settings',
] as const;
