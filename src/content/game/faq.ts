export interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly relatedRoutes?: readonly string[];
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'what-is-fablesol',
    question: 'What is the game?',
    answer:
      'Fablesol is a cozy multiplayer 2D top-down pixel-art animal farming game with social systems, a player economy, a permanent cat companion, Cat Dice, Cat Battle, and tournaments. Philosophy: cozy first, competitive second.',
    relatedRoutes: ['/docs/game-overview', '/how-to-play'],
  },
  {
    id: 'free-to-enter',
    question: 'Is the game free to enter?',
    answer:
      'Entering requires connecting a Solana wallet and holding at least 10,000 $FABLE. There is no email/password “free account” path documented as an alternative access method.',
    relatedRoutes: ['/docs/access', '/docs/fable'],
  },
  {
    id: 'why-10000-fable',
    question: 'Why is 10,000 $FABLE required?',
    answer:
      'The holding requirement is the game’s access gate. It verifies on-chain ownership of $FABLE before you enter the off-chain gameplay systems. It is not a purchase of COPPER and does not guarantee income.',
    relatedRoutes: ['/docs/access', '/docs/fable'],
  },
  {
    id: 'is-copper-crypto',
    question: 'Is COPPER a cryptocurrency?',
    answer:
      'No. COPPER is the off-chain in-game currency. It is not a blockchain token and should not be described as cryptocurrency.',
    relatedRoutes: ['/docs/copper', '/docs/economy'],
  },
  {
    id: 'infinite-npc-copper',
    question: 'Can COPPER be infinitely farmed from NPCs?',
    answer:
      'No. NPC COPPER generation is intentionally limited with account-wide daily and weekly caps that reset using UTC. The Copper Exchange is intended as the main meaningful COPPER source.',
    relatedRoutes: ['/docs/copper', '/docs/copper-exchange'],
  },
  {
    id: 'what-is-copper-exchange',
    question: 'What is the Copper Exchange?',
    answer:
      'The Copper Exchange is the primary intended pathway for meaningful COPPER circulation among players. Exact matching formulas, fees, and rates are only documented when confirmed by product configuration.',
    relatedRoutes: ['/docs/copper-exchange'],
  },
  {
    id: 'auction-tax',
    question: 'What is the Auction House tax?',
    answer:
      'Exactly 10%. If an item sells for 1,000 COPPER, tax is 100 COPPER and the seller receives 900 COPPER.',
    relatedRoutes: ['/docs/auction-house'],
  },
  {
    id: 'which-animals',
    question: 'What animals are available?',
    answer: 'Five core farm animals: Cow, Pig, Horse, Chicken, and Goat.',
    relatedRoutes: ['/docs/animals'],
  },
  {
    id: 'animal-materials',
    question: 'What does each animal produce?',
    answer: 'Cow → Milk, Pig → Meat, Horse → Leather, Chicken → Eggs, Goat → Goat Wool.',
    relatedRoutes: ['/docs/animals', '/docs/materials'],
  },
  {
    id: 'material-rarities',
    question: 'How do material rarities work?',
    answer:
      'Seven rarities from Common through Divine. Default progression rises with animal level bands (for example levels 1–10 Common, 41–45 Legendary, 46–49 Mythic).',
    relatedRoutes: ['/docs/materials'],
  },
  {
    id: 'level-50',
    question: 'What happens at animal level 50?',
    answer:
      'Level 50 normally produces Mythic material, with a 1% chance to produce Divine material. Visual transformation milestones occur every 10 levels without resetting the animal.',
    relatedRoutes: ['/docs/animal-progression', '/docs/materials'],
  },
  {
    id: 'divine-guaranteed',
    question: 'Is Divine material guaranteed?',
    answer: 'No. At level 50, Divine is a 1% chance. Mythic remains the normal result.',
    relatedRoutes: ['/docs/materials'],
  },
  {
    id: 'how-many-cats',
    question: 'How many cats does a player have?',
    answer:
      'One permanent cat companion. The cat is a long-term identity companion, not a disposable unit.',
    relatedRoutes: ['/docs/cat'],
  },
  {
    id: 'dice-level-odds',
    question: 'Does cat level improve Cat Dice odds?',
    answer: 'No. Cat level does not affect Cat Dice probability.',
    relatedRoutes: ['/docs/cat-dice'],
  },
  {
    id: 'dice-vs-battle',
    question: 'Is Cat Dice the same as Cat Battle?',
    answer:
      'No. Cat Dice is casual and luck-based. Cat Battle is strategic turn-based combat. They use separate balance, matchmaking, and rewards.',
    relatedRoutes: ['/docs/cat-dice', '/docs/cat-battle'],
  },
  {
    id: 'battle-realtime',
    question: 'Is Cat Battle real time?',
    answer:
      'No. Cat Battle is turn-based with one action per turn and a 30-second action timer. Target match length is about 2–4 minutes.',
    relatedRoutes: ['/docs/cat-battle'],
  },
  {
    id: 'best-of-one',
    question: 'Is Cat Battle Best-of-1?',
    answer: 'Yes. Matches are Best-of-1, not Best-of-3.',
    relatedRoutes: ['/docs/cat-battle'],
  },
  {
    id: 'battle-power',
    question: 'What is Battle Power?',
    answer:
      'Battle Power summarizes build and progression strength from cat level, stats, skills, equipment, and passives. It is used for matchmaking similarity searches.',
    relatedRoutes: ['/docs/cat-battle/battle-power'],
  },
  {
    id: 'bp-wins',
    question: 'Does winning increase Battle Power?',
    answer:
      'No. Winning or losing does not directly change Battle Power. Only progression or build changes affect it.',
    relatedRoutes: ['/docs/cat-battle/battle-power'],
  },
  {
    id: 'matchmaking-expand',
    question: 'How does matchmaking expand?',
    answer:
      'Search starts at ±5% Battle Power, expands to ±8% after 20 seconds, then ±10% after 40 seconds. Wagered matches never exceed ±12%.',
    relatedRoutes: ['/docs/cat-battle/matchmaking'],
  },
  {
    id: 'equipment-slots',
    question: 'What equipment slots exist?',
    answer: 'Exactly three combat slots: Weapon, Armor, and Accessory.',
    relatedRoutes: ['/docs/cat-battle/equipment'],
  },
  {
    id: 'equipment-gacha',
    question: 'Is there equipment gacha?',
    answer:
      'No. Equipment is presented as acquire-or-craft progression through bosses, tournaments, chests, crafting, and player trading, not paid loot boxes or gacha equipment.',
    relatedRoutes: ['/docs/cat-battle/equipment'],
  },
  {
    id: 'skills-after-mm',
    question: 'Can skills be changed after matchmaking?',
    answer:
      'No. Skills cannot be changed after matchmaking or battle entry. Builds lock when the match is ready.',
    relatedRoutes: ['/docs/cat-battle/skills'],
  },
  {
    id: 'five-classes',
    question: 'What are the five Battle Classes?',
    answer: 'Fighter, Tank, Assassin, Support, and Controller.',
    relatedRoutes: ['/docs/cat-battle/classes'],
  },
  {
    id: 'five-statuses',
    question: 'What are the five status effects?',
    answer: 'Heal, Shield, Bleed, Stun, and Weaken.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'community-prize-funding',
    question: 'How do Community Tournaments fund prizes?',
    answer:
      'They are player-funded. 100% of COPPER entrance fees form the prize pool. Minimum two players; otherwise registrants are refunded.',
    relatedRoutes: ['/docs/tournaments/community', '/docs/tournaments/rewards'],
  },
  {
    id: 'dev-cut',
    question: 'Does the developer take a tournament cut?',
    answer: 'No. Community tournaments have no tournament tax, burn, or developer cut.',
    relatedRoutes: ['/docs/tournaments/community'],
  },
  {
    id: 'when-refunds',
    question: 'When are tournament fees refunded?',
    answer:
      'Community: fewer than two players, cancellation, or qualifying system failure. Official: cancellation, minimum participants not reached, or qualifying system failure. Losses and missed matches are not automatic refunds.',
    relatedRoutes: ['/docs/tournaments/rewards'],
  },
  {
    id: 'official-difference',
    question: 'How do Official Sponsored Tournaments differ?',
    answer:
      'They may use a lower COPPER entrance fee where configured, still put collected COPPER into rewards, and may add sponsored rewards such as $FABLE, cosmetics, or titles. $FABLE is not promised in every official event.',
    relatedRoutes: ['/docs/tournaments/official'],
  },
  {
    id: 'local-time',
    question: 'Are tournament times displayed locally?',
    answer:
      'Official schedules are displayed in UTC. Players may convert privately, but UTC remains the authoritative official time.',
    relatedRoutes: ['/docs/utc'],
  },
  {
    id: 'multi-wallet',
    question: 'Can a player have multiple wallets or accounts?',
    answer:
      'Multiple accounts or wallets are not automatically forbidden. Using them to exploit rewards, manipulate matches, or evade rules is prohibited.',
    relatedRoutes: ['/docs/fair-play'],
  },
  {
    id: 'exploitation',
    question: 'What behavior is considered exploitation?',
    answer:
      'Examples include rule-breaking bots, match manipulation, coordinated self-dealing, refund abuse, multi-account reward farming, client manipulation, asset duplication attempts, market manipulation, harassment, and circumventing enforcement.',
    relatedRoutes: ['/docs/fair-play'],
  },
  {
    id: 'guaranteed-income',
    question: 'Is gameplay or token ownership guaranteed to produce income?',
    answer:
      'No. Digital asset values can change. Gameplay and token ownership are not presented as guaranteed financial opportunities.',
    relatedRoutes: ['/docs/fable', '/docs/security'],
  },
  {
    id: 'farm-visits-possible',
    question: 'Can other players visit my farm?',
    answer:
      'Yes. Personal farm visits are an approved Planned feature. You will choose a visibility setting: Public, Friends Only, Invite Only, or Private. Farm visits are not available in the current game build.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'farm-visits-realtime',
    question: 'Will I see visitors in real time?',
    answer:
      'Yes. When farm visits ship (Planned), owners see visitors arrive live, and everyone in the farm sees movement, emotes, sitting, petting, and helper actions as they happen.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'farm-visits-see-each-other',
    question: 'Can visitors see one another?',
    answer:
      'Yes. Everyone in the same farm instance will see all other players there, the owner and every visitor, including positions, walking direction, and animations.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'farm-visits-capacity',
    question: 'How many visitors can enter at once?',
    answer:
      'Up to 10 visitors at the same time. The owner does not count as a visitor, so one farm instance holds at most 11 players. Daily sightseeing visits are unlimited.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'farm-visits-collect-materials',
    question: 'Can visitors collect my animals’ materials?',
    answer:
      'No, never. Visitors cannot collect Milk, Meat, Leather, Eggs, or Goat Wool, and cannot claim any production. Only the owner can collect from or economically benefit from the farm.',
    relatedRoutes: ['/docs/farm-visits', '/docs/animals'],
  },
  {
    id: 'farm-visits-harvest-crops',
    question: 'Can visitors harvest my crops?',
    answer:
      'No. Visitors can never harvest crops for themselves or claim production. With Allow Helpers enabled, a visitor may at most water one approved crop as a validated care action.',
    relatedRoutes: ['/docs/farm-visits', '/docs/farming'],
  },
  {
    id: 'farm-visits-barn',
    question: 'Can visitors enter my barn?',
    answer:
      'Visitors may enjoy the public showcase area: showcase animals, trophies, achievements, guest seating, and photo areas. Private owner areas such as storage, management, and unclaimed resources stay closed in every mode.',
    relatedRoutes: ['/docs/farm-visits', '/docs/housing'],
  },
  {
    id: 'farm-visits-help',
    question: 'Can visitors help with farm tasks?',
    answer:
      'Only if the owner selects Allow Helpers. Helpers may perform small approved actions such as watering one crop or brushing one animal, within daily Community Care limits.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'community-care-farm-cap',
    question: 'How many Community Care contributions can my farm receive?',
    answer:
      'A farm can receive at most 5 valid Community Care contributions per UTC day, and each must come from a different player. Social visits remain welcome after 5/5.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'community-care-repeat',
    question: 'Can one player repeatedly help the same farm?',
    answer:
      'One player can contribute valid care to the same farm only once per UTC day, and can validly help at most 5 different farms per UTC day. Repeat visits are welcome but add no extra care.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'community-care-divine',
    question: 'Can helping increase Divine material chances?',
    answer:
      'No. Community Care never improves material rarity or the 1% Divine chance. It only adds a small provisional Animal Care progress benefit, at most 5% per farm per UTC day.',
    relatedRoutes: ['/docs/farm-visits', '/docs/animal-progression'],
  },
  {
    id: 'community-care-copper',
    question: 'Can helping generate COPPER?',
    answer:
      'No. Community Care provides a small social assistance benefit, but it does not create currency, valuable materials, or rare production.',
    relatedRoutes: ['/docs/farm-visits', '/docs/copper'],
  },
  {
    id: 'farm-visits-offline',
    question: 'Can players visit while the owner is offline?',
    answer:
      'That is the intended direction: a farm may remain visitable offline when its visibility permits, limited to public areas and permitted social interactions. Offline helper details are subject to future implementation and balancing.',
    relatedRoutes: ['/docs/farm-visits'],
  },
  {
    id: 'farm-visits-private',
    question: 'Can I make my farm private?',
    answer:
      'Yes. The Private visibility setting means only you may enter unless a future explicit exception is approved. Friends Only and Invite Only offer middle grounds.',
    relatedRoutes: ['/docs/farm-visits'],
  },
] as const;
