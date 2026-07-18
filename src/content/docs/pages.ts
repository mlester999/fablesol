import {
  ACCESS,
  ACTIVITIES,
  ANIMALS,
  BATTLE_CLASSES,
  BATTLE_POWER,
  BATTLE_STATS,
  CAT_BATTLE,
  CAT_COMPANION,
  CAT_DICE,
  DIVINE_CHANCE_AT_LEVEL_50,
  BARN_ACCESS,
  COMMUNITY_CARE,
  ECONOMY_NOTES,
  ENERGY,
  EQUIPMENT_RULES,
  EQUIPMENT_SLOTS,
  FAIR_PLAY,
  FAQ_ITEMS,
  FARM_ANIMAL_TEMPERAMENT,
  FARM_SHOWCASE,
  FARM_SOCIAL_LIMITS,
  FARM_VISIT_ABUSE,
  FARM_VISIT_CAPACITY,
  FARM_VISIBILITY_OPTIONS,
  HELPER_ACTION_REQUIREMENTS,
  LIVE_PRESENCE,
  OFFLINE_VISITS,
  VISIT_RECONNECTION,
  VISITOR_INTERACTION_MODES,
  VISITOR_RESTRICTIONS,
  GAME_NAME,
  GAME_PHILOSOPHY,
  GLOSSARY,
  LEVEL_TIERS,
  MATERIAL_RARITIES,
  MATERIAL_RARITY_RANGES,
  MATCHMAKING,
  PLAYER_JOURNEY,
  REFUND_CONDITIONS,
  REGISTRATION_CONFIRMATION_FIELDS,
  SECURITY,
  SKILL_LOADOUT,
  STATUS_EFFECTS,
  TIMEZONE_RULE,
  TOURNAMENT_STATUSES,
  TOURNAMENT_TYPES,
  CLASS_SOFT_COUNTERS,
} from '@/content/game';
import { callout, definePage, interactive, links, list, section, steps, table } from './helpers';
import type { DocumentationPage, DocumentationSection } from './types';

const animalMaterialRows = ANIMALS.map((a) => [a.name, a.material] as const);
const rarityRows = MATERIAL_RARITY_RANGES.map(
  (r) => [`${r.minLevel}–${r.maxLevel}`, r.rarity, r.note ?? 'None'] as const,
);
const tierRows = LEVEL_TIERS.map(
  (t) =>
    [
      `${t.minLevel}–${t.maxLevel}`,
      String(t.dailyNpcCap),
      String(t.weeklyNpcCap),
      String(t.communityTournamentFee),
      String(t.wagerAmount),
    ] as const,
);

export const gettingStartedPage = definePage({
  slug: 'getting-started',
  availability: 'game-world',
  route: '/docs/getting-started',
  title: 'Getting started',
  eyebrow: 'Start here',
  description: `How to enter ${GAME_NAME}, understand the access requirement, and take your first cozy steps.`,
  section: 'Getting Started',
  audience: 'New players',
  keywords: ['getting started', 'begin', 'first day', 'access', 'wallet', '10,000'],
  related: ['access', 'game-overview', 'player-progression', 'animals'],
  content: [
    section('welcome', `Welcome to ${GAME_NAME}`, [
      `${GAME_NAME} is a cozy multiplayer 2D top-down pixel-art animal farming game with a fair Web3-enabled economy.`,
      `Core philosophy: “${GAME_PHILOSOPHY}” Competitive systems exist, but they never replace the welcoming farm life at the center of the game.`,
    ]),
    section(
      'enter',
      'How you enter',
      [
        'Fablesol uses the Solana network. Connect a compatible Solana wallet and hold at least 10,000 $FABLE to meet the game access requirement.',
        'After access is granted, cozy gameplay, COPPER, animals, materials, Cat Dice, Cat Battle, and tournaments run as in-game systems separate from on-chain token ownership.',
      ],
      [
        steps(ACCESS.accessSteps.map((s) => ({ title: s.title, text: s.text }))),
        callout(
          'rule',
          'Access requirement',
          'Hold at least 10,000 $FABLE in a connected Solana wallet.',
        ),
        callout('safety', 'Educational note', ACCESS.disclaimer),
      ],
    ),
    section(
      'first-day',
      'Your first day focus',
      [
        'You do not need to jump into tournaments on day one. Most players begin by exploring the world, caring for animals, and learning how materials and COPPER circulate.',
      ],
      [
        list([
          'Connect wallet and meet the $FABLE holding requirement',
          'Enter the world and orient yourself',
          'Meet your farm animals and permanent cat',
          'Collect materials and notice rarity as animals level',
          'Learn COPPER scarcity, Copper Exchange purpose, and Auction House tax',
          'Optionally try Cat Dice; Cat Battle and tournaments remain optional',
        ]),
        links([
          {
            label: 'How to Play',
            href: '/how-to-play',
            description: 'Interactive cinematic introduction',
          },
          {
            label: 'Wallet and access',
            href: '/docs/access',
            description: 'Full access diagram and safety notes',
          },
          {
            label: 'Gameplay overview',
            href: '/docs/game-overview',
            description: 'What you can do in the world',
          },
        ]),
      ],
    ),
  ],
});

export const gameplayOverviewPage = definePage({
  slug: 'game-overview',
  availability: 'game-world',
  route: '/docs/game-overview',
  title: 'Gameplay overview',
  eyebrow: 'The world',
  description:
    'A map of cozy activities, social systems, economy loops, and optional competitive cat modes.',
  section: 'Getting Started',
  audience: 'New players',
  keywords: ['gameplay', 'activities', 'overview', 'farming', 'cat battle'],
  related: ['getting-started', 'activities', 'economy', 'cat'],
  content: [
    section(
      'pillars',
      'What Fablesol combines',
      [
        'Fablesol blends peaceful production systems with a transparent player economy and optional cat-focused competitive modes.',
      ],
      [
        list([
          'Farming, animal care, fishing, mining, woodcutting',
          'Cooking, crafting, housing, exploration, social multiplayer',
          'Live personal farm visits with Community Care (Planned)',
          'Player trading, Auction House, Copper Exchange pathways',
          'Permanent cat companion, Cat Dice, Cat Battle, tournaments',
          'COPPER off-chain economy and $FABLE on-chain access',
        ]),
        interactive('activity-explorer'),
      ],
    ),
    section(
      'optional-compete',
      'Competition is optional',
      [
        'Cat Battle and tournaments are designed to be easy to learn and mobile-friendly, but no player is forced into competitive play to enjoy the cozy core.',
      ],
      [
        callout(
          'tip',
          'Play your way',
          'Care for animals, decorate, trade, or compete: the systems support different playstyles.',
        ),
      ],
    ),
  ],
});

export const playerProgressionPage = definePage({
  slug: 'player-progression',
  availability: 'game-world',
  route: '/docs/player-progression',
  title: 'Player progression',
  eyebrow: 'Growth',
  description:
    'How players grow from first entry through animal mastery, economy participation, and optional cat combat.',
  section: 'Getting Started',
  audience: 'Players',
  keywords: ['progression', 'levels', 'journey', 'milestones'],
  related: ['getting-started', 'animal-progression', 'cat', 'cat-battle/skills'],
  content: [
    section(
      'journey',
      'From first day toward mastery',
      [
        'Progression is multi-layered: world familiarity, animal levels, material rarity, economy fluency, cat development, and optional competitive systems.',
        'There is no promised hours-to-max timeline and no earnings schedule.',
      ],
      [steps(PLAYER_JOURNEY.map((j) => ({ title: j.title, text: j.text })))],
    ),
    section(
      'animals-and-cat',
      'Two parallel growth tracks',
      [
        'Farm animals progress from level 1 to 50 with material rarity milestones.',
        'Your permanent cat develops identity and, when you choose, Cat Battle skills and equipment.',
      ],
      [
        links([
          {
            label: 'Animal progression',
            href: '/docs/animal-progression',
            description: 'Levels, visuals, materials',
          },
          {
            label: 'Cat Battle skills',
            href: '/docs/cat-battle/skills',
            description: 'Skill unlock levels',
          },
        ]),
      ],
    ),
    section(
      'progress-is-social',
      'Progress worth showing off',
      [
        'Progression also has a social face: once farm visits ship (Planned), your showcase animals, transformations, trophies, and achievements become part of a farm other players can admire live. Visitors can even help a little through Community Care, a small provisional assist that never replaces your own animal care.',
      ],
      [
        links([
          {
            label: 'Farm visits',
            href: '/docs/farm-visits',
            description: 'Showcases, visitors, and Community Care',
          },
        ]),
      ],
    ),
  ],
});

export const worldAndActivitiesPage = definePage({
  slug: 'activities',
  availability: 'game-world',
  route: '/docs/activities',
  title: 'World and activities',
  eyebrow: 'Cozy systems',
  description: 'The approved main activity categories that shape daily life in Fablesol.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: ['world', 'activities', 'farming', 'gathering', 'crafting', 'visiting'],
  related: ['farming', 'fishing', 'mining', 'housing', 'farm-visits', 'inventory'],
  content: [
    section(
      'categories',
      'Main activity categories',
      [
        'Exact recipes, timers, energy costs, locations, tools, and drop rates are only listed when confirmed. Where details are still expandable, this guide explains role and relationships instead of inventing numbers.',
      ],
      [
        table(
          'Approved activity categories',
          ['Activity', 'Role in the game'],
          ACTIVITIES.map((a) => [a.name, a.summary]),
        ),
        interactive('activity-explorer'),
        links([
          {
            label: 'Farm visits',
            href: '/docs/farm-visits',
            description:
              'A planned social activity: visit friends’ farms live, admire showcases, and help within daily limits',
          },
        ]),
      ],
    ),
  ],
});

export const animalsPage = definePage({
  slug: 'animals',
  availability: 'animal-care',
  route: '/docs/animals',
  title: 'Animals',
  eyebrow: 'The ranch',
  description: 'The five core farm animals and the materials they produce.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: ['animals', 'cow', 'pig', 'horse', 'chicken', 'goat', 'materials', 'temperament'],
  related: ['animal-progression', 'materials', 'farming', 'farm-visits'],
  content: [
    section(
      'five',
      'Five core farm animals',
      [
        'Each animal has a dedicated material. Goat produces Goat Wool rather than goat milk, because Cow already supplies Milk.',
      ],
      [
        table('Animal material mapping', ['Animal', 'Material'], animalMaterialRows),
        list(ANIMALS.map((a) => `${a.name}: ${a.summary}`)),
        interactive('animal-progression'),
      ],
    ),
    section(
      'showcase-and-temperament',
      'Showing off your animals',
      [
        'Farm animals normally stay on your personal farm, where visitors will be able to admire them once farm visits ship (Planned): showcase animals, transformations, and each animal’s Temperament: its social identity, separate from the cat’s Personality.',
        'Visitors can pet and admire, but they can never collect materials or affect production. Only the owner benefits from the farm.',
      ],
      [
        links([
          {
            label: 'Farm visits',
            href: '/docs/farm-visits',
            description: 'Showcase animals, temperament, and visitor rules',
          },
        ]),
      ],
    ),
  ],
});

export const animalProgressionPage = definePage({
  slug: 'animal-progression',
  availability: 'animal-progression',
  route: '/docs/animal-progression',
  title: 'Animal progression',
  eyebrow: 'Level 1–50',
  description:
    'How animals level, transform visually every 10 levels, and produce rarer materials.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: ['animal level', 'transformation', 'milestone', 'level 50'],
  related: ['animals', 'materials', 'player-progression'],
  content: [
    section(
      'levels',
      'Level 1 to level 50',
      [
        'Every farm animal progresses from level 1 to level 50. Higher levels unlock higher material rarities.',
        'Visual transformation milestones appear every 10 levels. This is the same animal becoming more advanced visually; it does not reset.',
      ],
      [
        list(['Level 1', 'Level 10', 'Level 20', 'Level 30', 'Level 40', 'Level 50']),
        interactive('animal-progression'),
        callout(
          'rule',
          'Level 50 Divine chance',
          `At level 50, materials are Mythic with a ${DIVINE_CHANCE_AT_LEVEL_50 * 100}% chance of Divine. Divine is not guaranteed.`,
        ),
        callout(
          'tip',
          'Community Care is a small assist',
          'Once farm visits ship (Planned), visitors can add up to a provisional 5% Animal Care progress per farm per UTC day. Community Care never improves material rarity, the Divine chance, or animal levels directly.',
        ),
        links([
          {
            label: 'Farm visits and Community Care',
            href: '/docs/farm-visits',
            description: 'Daily limits and what care can never do',
          },
        ]),
      ],
    ),
  ],
});

export const materialsPage = definePage({
  slug: 'materials',
  availability: 'animal-progression',
  route: '/docs/materials',
  title: 'Materials and rarities',
  eyebrow: 'Seven tiers',
  description: 'The seven material rarities, level bands, and the level-50 Divine chance rule.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: ['rarity', 'common', 'mythic', 'divine', 'materials'],
  related: ['animals', 'animal-progression', 'economy'],
  content: [
    section(
      'seven',
      'Seven material rarities',
      [`Rarities in order: ${MATERIAL_RARITIES.join(', ')}.`],
      [
        table('Default animal material progression', ['Levels', 'Rarity', 'Notes'], rarityRows),
        interactive('rarity-ladder'),
        callout(
          'important',
          'No guaranteed Divine',
          'At level 50 the normal result remains Mythic. Divine is only a 1% chance.',
        ),
        callout(
          'tip',
          'Examples',
          'Common Milk, Rare Meat, Epic Leather, Legendary Eggs, Mythic Goat Wool, Divine Milk.',
        ),
      ],
    ),
  ],
});

function simpleActivityPage(
  slug: string,
  availability: import('@/content/game/availability').FeatureAvailabilityId,
  title: string,
  eyebrow: string,
  description: string,
  keywords: readonly string[],
  related: readonly string[],
  paragraphs: readonly string[],
  extraBlocks: readonly import('./types').DocumentationBlock[] = [],
) {
  return definePage({
    slug,
    route: `/docs/${slug}`,
    title,
    eyebrow,
    description,
    section: 'Cozy World',
    audience: 'Players',
    keywords,
    related,
    availability,
    content: [
      section('role', 'Role in Fablesol', paragraphs, [
        callout(
          'tip',
          'Expandable details',
          'Exact timers, recipes, tool stats, and drop rates are documented only when confirmed. This page explains purpose and relationships without inventing unapproved numbers.',
        ),
        ...extraBlocks,
        links([
          {
            label: 'World and activities',
            href: '/docs/activities',
            description: 'All activity categories',
          },
          {
            label: 'Economy',
            href: '/docs/economy',
            description: 'How production meets COPPER circulation',
          },
        ]),
      ]),
    ],
  });
}

export const farmingPage = simpleActivityPage(
  'farming',
  'farming',
  'Farming',
  'Crops',
  'How farming supports the cozy production loop.',
  ['farming', 'crops'],
  ['animals', 'cooking', 'crafting', 'farm-visits'],
  [
    'Farming is a core peaceful production activity. Crops support cooking, crafting, and the broader material economy.',
    'Farming sits beside animal care rather than replacing it; both feed the player economy over time.',
    'Your crops live on your personal farm. Once farm visits ship (Planned), a visiting helper may water one approved crop as validated Community Care, but visitors can never harvest crops or claim your production.',
  ],
  [
    links([
      {
        label: 'Farm visits',
        href: '/docs/farm-visits',
        description: 'Helper watering, Community Care limits, and visitor rules',
      },
    ]),
  ],
);

export const fishingPage = simpleActivityPage(
  'fishing',
  'fishing',
  'Fishing',
  'Waters',
  'Peaceful fishing as a gathering and lifestyle activity.',
  ['fishing', 'gathering'],
  ['mining', 'woodcutting', 'cooking'],
  [
    'Fishing is a relaxed gathering activity. It contributes resources and supports players who prefer quieter sessions.',
  ],
);

export const miningPage = simpleActivityPage(
  'mining',
  'mining',
  'Mining',
  'Earth',
  'Mining for materials that feed crafting and trade.',
  ['mining', 'ores'],
  ['woodcutting', 'crafting', 'economy'],
  ['Mining gathers mineral resources used across crafting and player market demand.'],
);

export const woodcuttingPage = simpleActivityPage(
  'woodcutting',
  'woodcutting',
  'Woodcutting',
  'Timber',
  'Gathering wood for crafting, housing, and trade.',
  ['woodcutting', 'wood'],
  ['mining', 'crafting', 'housing'],
  ['Woodcutting supplies wood for crafting, housing expression, and trade loops.'],
);

export const cookingPage = simpleActivityPage(
  'cooking',
  'cooking',
  'Cooking',
  'Kitchen',
  'Turning ingredients into prepared goods.',
  ['cooking', 'food'],
  ['farming', 'animals', 'crafting'],
  ['Cooking transforms farm and gathered ingredients into prepared goods for use and trade.'],
);

export const craftingPage = simpleActivityPage(
  'crafting',
  'crafting',
  'Crafting',
  'Workshop',
  'Converting materials into useful and tradeable items.',
  ['crafting', 'recipes'],
  ['materials', 'cat-battle/equipment', 'auction-house'],
  [
    'Crafting converts materials into useful items, including pathways that can support combat equipment acquisition.',
    'Exact recipes are expandable content and are not invented here.',
  ],
);

export const housingPage = simpleActivityPage(
  'housing',
  'housing',
  'Housing',
  'Home',
  'Decorating and personalizing your space.',
  ['housing', 'decorate', 'barn', 'showcase'],
  ['crafting', 'social', 'farm-visits', 'activities'],
  [
    'Housing lets players personalize space for cozy expression and social presence. It is a lifestyle system, not a pay-to-win combat lever.',
    'Decoration will have an audience: once farm visits ship (Planned), visitors admire your displays, trophies, and the public barn showcase area. Private management areas and storage stay owner-only, and visitors can never move, rotate, or delete your decorations.',
  ],
  [
    links([
      {
        label: 'Farm visits',
        href: '/docs/farm-visits',
        description: 'Public showcase areas versus private owner areas',
      },
    ]),
  ],
);

export const inventoryPage = definePage({
  slug: 'inventory',
  availability: 'inventory',
  route: '/docs/inventory',
  title: 'Inventory',
  eyebrow: 'Items',
  description: 'How inventory supports materials, goods, and trading readiness.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: ['inventory', 'items', 'materials'],
  related: ['materials', 'auction-house', 'crafting'],
  content: [
    section(
      'role',
      'Holding what you create and collect',
      [
        'Inventory is where materials, crafted goods, and eligible trade items live between activities.',
        'Exact bag sizes, stack limits, and sorting rules are documented when confirmed in product configuration. The important player truth is that inventory connects production systems to the Auction House and crafting loops.',
      ],
      [
        list([
          'Materials from animals and gathering',
          'Crafted and cooked goods',
          'Equipment and tradeable items when eligible',
        ]),
      ],
    ),
  ],
});

export const economyPage = definePage({
  slug: 'economy',
  availability: 'copper',
  route: '/docs/economy',
  title: 'Economy overview',
  eyebrow: 'Circulation',
  description:
    'How materials, COPPER, markets, and tournaments circulate value without infinite NPC minting.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['economy', 'copper', 'fable', 'markets'],
  related: ['copper', 'fable', 'copper-exchange', 'auction-house'],
  content: [
    section(
      'loop',
      'The player economy loop',
      [
        'Animals and activities produce materials. Materials feed crafting, trading, and market systems. COPPER circulates through Copper Exchange pathways, limited NPC selling, Auction House trades, and tournament redistribution.',
        ECONOMY_NOTES.noFableToCopperAuto,
      ],
      [
        interactive('economy-explorer'),
        interactive('currency-comparison'),
        interactive('market-comparison'),
        callout('important', 'Scarcity intent', ECONOMY_NOTES.copperScarce),
        callout('rule', 'Main COPPER pathway', ECONOMY_NOTES.copperExchangeMain),
      ],
    ),
  ],
});

export const copperPage = definePage({
  slug: 'copper',
  availability: 'copper',
  route: '/docs/copper',
  title: 'COPPER',
  eyebrow: 'Off-chain currency',
  description: 'What COPPER is, why it stays scarce, and how NPC caps work.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['COPPER', 'npc caps', 'daily cap', 'off-chain'],
  related: ['economy', 'copper-exchange', 'fable'],
  content: [
    section(
      'definition',
      'What COPPER is',
      [
        'COPPER is the primary off-chain in-game currency. It is not a blockchain token and not a cryptocurrency.',
        ECONOMY_NOTES.tournamentRedistribution,
      ],
      [
        callout(
          'rule',
          'Not on-chain',
          'Do not treat COPPER as $FABLE or as a transferable blockchain asset.',
        ),
      ],
    ),
    section(
      'npc-caps',
      'NPC COPPER caps (provisional)',
      [
        ECONOMY_NOTES.npcCapsAccountWide,
        ECONOMY_NOTES.provisionalLabel,
        'Community tournament fees are half the daily cap. Optional wagers are half the community fee.',
      ],
      [
        table(
          'Provisional NPC caps and derived stakes',
          ['Levels', 'Daily cap', 'Weekly cap', 'Community fee', 'Wager'],
          tierRows,
        ),
        interactive('npc-cap-calculator'),
        callout('provisional', 'Subject to retuning', ECONOMY_NOTES.provisionalLabel),
      ],
    ),
  ],
});

export const fablePage = definePage({
  slug: 'fable',
  availability: 'access-check',
  route: '/docs/fable',
  title: '$FABLE',
  eyebrow: 'On-chain token',
  description: 'Confirmed $FABLE uses: game access and approved official tournament rewards.',
  section: 'Economy',
  audience: 'All players',
  keywords: ['$FABLE', 'token', 'solana', 'access'],
  related: ['access', 'copper', 'tournaments/official'],
  content: [
    section(
      'confirmed',
      'Confirmed uses',
      ['$FABLE is the game’s on-chain Solana token.'],
      [
        list([
          'Holding at least 10,000 $FABLE is required for game access',
          '$FABLE may be included in official sponsored tournament rewards',
          '$FABLE is separate from off-chain COPPER',
        ]),
        callout('safety', 'No financial promises', ACCESS.disclaimer),
        callout(
          'important',
          'What we do not invent',
          'This documentation does not claim staking yield, guaranteed appreciation, passive income, token burning guarantees, or automatic $FABLE→COPPER conversion.',
        ),
        interactive('currency-comparison'),
      ],
    ),
  ],
});

export const copperExchangePage = definePage({
  slug: 'copper-exchange',
  availability: 'copper-exchange',
  route: '/docs/copper-exchange',
  title: 'Copper Exchange',
  eyebrow: 'Primary COPPER pathway',
  description: 'The Copper Exchange as the main meaningful COPPER circulation system.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['copper exchange', 'orders', 'circulation'],
  related: ['copper', 'auction-house', 'economy'],
  content: [
    section(
      'purpose',
      'Purpose',
      [
        ECONOMY_NOTES.copperExchangeMain,
        'Exact exchange rates, matching formulas, fees, floors, ceilings, AMMs, liquidity pools, and guaranteed buyers are not invented here. Only confirmed mechanics belong in this guide.',
        'If order expiry exists in the live product, schedules use UTC.',
      ],
      [
        interactive('market-comparison'),
        callout(
          'tip',
          'Do not confuse systems',
          'Copper Exchange, Auction House, limited NPC selling, and tournament prize pools serve different roles.',
        ),
      ],
    ),
  ],
});

export const auctionHousePage = definePage({
  slug: 'auction-house',
  availability: 'auction-house',
  route: '/docs/auction-house',
  title: 'Auction House',
  eyebrow: 'Player trading',
  description: 'Player listings, purchases, and the exact 10% Auction House tax.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['auction house', 'tax', '10%', 'trading'],
  related: ['economy', 'copper', 'inventory'],
  content: [
    section(
      'how',
      'How it works',
      [
        'Players list eligible items. Other players purchase eligible listings. A 10% tax applies. The seller receives the remaining amount according to implemented transaction rules.',
        ECONOMY_NOTES.auctionTax,
      ],
      [
        callout(
          'example',
          'Example',
          'Sale price 1,000 COPPER → tax 100 COPPER → seller receives 900 COPPER.',
        ),
        interactive('auction-tax-calculator'),
        callout(
          'example',
          'Documentation calculator only',
          'The calculator is educational. It does not create real listings or move balances.',
        ),
      ],
    ),
  ],
});

export const walletAccessPage = definePage({
  slug: 'access',
  availability: 'access-check',
  route: '/docs/access',
  title: 'Wallet and access',
  eyebrow: 'Entry',
  description:
    'Solana wallet connection, 10,000 $FABLE requirement, and the boundary between on-chain and off-chain systems.',
  section: 'Getting Started',
  audience: 'New players',
  keywords: ['wallet', 'solana', 'access', '10000', 'entry'],
  related: ['getting-started', 'fable', 'security'],
  content: [
    section(
      'layers',
      'Five clear layers',
      [
        'Understanding access is easier when you separate connection, holdings, profile, off-chain play, and on-chain ownership.',
      ],
      [
        list([
          'Wallet connection with a compatible Solana wallet',
          'Token holding requirement: at least 10,000 $FABLE',
          'In-game account or player profile',
          'Off-chain gameplay economy (COPPER and systems)',
          'On-chain token ownership in your wallet',
        ]),
        interactive('access-flow'),
        callout(
          'safety',
          'Seed phrases',
          'Never share seed phrases. Fablesol will never ask for them.',
        ),
        callout('safety', 'Disclaimer', ACCESS.disclaimer),
      ],
    ),
  ],
});

export const catsPage = definePage({
  slug: 'cat',
  availability: 'cat-companion',
  route: '/docs/cat',
  title: 'Permanent cat companion',
  eyebrow: 'Your cat',
  description: 'One permanent cat: identity, personality, casual play, Cat Dice, and Cat Battle.',
  section: 'Your Cat',
  audience: 'Players',
  keywords: ['cat', 'companion', 'personality', 'permanent'],
  related: ['cat-dice', 'cat-battle', 'cat-battle/classes'],
  content: [
    section(
      'one-cat',
      'One permanent companion',
      [
        `Each player has ${CAT_COMPANION.permanentCount} permanent cat companion. The cat is not a disposable battle unit.`,
      ],
      [
        list([...CAT_COMPANION.identity]),
        callout('important', 'Not included', CAT_COMPANION.notIncluded.join('; ') + '.'),
      ],
    ),
    section(
      'identity',
      'Personality and Battle Class',
      [
        'Every cat has Personality and Battle Class as separate systems.',
        'Personality represents identity and provides a small passive effect.',
        'Battle Class defines combat role, stat emphasis, and skill style. It is selected when Cat Battle unlocks and is permanent under normal conditions.',
      ],
      [
        links([
          { label: 'Cat Dice', href: '/docs/cat-dice', description: 'Casual luck-based play' },
          { label: 'Cat Battle', href: '/docs/cat-battle', description: 'Strategic combat' },
          { label: 'Classes', href: '/docs/cat-battle/classes', description: 'Five battle roles' },
        ]),
      ],
    ),
  ],
});

export const catDicePage = definePage({
  slug: 'cat-dice',
  availability: 'cat-dice',
  route: '/docs/cat-dice',
  title: 'Cat Dice',
  eyebrow: 'Luck & leisure',
  description: 'Casual luck-based cat play that never mixes with Cat Battle odds or Battle Power.',
  section: 'Your Cat',
  audience: 'Players',
  keywords: ['cat dice', 'luck', 'probability'],
  related: ['cat', 'cat-battle', 'tournaments'],
  content: [
    section(
      'nature',
      'What Cat Dice is',
      [
        `${CAT_DICE.nature}. It is completely separate from Cat Battle matchmaking, tournaments balance, and rewards.`,
        CAT_DICE.keyRule,
      ],
      [
        callout('rule', 'Level does not change odds', CAT_DICE.keyRule),
        callout(
          'important',
          'Not skill combat',
          'Cat Dice is not skill-based combat and does not use Battle Power or Battle Classes for odds.',
        ),
        interactive('cat-dice-demo'),
        callout(
          'example',
          'Illustration only',
          'Any dice animation in documentation is educational and does not award real COPPER or rewards.',
        ),
      ],
    ),
  ],
});

export const catBattlePage = definePage({
  slug: 'cat-battle',
  availability: 'cat-battle',
  route: '/docs/cat-battle',
  title: 'Cat Battle',
  eyebrow: 'Strategic combat',
  description: 'Turn-based Best-of-1 cat combat: rules, flow, and philosophy.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['cat battle', 'turn-based', 'best-of-1', 'combat'],
  related: ['cat-battle/classes', 'cat-battle/energy', 'cat-battle/matchmaking'],
  content: [
    section(
      'foundation',
      'Foundation rules',
      [
        `Cat Battle is ${CAT_BATTLE.style.toLowerCase()}. Format: ${CAT_BATTLE.format}. ${CAT_BATTLE.philosophy}`,
      ],
      [
        list([
          `Format: ${CAT_BATTLE.format}`,
          `One action per turn`,
          `Speed determines who moves first`,
          `Skills consume Energy`,
          `${CAT_BATTLE.turnTimerSeconds}-second action timer`,
          'Combat resolution is validated by the game and deterministic under the approved battle rules',
          `Target match duration about ${CAT_BATTLE.targetMatchMinutes.min}–${CAT_BATTLE.targetMatchMinutes.max} minutes`,
        ]),
        interactive('battle-flow'),
        callout(
          'rule',
          'Not real-time action combat',
          'Cat Battle is turn-based. Do not confuse it with twitch esports mechanics.',
        ),
      ],
    ),
  ],
});

export const catBattleClassesPage = definePage({
  slug: 'cat-battle/classes',
  availability: 'cat-battle',
  route: '/docs/cat-battle/classes',
  title: 'Battle Classes',
  eyebrow: 'Five roles',
  description:
    'Fighter, Tank, Assassin, Support, and Controller: roles, tradeoffs, and soft counters.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['fighter', 'tank', 'assassin', 'support', 'controller'],
  related: ['cat-battle', 'cat-battle/skills', 'cat-battle/stats'],
  content: [
    section(
      'classes',
      'Five Battle Classes',
      [
        'Soft-counter relationships are strategic guidance, not automatic wins. There are no fixed class-versus-class damage bonuses.',
      ],
      [
        table(
          'Class overview',
          ['Class', 'Role', 'Soft counters'],
          BATTLE_CLASSES.map((c) => [c.name, c.role, c.softCounters]),
        ),
        interactive('battle-class-selector'),
        interactive('class-soft-counters'),
        list(CLASS_SOFT_COUNTERS.map((c) => c.note)),
      ],
    ),
  ],
});

export const catBattleStatsPage = definePage({
  slug: 'cat-battle/stats',
  availability: 'cat-battle',
  route: '/docs/cat-battle/stats',
  title: 'Core stats',
  eyebrow: 'HP to Energy',
  description: 'The five visible Cat Battle stats. Luck is not a permanent core stat.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['HP', 'Attack', 'Defense', 'Speed', 'Energy', 'stats'],
  related: ['cat-battle/energy', 'cat-battle/battle-power'],
  content: [
    section(
      'five-stats',
      'Visible core stats',
      [
        'Chance-based effects should show exact percentages when available rather than vague wording.',
      ],
      [
        table(
          'Core stats',
          ['Stat', 'Meaning'],
          BATTLE_STATS.map((s) => [s.name, s.description]),
        ),
        interactive('stat-explorer'),
        callout('rule', 'No permanent Luck stat', 'Luck is not a sixth permanent core stat.'),
      ],
    ),
  ],
});

export const catBattleEnergyPage = definePage({
  slug: 'cat-battle/energy',
  availability: 'cat-battle',
  route: '/docs/cat-battle/energy',
  title: 'Energy system',
  eyebrow: 'Resource timing',
  description: 'Starting Energy, caps, gains, and skill costs for Cat Battle.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['energy', 'ultimate', 'skills', '50', '100', '15'],
  related: ['cat-battle/skills', 'cat-battle/stats'],
  content: [
    section(
      'rules',
      'Energy rules',
      [
        `Start with ${ENERGY.starting} Energy. Maximum is ${ENERGY.maximum}. Gain ${ENERGY.gainAfterAction} Energy after each action.`,
      ],
      [
        list([
          `Basic Attack costs ${ENERGY.basicAttackCost} Energy`,
          `Normal skills generally cost ${ENERGY.normalSkillCostRange.min}–${ENERGY.normalSkillCostRange.max} Energy`,
          `Ultimate generally costs ${ENERGY.ultimateCostRange.min}–${ENERGY.ultimateCostRange.max} Energy`,
        ]),
        interactive('energy-simulator'),
        callout(
          'example',
          'Educational simulator',
          'The Energy timeline simulator is documentation-only and does not affect real battles.',
        ),
      ],
    ),
  ],
});

export const catBattleSkillsPage = definePage({
  slug: 'cat-battle/skills',
  availability: 'cat-battle',
  route: '/docs/cat-battle/skills',
  title: 'Skills',
  eyebrow: 'Loadout',
  description: 'Basic Attack, two Active Skills, Ultimate, Passive, and unlock levels.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['skills', 'ultimate', 'passive', 'loadout'],
  related: ['cat-battle/energy', 'cat-battle/classes'],
  content: [
    section(
      'slots',
      'Skill structure',
      [
        `Each cat has ${SKILL_LOADOUT.basicAttack} Basic Attack, ${SKILL_LOADOUT.equippedActiveSkills} equipped Active Skills, ${SKILL_LOADOUT.ultimate} Ultimate, and ${SKILL_LOADOUT.passive} Passive.`,
        'Skills cannot be changed after matchmaking or battle entry.',
      ],
      [
        table(
          'Skill unlocks',
          ['Level', 'Unlock'],
          SKILL_LOADOUT.unlocks.map((u) => [String(u.level), u.unlock]),
        ),
        interactive('skill-unlock-timeline'),
        list([
          `Basic Attack: ${SKILL_LOADOUT.costs.basicAttack} Energy`,
          `Active Skill 1 typical: ${SKILL_LOADOUT.costs.activeSkill1Typical}`,
          `Active Skill 2 typical: ${SKILL_LOADOUT.costs.activeSkill2Typical}`,
          `Ultimate typical: ${SKILL_LOADOUT.costs.ultimateTypical}`,
          `Passive: ${SKILL_LOADOUT.costs.passive}`,
        ]),
        callout(
          'rule',
          'Loadout lock',
          'Skills lock after matchmaking. No mid-battle loadout changes.',
        ),
      ],
    ),
  ],
});

export const catBattleStatusPage = definePage({
  slug: 'cat-battle/status-effects',
  availability: 'cat-battle',
  route: '/docs/cat-battle/status-effects',
  title: 'Status effects',
  eyebrow: 'Five effects',
  description: 'Heal, Shield, Bleed, Stun, and Weaken: the only approved status effects.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['heal', 'shield', 'bleed', 'stun', 'weaken'],
  related: ['cat-battle/skills', 'cat-battle/classes'],
  content: [
    section(
      'approved',
      'Approved effects only',
      [
        'Exact percentages, durations, stacking, and immunities are documented only when confirmed in combat specification.',
      ],
      [
        table(
          'Status effects',
          ['Effect', 'Definition'],
          STATUS_EFFECTS.map((s) => [s.name, s.description]),
        ),
        interactive('status-effects-gallery'),
        callout(
          'important',
          'Not in the system',
          'Poison, freeze, fear, silence, root, confusion, sleep, taunt, burn, charm, blind, shock, and petrify are not added merely for complexity.',
        ),
      ],
    ),
  ],
});

export const catBattlePowerPage = definePage({
  slug: 'cat-battle/battle-power',
  availability: 'cat-battle',
  route: '/docs/cat-battle/battle-power',
  title: 'Battle Power',
  eyebrow: 'Build strength',
  description: 'What Battle Power measures, and why wins do not change it.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['battle power', 'matchmaking', 'build'],
  related: ['cat-battle/matchmaking', 'cat-battle/equipment'],
  content: [
    section(
      'definition',
      'Build and progression strength',
      [BATTLE_POWER.definition, BATTLE_POWER.note],
      [
        list([...BATTLE_POWER.contributors]),
        interactive('battle-power-breakdown'),
        callout(
          'rule',
          'Not win-based MMR',
          'Winning or losing does not directly change Battle Power. Ranked rating is not currently the primary matchmaking system.',
        ),
      ],
    ),
  ],
});

export const catBattleEquipmentPage = definePage({
  slug: 'cat-battle/equipment',
  availability: 'equipment',
  route: '/docs/cat-battle/equipment',
  title: 'Equipment',
  eyebrow: 'Three slots',
  description: 'Weapon, Armor, and Accessory: simple combat gear that contributes to Battle Power.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['equipment', 'weapon', 'armor', 'accessory'],
  related: ['cat-battle/battle-power', 'auction-house', 'crafting'],
  content: [
    section(
      'slots',
      'Exactly three slots',
      [EQUIPMENT_RULES.progressionNote, EQUIPMENT_RULES.rarityLabelsMayMatchMaterials],
      [
        table(
          'Equipment slots',
          ['Slot', 'Role'],
          EQUIPMENT_SLOTS.map((s) => [s.name, s.role]),
        ),
        interactive('equipment-loadout'),
        list(EQUIPMENT_RULES.acquisition.map((a) => `Acquisition: ${a}`)),
        callout(
          'important',
          'No gacha gear loop',
          EQUIPMENT_RULES.notIncluded.slice(0, 3).join('; ') + '.',
        ),
      ],
    ),
  ],
});

export const catBattleMatchmakingPage = definePage({
  slug: 'cat-battle/matchmaking',
  availability: 'matchmaking',
  route: '/docs/cat-battle/matchmaking',
  title: 'Matchmaking',
  eyebrow: 'Finding a fight',
  description: 'Level-tier matching and Battle Power range expansion over time.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['matchmaking', '±5%', 'battle power range'],
  related: ['cat-battle/battle-power', 'cat-battle/wagers'],
  content: [
    section(
      'rules',
      'Matchmaking rules',
      [
        'Players match within the same level tier and search for similar Battle Power.',
        'Matchmaking is not guaranteed to be instant and does not invent hidden MMR or bot opponents unless the live game supports them.',
      ],
      [
        table(
          'Range expansion',
          ['Time', 'Range'],
          MATCHMAKING.expansion.map((e) => [`${e.atSeconds}s`, `±${e.rangePercent}%`]),
        ),
        callout(
          'rule',
          'Wagered maximum',
          `Wagered matches must never exceed ±${MATCHMAKING.wageredMaxRangePercent}%.`,
        ),
        interactive('matchmaking-timeline'),
      ],
    ),
  ],
});

export const catBattleWagersPage = definePage({
  slug: 'cat-battle/wagers',
  availability: 'wagers',
  route: '/docs/cat-battle/wagers',
  title: 'Wagered battles',
  eyebrow: 'Optional stakes',
  description: 'Optional 1v1 COPPER wagers with no tax, burn, or developer cut.',
  section: 'Cat Battle',
  audience: 'Competitive players',
  keywords: ['wager', '1v1', 'pot', 'COPPER'],
  related: ['cat-battle/matchmaking', 'tournaments', 'copper'],
  content: [
    section(
      'rules',
      'Optional and transparent',
      [
        'Wager amounts are exactly half of the corresponding community tournament fee for the level tier.',
        'Both players stake the same amount. Winner receives the full combined pot. Tax 0. Burn 0. Wagering is optional.',
      ],
      [
        table(
          'Wager amounts by level tier',
          ['Levels', 'Wager each', 'Winner pot'],
          LEVEL_TIERS.map((t) => [
            `${t.minLevel}–${t.maxLevel}`,
            `${t.wagerAmount} COPPER`,
            `${t.wagerAmount * 2} COPPER`,
          ]),
        ),
        interactive('wager-calculator'),
        callout(
          'safety',
          'Responsible framing',
          'Wagering is optional and not guaranteed income. Documentation uses calm player language, not casino styling.',
        ),
      ],
    ),
  ],
});

export const tournamentsPage = definePage({
  slug: 'tournaments',
  availability: 'tournaments-community',
  route: '/docs/tournaments',
  title: 'Tournaments',
  eyebrow: 'Community & official',
  description: 'Tournament lobby concepts, statuses, and the two main tournament types.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['tournaments', 'lobby', 'status', 'UTC'],
  related: ['tournaments/community', 'tournaments/official', 'tournaments/registration'],
  content: [
    section(
      'types',
      'Two main types',
      [
        'Keep Community and Official Sponsored tournament economies distinct. Cat Dice tournaments and Cat Battle tournaments also remain separate.',
      ],
      [
        list([
          `${TOURNAMENT_TYPES.community.name}: player-funded COPPER pool, no tax/burn/dev cut`,
          `${TOURNAMENT_TYPES.official.name}: collected COPPER to rewards, may add sponsored rewards`,
        ]),
        table(
          'Tournament statuses',
          ['Status', 'Meaning'],
          TOURNAMENT_STATUSES.map((s) => [s.label, s.description]),
        ),
        callout('rule', 'UTC everywhere', TIMEZONE_RULE.statement),
      ],
    ),
  ],
});

export const tournamentsCommunityPage = definePage({
  slug: 'tournaments/community',
  availability: 'tournaments-community',
  route: '/docs/tournaments/community',
  title: 'Community Tournaments',
  eyebrow: 'Player-funded',
  description: '100% of entrance fees form the prize pool. Minimum two players. No developer cut.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['community tournament', 'prize pool', 'entrance fee'],
  related: ['tournaments/rewards', 'copper', 'tournaments/registration'],
  content: [
    section(
      'rules',
      'Community rules',
      [TOURNAMENT_TYPES.community.prizePoolRule, TOURNAMENT_TYPES.community.designReason],
      [
        list([
          'Player-funded',
          'Minimum of 2 players',
          'Entrance currency is COPPER',
          'No tournament tax',
          'No COPPER burn',
          'No developer cut',
          'Full refund if fewer than 2 players join',
        ]),
        table(
          'Community entrance fees (half daily NPC cap)',
          ['Levels', 'Daily NPC cap', 'Entrance fee'],
          LEVEL_TIERS.map((t) => [
            `${t.minLevel}–${t.maxLevel}`,
            String(t.dailyNpcCap),
            String(t.communityTournamentFee),
          ]),
        ),
        interactive('tournament-fee-calculator'),
        interactive('prize-pool-demo'),
      ],
    ),
  ],
});

export const tournamentsOfficialPage = definePage({
  slug: 'tournaments/official',
  availability: 'tournaments-official',
  route: '/docs/tournaments/official',
  title: 'Official Sponsored Tournaments',
  eyebrow: 'Sponsored events',
  description:
    'Official events may add sponsored rewards while still routing collected COPPER into rewards.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['official tournament', 'sponsored', '$FABLE rewards'],
  related: ['tournaments/community', 'tournaments/rewards', 'fable'],
  content: [
    section(
      'rules',
      'Official rules',
      [
        TOURNAMENT_TYPES.official.copperToRewards,
        'Lower COPPER entrance fee may be configured compared with an equivalent community tournament.',
        '$FABLE is not promised in every official tournament unless that event’s configuration includes it.',
      ],
      [
        list(
          TOURNAMENT_TYPES.official.sponsoredRewardExamples.map(
            (r) => `Possible sponsored reward category: ${r}`,
          ),
        ),
        callout(
          'important',
          'No invented prize values',
          'This documentation does not invent guaranteed sponsored reward amounts.',
        ),
      ],
    ),
  ],
});

export const tournamentsRegistrationPage = definePage({
  slug: 'tournaments/registration',
  availability: 'tournaments-community',
  route: '/docs/tournaments/registration',
  title: 'Tournament registration',
  eyebrow: 'Confirm before charge',
  description: 'Mandatory confirmation dialog fields and educational registration demo.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['registration', 'confirmation', 'COPPER charge'],
  related: ['tournaments/rewards', 'utc', 'fair-play'],
  content: [
    section(
      'confirm',
      'Mandatory confirmation',
      [
        'When a player chooses Enter Tournament, a confirmation dialog is required before COPPER is charged.',
        'Confirmation is never preselected. Button labels must be honest. Remaining balance stays visible. Schedules show UTC.',
      ],
      [
        list([...REGISTRATION_CONFIRMATION_FIELDS]),
        interactive('tournament-registration-demo'),
        callout(
          'example',
          'Demo only',
          'The documentation dialog never charges COPPER or registers you for a real tournament.',
        ),
      ],
    ),
  ],
});

export const tournamentsRewardsPage = definePage({
  slug: 'tournaments/rewards',
  availability: 'tournaments-community',
  route: '/docs/tournaments/rewards',
  title: 'Rewards and refunds',
  eyebrow: 'Transparency',
  description: 'Prize pool formation, sponsored rewards boundaries, and when refunds apply.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['rewards', 'refunds', 'prize pool'],
  related: ['tournaments/community', 'tournaments/official', 'tournaments/refunds'],
  content: [
    section(
      'pools',
      'Prize pools',
      [
        'Community: entrants × entrance fee = COPPER prize pool (100% of fees).',
        'Official: collected COPPER goes to rewards and may be joined by sponsored rewards when configured.',
        'Exact placement distribution percentages are only documented when confirmed.',
      ],
      [interactive('prize-pool-demo')],
    ),
    section(
      'refunds',
      'When refunds happen',
      [
        'Refunds are not automatic simply because a player loses, misses a match, or changes their mind after the deadline.',
        'Refunds apply when an event cannot run as promised: cancellation, minimum participants not reached, or a qualifying failure.',
      ],
      [
        links([
          {
            label: 'Tournament refunds',
            href: '/docs/tournaments/refunds',
            description: 'The full list of refund conditions and non-refundable cases',
          },
        ]),
      ],
    ),
  ],
});

export const timeUtcPage = definePage({
  slug: 'utc',
  route: '/docs/utc',
  title: 'Time and UTC',
  eyebrow: 'Canonical clock',
  description: 'Why all official schedules use UTC and how to read examples correctly.',
  section: 'Rules and Support',
  audience: 'All players',
  keywords: ['UTC', 'timezone', 'schedule'],
  related: ['tournaments/registration', 'security'],
  content: [
    section(
      'rule',
      'UTC is official',
      [TIMEZONE_RULE.statement, TIMEZONE_RULE.noAutoLocalConversion],
      [
        list([...TIMEZONE_RULE.appliesTo]),
        interactive('utc-explainer'),
        callout(
          'example',
          'Example',
          'Registration closes 2026-08-01 18:00 UTC. The official label remains UTC even if you convert privately.',
        ),
      ],
    ),
  ],
});

export const fairPlayPage = definePage({
  slug: 'fair-play',
  route: '/docs/fair-play',
  title: 'Fair play',
  eyebrow: 'Conduct',
  description: 'Allowed multi-accounting boundaries and prohibited exploitation patterns.',
  section: 'Rules and Support',
  audience: 'All players',
  keywords: ['fair play', 'exploit', 'multi account', 'bots', 'farm visit abuse'],
  related: ['security', 'farm-visits', 'tournaments/registration'],
  content: [
    section(
      'principle',
      'Core principle',
      [FAIR_PLAY.multiAccountPrinciple, FAIR_PLAY.enforcementNote],
      [list([...FAIR_PLAY.prohibited])],
    ),
    section(
      'farm-visit-abuse',
      'Farm-visit abuse',
      [
        'The same principles cover the planned farm-visit and Community Care systems. Prohibited farm-visit abuse includes:',
      ],
      [
        list([...FARM_VISIT_ABUSE]),
        links([
          {
            label: 'Farm visits',
            href: '/docs/farm-visits',
            description: 'How visits, helpers, and Community Care work',
          },
        ]),
      ],
    ),
  ],
});

export const securityPage = definePage({
  slug: 'security',
  route: '/docs/security',
  title: 'Security and trust',
  eyebrow: 'Stay safe',
  description: 'Wallet safety, domain verification, COPPER vs on-chain actions, and reporting.',
  section: 'Rules and Support',
  audience: 'All players',
  keywords: ['security', 'wallet safety', 'seed phrase', 'phishing'],
  related: ['access', 'fair-play'],
  content: [
    section(
      'practices',
      'Player security practices',
      [
        'This page explains safety habits without exposing sensitive implementation details or secrets.',
      ],
      [
        steps(SECURITY.topics.map((t) => ({ title: t.title, text: t.text }))),
        callout('safety', 'Never', SECURITY.never.join(' ')),
      ],
    ),
  ],
});

export const faqPage = definePage({
  slug: 'faq',
  route: '/docs/faq',
  title: 'FAQ',
  eyebrow: 'Quick answers',
  description: 'Short answers to the most common Fablesol rules questions.',
  section: 'Rules and Support',
  audience: 'All players',
  keywords: ['faq', 'questions', 'answers'],
  related: ['glossary', 'getting-started'],
  content: [
    section(
      'answers',
      'Frequently asked questions',
      [
        'Answers follow confirmed product rules. For deeper detail, open the related guide linked under each topic in the full FAQ component on this page.',
      ],
      [
        list(FAQ_ITEMS.map((f) => `${f.question} ${f.answer}`)),
        links(
          FAQ_ITEMS.slice(0, 8).map((f) => ({
            label: f.question,
            href: f.relatedRoutes?.[0] ?? '/docs',
            description: f.answer.slice(0, 120) + (f.answer.length > 120 ? '…' : ''),
          })),
        ),
      ],
    ),
  ],
});

export const glossaryPage = definePage({
  slug: 'glossary',
  route: '/docs/glossary',
  title: 'Glossary',
  eyebrow: 'Definitions',
  description: 'Searchable definitions for currencies, combat terms, tournaments, and systems.',
  section: 'Rules and Support',
  audience: 'All players',
  keywords: ['glossary', 'definitions', 'terms'],
  related: ['faq', 'getting-started'],
  content: [
    section(
      'terms',
      'Key terms',
      ['Use this glossary when you need a precise definition without rereading an entire guide.'],
      [list(GLOSSARY.map((g) => `${g.term}: ${g.definition}`))],
    ),
  ],
});

export const firstDayPage = definePage({
  slug: 'first-day',
  availability: 'game-world',
  route: '/docs/first-day',
  title: 'Your first day',
  eyebrow: 'Day one',
  description:
    'A calm, step-by-step plan for your first session, from wallet access to your first materials.',
  section: 'Getting Started',
  audience: 'New players',
  keywords: ['first day', 'first session', 'new player', 'start', 'orientation'],
  related: ['getting-started', 'access', 'activities', 'animals'],
  content: [
    section(
      'plan',
      'A relaxed first-session plan',
      [
        'There is no wrong way to spend a first day. This plan simply gives new players a comfortable order to meet the systems.',
        'Nothing on day one is time-pressured. Tournaments, wagers, and Cat Battle stay entirely optional.',
      ],
      [
        steps([
          {
            title: 'Meet the access requirement',
            text: 'Connect a compatible Solana wallet holding at least 10,000 $FABLE.',
          },
          {
            title: 'Enter and look around',
            text: 'Walk the world, find your farm space, and meet nearby players.',
          },
          {
            title: 'Say hello to your animals',
            text: 'The five farm animals (Cow, Pig, Horse, Chicken, Goat) each produce their own material.',
          },
          {
            title: 'Meet your permanent cat',
            text: 'Your one lifelong companion for casual play, Cat Dice, and later Cat Battle.',
          },
          {
            title: 'Pick one cozy activity',
            text: 'Farm, fish, mine, cut wood, cook, craft, or decorate: whatever sounds pleasant.',
          },
          {
            title: 'Learn the two currencies',
            text: 'COPPER is the off-chain in-game currency. $FABLE is the on-chain Solana token used for access.',
          },
        ]),
        interactive('activity-explorer'),
        callout(
          'tip',
          'No rush',
          'Animal levels, materials, and the economy reward steady play over weeks, not a perfect first hour.',
        ),
        links([
          {
            label: 'Getting started',
            href: '/docs/getting-started',
            description: 'Access requirement and orientation',
          },
          {
            label: 'Animals',
            href: '/docs/animals',
            description: 'The five farm animals and their materials',
          },
        ]),
      ],
    ),
  ],
});

export const explorationPage = simpleActivityPage(
  'exploration',
  'exploration',
  'Exploration',
  'The world',
  'Wandering the shared world, discovering places, and finding social moments.',
  ['exploration', 'discover', 'world'],
  ['social', 'housing', 'activities'],
  [
    'Exploration is the connective tissue between activities: moving through the shared world, discovering locations, and stumbling into social moments.',
    'Specific regions, points of interest, and discovery rewards are documented when confirmed.',
  ],
);

export const socialPage = simpleActivityPage(
  'social',
  'social',
  'Social multiplayer',
  'Together',
  'Sharing the world with other players in a welcoming multiplayer environment.',
  ['social', 'multiplayer', 'friends', 'farm visits'],
  ['farm-visits', 'exploration', 'housing', 'player-trading'],
  [
    'Fablesol is a shared world. Social play means being present with other players: visiting spaces, decorating, trading, and enjoying activities side by side.',
    'The centerpiece of planned social play is visiting personal farms: live shared spaces where you see the owner and other visitors move, emote, and help in real time.',
    'Social features never gate cozy progression: playing quietly is always a valid style.',
  ],
  [
    links([
      {
        label: 'Farm visits',
        href: '/docs/farm-visits',
        description: 'Visit friends’ farms live: presence, permissions, and Community Care',
      },
    ]),
  ],
);

export const farmVisitsPage = definePage({
  slug: 'farm-visits',
  availability: 'farm-visits',
  route: '/docs/farm-visits',
  title: 'Farm visits',
  eyebrow: 'Live social farms',
  description:
    'Visit other players’ personal farms live: realtime presence, visibility settings, visitor modes, showcase animals, Community Care, and what visitors can never do.',
  section: 'Cozy World',
  audience: 'Players',
  keywords: [
    'farm visits',
    'personal farm',
    'visit',
    'community care',
    'presence',
    'showcase',
    'guestbook',
    'helpers',
  ],
  related: ['social', 'animals', 'housing', 'fair-play'],
  content: [
    section('what', 'What personal farm visits are', [
      'Every player will have a personal farm: your private production and management space, and at the same time a social showroom where visitors admire your animals, transformations, temperaments, decorations, trophies, and achievements.',
      'Farm animals normally stay on the personal farm, while your permanent cat remains your companion throughout the shared public world.',
      'Farm visits are live online multiplayer experiences: the owner sees visitors arrive in real time, and visitors see the owner and each other while they explore.',
    ]),
    section(
      'presence',
      'Live presence',
      [
        'A personal farm acts as one shared multiplayer space. Everyone inside the same farm visit will eventually see:',
      ],
      [
        list(LIVE_PRESENCE.events),
        callout('example', 'A live visit in practice', LIVE_PRESENCE.example),
      ],
    ),
    section(
      'visibility',
      'Farm visibility',
      ['The owner chooses who may enter. There are exactly four visibility options:'],
      [
        table(
          'Farm visibility options',
          ['Option', 'Who may enter'],
          FARM_VISIBILITY_OPTIONS.map((option) => [option.name, option.description]),
        ),
      ],
    ),
    section(
      'modes',
      'Visitor interaction modes',
      [
        'Separately from visibility, the owner selects what visitors may do. Each mode includes everything from the mode before it.',
      ],
      [
        interactive('farm-visit-explorer'),
        ...VISITOR_INTERACTION_MODES.map((mode) =>
          callout('tip', mode.name, `${mode.summary} ${mode.note}`),
        ),
      ],
    ),
    section(
      'capacity',
      'Visit capacity',
      [
        'Daily sightseeing visits are unlimited, and you may revisit the same farm as often as you like.',
        FARM_VISIT_CAPACITY.entryNote,
      ],
      [
        table(
          'Capacity of one live farm visit',
          ['Rule', 'Value'],
          [
            ['Maximum simultaneous visitors', String(FARM_VISIT_CAPACITY.maxVisitors)],
            ['Does the owner count as a visitor?', 'No'],
            [
              'Maximum players in one farm instance',
              `${FARM_VISIT_CAPACITY.maxTotalPlayers} (owner + ${FARM_VISIT_CAPACITY.maxVisitors} visitors)`,
            ],
            ['Daily sightseeing visits', 'Unlimited'],
          ],
        ),
        callout(
          'example',
          'When a farm is full',
          `Future gameplay may show a clear message such as “${FARM_VISIT_CAPACITY.fullMessage}”`,
        ),
      ],
    ),
    section(
      'showcase',
      'Showcase animals',
      [
        `Show off your progress: up to ${FARM_SHOWCASE.maxProfileShowcaseAnimals} Showcase Animals on your player profile, and up to ${FARM_SHOWCASE.maxEntranceShowcaseAnimals} featured near the farm entrance or showcase pen.`,
        FARM_SHOWCASE.prestigeNote,
      ],
      [
        table(
          'What visitors can and cannot inspect',
          ['Public animal information', 'Always private'],
          FARM_SHOWCASE.publicInfo.map((publicItem, index) => [
            publicItem,
            FARM_SHOWCASE.privateInfo[index] ?? 'None',
          ]),
        ),
      ],
    ),
    section('temperament', 'Farm-animal temperament', [
      FARM_ANIMAL_TEMPERAMENT.catTermNote,
      `Example temperaments could include ${FARM_ANIMAL_TEMPERAMENT.exampleValues.join(', ')}. ${FARM_ANIMAL_TEMPERAMENT.exampleNote}`,
      'Temperament shapes idle behavior, reactions, social animations, and identity. It never increases material rarity, the 1% Divine chance, or COPPER generation.',
    ]),
    section(
      'barn',
      'Barn access',
      [
        'Barns have two faces: a public showcase area visitors may enjoy, and a private owner area that stays closed in every mode.',
        BARN_ACCESS.rule,
      ],
      [
        table(
          'Public showcase versus private owner area',
          ['Public showcase area', 'Private owner area'],
          BARN_ACCESS.publicShowcase.map((publicItem, index) => [
            publicItem,
            BARN_ACCESS.privateOwnerArea[index] ?? 'None',
          ]),
        ),
      ],
    ),
    section(
      'social-limits',
      'Social interactions and limits',
      ['Social play is encouraged, with a few honest limits:'],
      [
        list([
          `Farm Appreciation: ${FARM_SOCIAL_LIMITS.farmAppreciation}`,
          `Guestbook: ${FARM_SOCIAL_LIMITS.guestbook}`,
          `Animal petting: ${FARM_SOCIAL_LIMITS.petting}`,
          `Emotes, sitting, and photo areas: ${FARM_SOCIAL_LIMITS.emotes}`,
        ]),
      ],
    ),
    section(
      'community-care',
      'Community Care',
      [
        'Visitors on farms with Allow Helpers enabled can contribute small, validated care actions. All Community Care limits reset on the UTC day.',
      ],
      [
        table(
          'Community Care limits (UTC day)',
          ['Rule', 'Value'],
          [
            [
              'Valid contributions one farm may receive',
              `${COMMUNITY_CARE.maxContributionsPerFarmPerDay} per UTC day`,
            ],
            [
              'Valid contributions from one visitor to the same farm',
              `${COMMUNITY_CARE.maxContributionsPerVisitorPerFarmPerDay} per UTC day`,
            ],
            [
              'Different players required?',
              'Yes; each valid contribution needs a different player',
            ],
            [
              'Farms one helper may validly care for',
              `${COMMUNITY_CARE.maxFarmsHelpedPerVisitorPerDay} per UTC day`,
            ],
            [
              'Benefit per valid contribution',
              `${COMMUNITY_CARE.benefitPerContributionPercent}% Animal Care progress`,
            ],
            [
              'Maximum daily benefit',
              `${COMMUNITY_CARE.maxDailyBenefitPercent}% Animal Care progress`,
            ],
          ],
        ),
        callout('provisional', 'Provisional balancing values', COMMUNITY_CARE.provisionalLabel),
        callout('rule', 'The Community Care rule', COMMUNITY_CARE.coreRule),
        list([
          COMMUNITY_CARE.repeatVisitNote,
          COMMUNITY_CARE.afterCapNote,
          COMMUNITY_CARE.resetRule,
        ]),
      ],
    ),
    section(
      'care-never',
      'What Community Care never does',
      ['Community Care is social assistance only. It must never:'],
      [list(COMMUNITY_CARE.never)],
    ),
    section(
      'helpers',
      'Helper actions',
      [
        'When the owner enables Allow Helpers, visitors may perform small approved actions such as watering one crop, brushing one animal, cleaning one approved barn area, or refilling one basic water trough.',
        'Every helper action must pass all of these checks before it counts:',
      ],
      [
        list(HELPER_ACTION_REQUIREMENTS, true),
        callout(
          'tip',
          'Details arrive later',
          'Exact animation lengths, cooldowns, object lists, and task rotations are documented only when approved.',
        ),
      ],
    ),
    section(
      'restrictions',
      'What visitors can never do',
      [],
      [
        callout('rule', 'The visitor rule', VISITOR_RESTRICTIONS.coreRule),
        list(VISITOR_RESTRICTIONS.never),
      ],
    ),
    section(
      'offline',
      'Visits while the owner is offline',
      [...OFFLINE_VISITS.direction],
      [callout('provisional', 'Not finalized', OFFLINE_VISITS.unresolvedNote)],
    ),
    section(
      'reconnection',
      'Losing connection during a visit',
      ['If your connection briefly drops during a visit, the game aims to be forgiving:'],
      [list(VISIT_RECONNECTION.promises)],
    ),
    section(
      'fair-play',
      'Fair play in farm visits',
      ['Farm-visit abuse falls under the general fair-play rules. Prohibited behavior includes:'],
      [
        list(FARM_VISIT_ABUSE),
        links([
          {
            label: 'Fair play',
            href: '/docs/fair-play',
            description: 'The full fair-play principles',
          },
          {
            label: 'Time and UTC',
            href: '/docs/utc',
            description: 'How UTC daily resets work',
          },
        ]),
      ],
    ),
  ],
});

export const npcSellingPage = definePage({
  slug: 'npc-selling',
  availability: 'npc-selling',
  route: '/docs/npc-selling',
  title: 'NPC selling',
  eyebrow: 'Capped COPPER source',
  description:
    'Why NPC selling is intentionally limited, and the provisional daily and weekly COPPER caps.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['npc', 'selling', 'caps', 'daily cap', 'weekly cap', 'COPPER'],
  related: ['copper', 'copper-exchange', 'economy'],
  content: [
    section(
      'why-limited',
      'Why NPC selling is limited',
      [
        ECONOMY_NOTES.copperScarce,
        'If NPCs bought unlimited goods, COPPER would inflate and player-to-player trade would lose meaning. Caps keep the Copper Exchange and Auction House at the heart of the economy.',
        ECONOMY_NOTES.npcCapsAccountWide,
      ],
      [
        table(
          'Provisional NPC COPPER caps (account-wide)',
          ['Levels', 'Daily cap', 'Weekly cap'],
          LEVEL_TIERS.map((t) => [
            `${t.minLevel}–${t.maxLevel}`,
            `${t.dailyNpcCap} COPPER`,
            `${t.weeklyNpcCap} COPPER`,
          ]),
        ),
        interactive('npc-cap-calculator'),
        callout('provisional', 'Subject to balancing', ECONOMY_NOTES.provisionalLabel),
        callout('rule', 'UTC resets', 'Daily and weekly NPC selling caps reset on a UTC schedule.'),
      ],
    ),
  ],
});

export const playerTradingPage = definePage({
  slug: 'player-trading',
  availability: 'player-trading',
  route: '/docs/player-trading',
  title: 'Player trading',
  eyebrow: 'Player to player',
  description:
    'How value moves between players, and how direct trading relates to the Auction House.',
  section: 'Economy',
  audience: 'Players',
  keywords: ['trading', 'trade', 'player to player', 'market'],
  related: ['auction-house', 'copper-exchange', 'inventory'],
  content: [
    section(
      'how',
      'Trading between players',
      [
        'Player trading is how materials, crafted goods, and eligible items circulate between people rather than disappearing into NPC sinks.',
        'The Auction House is the structured marketplace with its exact 10% tax. Exact rules for any direct peer-to-peer exchange are documented when confirmed.',
      ],
      [
        interactive('market-comparison'),
        callout(
          'tip',
          'Which system to use',
          'Use the Auction House for open listings; the Copper Exchange is the planned primary pathway for meaningful COPPER circulation.',
        ),
        callout(
          'safety',
          'Stay inside the game',
          'Trades arranged outside official game systems are not protected. Never send tokens or assets to strangers on the promise of an in-game return.',
        ),
      ],
    ),
  ],
});

export const catPersonalityPage = definePage({
  slug: 'cat-personality',
  availability: 'cat-companion',
  route: '/docs/cat-personality',
  title: 'Cat Personality',
  eyebrow: 'Identity',
  description:
    'Personality gives your permanent cat identity and a small passive effect, separate from Battle Class.',
  section: 'Your Cat',
  audience: 'Players',
  keywords: ['personality', 'cat identity', 'passive effect'],
  related: ['cat', 'cat-battle/classes', 'cat-dice'],
  content: [
    section(
      'what',
      'What Personality is',
      [
        'Every permanent cat has a Personality. It represents who your cat is, not how it fights.',
        'Personality provides a small passive effect. Exact personality names, effects, and values are documented when confirmed.',
      ],
      [
        list([
          'Represents identity and flavor',
          'Provides a small passive effect',
          'Completely separate from Battle Class',
          'Does not change Cat Dice odds',
        ]),
        callout(
          'rule',
          'Two separate systems',
          'Personality is identity with a small passive effect. Battle Class is the combat role chosen when Cat Battle unlocks.',
        ),
      ],
    ),
  ],
});

export const tournamentsRefundsPage = definePage({
  slug: 'tournaments/refunds',
  availability: 'tournaments-community',
  route: '/docs/tournaments/refunds',
  title: 'Tournament refunds',
  eyebrow: 'When fees return',
  description: 'Exactly when tournament entrance fees are refunded, and when they are not.',
  section: 'Tournaments',
  audience: 'Competitive players',
  keywords: ['refunds', 'cancellation', 'entrance fee', 'minimum players'],
  related: ['tournaments/registration', 'tournaments/rewards', 'tournaments/community'],
  content: [
    section(
      'refunded',
      'When fees are refunded',
      [
        'Refunds protect players from events that cannot run as promised. They are not a way to undo a losing result.',
      ],
      [
        list(REFUND_CONDITIONS.community.map((r) => `Community Tournament: ${r}`)),
        list(REFUND_CONDITIONS.official.map((r) => `Official Sponsored Tournament: ${r}`)),
        callout(
          'rule',
          'Below-minimum rule',
          'If fewer than two players join a Community Tournament, every registered player receives a full refund.',
        ),
      ],
    ),
    section(
      'not-refunded',
      'What is not refunded',
      ['Once a tournament runs as configured, its results stand.'],
      [
        list(REFUND_CONDITIONS.notAutomatic.map((r) => `Not automatic: ${r}`)),
        callout(
          'rule',
          'UTC deadlines',
          'Registration deadlines are stated in UTC. Changing your mind after the deadline does not qualify for a refund.',
        ),
      ],
    ),
  ],
});

export const DOCUMENTATION_PAGES = [
  gettingStartedPage,
  gameplayOverviewPage,
  walletAccessPage,
  firstDayPage,
  playerProgressionPage,
  worldAndActivitiesPage,
  farmingPage,
  animalsPage,
  animalProgressionPage,
  materialsPage,
  fishingPage,
  miningPage,
  woodcuttingPage,
  cookingPage,
  craftingPage,
  housingPage,
  explorationPage,
  socialPage,
  farmVisitsPage,
  inventoryPage,
  economyPage,
  copperPage,
  fablePage,
  copperExchangePage,
  npcSellingPage,
  auctionHousePage,
  playerTradingPage,
  catsPage,
  catPersonalityPage,
  catDicePage,
  catBattlePage,
  catBattleClassesPage,
  catBattleStatsPage,
  catBattleEnergyPage,
  catBattleSkillsPage,
  catBattleStatusPage,
  catBattlePowerPage,
  catBattleEquipmentPage,
  catBattleMatchmakingPage,
  catBattleWagersPage,
  tournamentsPage,
  tournamentsCommunityPage,
  tournamentsOfficialPage,
  tournamentsRegistrationPage,
  tournamentsRewardsPage,
  tournamentsRefundsPage,
  timeUtcPage,
  fairPlayPage,
  securityPage,
  faqPage,
  glossaryPage,
] as const satisfies readonly DocumentationPage[];

export const DOCUMENTATION_SECTIONS = [
  'Getting Started',
  'Cozy World',
  'Economy',
  'Your Cat',
  'Cat Battle',
  'Tournaments',
  'Rules and Support',
] as const satisfies readonly DocumentationSection[];

export function getDocumentationPage(slug: string): DocumentationPage | undefined {
  return DOCUMENTATION_PAGES.find((page) => page.slug === slug);
}

export function getDocumentationPageByRoute(route: string): DocumentationPage | undefined {
  return DOCUMENTATION_PAGES.find((page) => page.route === route);
}

export function getRelatedDocumentationPages(
  page: DocumentationPage,
): readonly DocumentationPage[] {
  return page.related
    .map((slug) => getDocumentationPage(slug))
    .filter((entry): entry is DocumentationPage => entry !== undefined);
}

export function getDocumentationNeighbors(page: DocumentationPage): {
  readonly previous: DocumentationPage | undefined;
  readonly next: DocumentationPage | undefined;
} {
  const index = DOCUMENTATION_PAGES.findIndex((entry) => entry.slug === page.slug);
  if (index < 0) return { previous: undefined, next: undefined };
  return {
    previous: DOCUMENTATION_PAGES[index - 1],
    next: DOCUMENTATION_PAGES[index + 1],
  };
}

export const DOCUMENTATION_ROUTES = [
  '/docs',
  '/how-to-play',
  ...DOCUMENTATION_PAGES.map((page) => page.route),
] as const;
