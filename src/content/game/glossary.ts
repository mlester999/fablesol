export interface GlossaryTerm {
  readonly id: string;
  readonly term: string;
  readonly definition: string;
  readonly relatedRoutes?: readonly string[];
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    id: 'fable',
    term: '$FABLE',
    definition:
      'Fablesol’s on-chain Solana token. Holding at least 10,000 $FABLE is required for game access. It is separate from off-chain COPPER.',
    relatedRoutes: ['/docs/fable', '/docs/access'],
  },
  {
    id: 'copper',
    term: 'COPPER',
    definition:
      'The primary off-chain in-game currency. COPPER is not a blockchain token or cryptocurrency.',
    relatedRoutes: ['/docs/copper', '/docs/economy'],
  },
  {
    id: 'off-chain',
    term: 'Off-chain',
    definition:
      'Systems that run inside the game service rather than as blockchain token transfers — for example COPPER balances and most cozy gameplay.',
    relatedRoutes: ['/docs/economy'],
  },
  {
    id: 'on-chain',
    term: 'On-chain',
    definition:
      'Actions and assets recorded on the Solana blockchain, such as $FABLE token ownership in a wallet.',
    relatedRoutes: ['/docs/fable', '/docs/access'],
  },
  {
    id: 'solana',
    term: 'Solana',
    definition: 'The blockchain network used for $FABLE and wallet-based game access.',
    relatedRoutes: ['/docs/access'],
  },
  {
    id: 'wallet',
    term: 'Wallet',
    definition:
      'A player-controlled Solana wallet used to hold $FABLE and meet the game access requirement. Fablesol never asks for seed phrases.',
    relatedRoutes: ['/docs/access', '/docs/security'],
  },
  {
    id: 'token-access',
    term: 'Access requirement',
    definition: 'Players must hold at least 10,000 $FABLE to meet the game access requirement.',
    relatedRoutes: ['/docs/access', '/docs/fable'],
  },
  {
    id: 'copper-exchange',
    term: 'Copper Exchange',
    definition:
      'The primary intended pathway for meaningful COPPER circulation among players. Exact order formulas are only documented when confirmed.',
    relatedRoutes: ['/docs/copper-exchange'],
  },
  {
    id: 'auction-house',
    term: 'Auction House',
    definition: 'Player-driven marketplace for eligible item listings and purchases.',
    relatedRoutes: ['/docs/auction-house'],
  },
  {
    id: 'auction-house-tax',
    term: 'Auction House tax',
    definition:
      'Exactly 10% of the sale price. The seller receives the remaining amount after tax.',
    relatedRoutes: ['/docs/auction-house'],
  },
  {
    id: 'animal-level',
    term: 'Animal level',
    definition:
      'Each farm animal progresses from level 1 to level 50, improving material rarity along the way.',
    relatedRoutes: ['/docs/animal-progression'],
  },
  {
    id: 'transformation-milestone',
    term: 'Transformation milestone',
    definition:
      'Visual advancement milestones every 10 levels. The same animal becomes more advanced visually; it does not reset.',
    relatedRoutes: ['/docs/animal-progression', '/docs/animals'],
  },
  {
    id: 'material-rarity',
    term: 'Material rarity',
    definition:
      'Seven rarities: Common, Uncommon, Rare, Epic, Legendary, Mythic, and Divine. Rarity rises with animal level.',
    relatedRoutes: ['/docs/materials'],
  },
  {
    id: 'divine-material',
    term: 'Divine material',
    definition:
      'The highest material rarity. At animal level 50, Divine has a 1% chance; Mythic remains the normal result.',
    relatedRoutes: ['/docs/materials'],
  },
  {
    id: 'permanent-cat',
    term: 'Permanent cat',
    definition:
      'Each player has one permanent cat companion tied to identity, casual play, Cat Dice, and Cat Battle.',
    relatedRoutes: ['/docs/cat'],
  },
  {
    id: 'cat-personality',
    term: 'Cat Personality',
    definition:
      'An identity trait with a small passive effect. Personality is separate from Battle Class.',
    relatedRoutes: ['/docs/cat'],
  },
  {
    id: 'battle-class',
    term: 'Battle Class',
    definition:
      'Combat role selected when Cat Battle unlocks: Fighter, Tank, Assassin, Support, or Controller. Permanent under normal conditions.',
    relatedRoutes: ['/docs/cat-battle/classes'],
  },
  {
    id: 'cat-dice',
    term: 'Cat Dice',
    definition:
      'A casual luck-based activity completely separate from Cat Battle. Cat level does not affect dice probability.',
    relatedRoutes: ['/docs/cat-dice'],
  },
  {
    id: 'cat-battle',
    term: 'Cat Battle',
    definition:
      'Turn-based, Best-of-1 strategic combat between permanent cats, validated by the game, with a 30-second action timer.',
    relatedRoutes: ['/docs/cat-battle'],
  },
  {
    id: 'hp',
    term: 'HP',
    definition: 'Hit points — how much damage a cat can withstand in Cat Battle.',
    relatedRoutes: ['/docs/cat-battle/stats'],
  },
  {
    id: 'attack',
    term: 'Attack',
    definition: 'Core offensive stat influencing damage strength.',
    relatedRoutes: ['/docs/cat-battle/stats'],
  },
  {
    id: 'defense',
    term: 'Defense',
    definition: 'Core defensive stat that mitigates incoming damage according to battle rules.',
    relatedRoutes: ['/docs/cat-battle/stats'],
  },
  {
    id: 'speed',
    term: 'Speed',
    definition: 'Determines who acts first and other confirmed speed ordering behavior.',
    relatedRoutes: ['/docs/cat-battle/stats'],
  },
  {
    id: 'energy',
    term: 'Energy',
    definition:
      'Battle resource. Start at 50, maximum 100, gain 15 after each action. Skills cost Energy; Basic Attack costs 0.',
    relatedRoutes: ['/docs/cat-battle/energy'],
  },
  {
    id: 'basic-attack',
    term: 'Basic Attack',
    definition: 'Always-available attack that costs 0 Energy.',
    relatedRoutes: ['/docs/cat-battle/skills'],
  },
  {
    id: 'active-skill',
    term: 'Active Skill',
    definition:
      'Equipped combat skills. Each cat equips two Active Skills before battle; loadouts lock after matchmaking.',
    relatedRoutes: ['/docs/cat-battle/skills'],
  },
  {
    id: 'ultimate',
    term: 'Ultimate',
    definition:
      'High-cost powerful skill, typically 80–100 Energy and normally usable once per battle.',
    relatedRoutes: ['/docs/cat-battle/skills'],
  },
  {
    id: 'passive',
    term: 'Passive',
    definition: 'Always-active skill effect that does not need to be cast each turn.',
    relatedRoutes: ['/docs/cat-battle/skills'],
  },
  {
    id: 'heal',
    term: 'Heal',
    definition: 'Status effect that restores HP.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'shield',
    term: 'Shield',
    definition:
      'Status effect that absorbs or protects against damage according to implemented rules.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'bleed',
    term: 'Bleed',
    definition: 'Status effect that applies damaging pressure over its defined duration.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'stun',
    term: 'Stun',
    definition: 'Status effect that prevents an action according to duration and rules.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'weaken',
    term: 'Weaken',
    definition: 'Status effect that reduces combat effectiveness according to implemented rules.',
    relatedRoutes: ['/docs/cat-battle/status-effects'],
  },
  {
    id: 'battle-power',
    term: 'Battle Power',
    definition:
      'Build and progression strength used for matchmaking similarity. Wins and losses do not directly change Battle Power.',
    relatedRoutes: ['/docs/cat-battle/battle-power', '/docs/cat-battle/matchmaking'],
  },
  {
    id: 'community-tournament',
    term: 'Community Tournament',
    definition:
      'Player-funded tournament where 100% of COPPER entrance fees form the prize pool. No tax, burn, or developer cut.',
    relatedRoutes: ['/docs/tournaments/community'],
  },
  {
    id: 'official-sponsored-tournament',
    term: 'Official Sponsored Tournament',
    definition:
      'Official event that still puts collected COPPER into rewards and may add sponsored rewards such as $FABLE, cosmetics, or titles.',
    relatedRoutes: ['/docs/tournaments/official'],
  },
  {
    id: 'wager',
    term: 'Wager',
    definition:
      'Optional Cat Battle 1v1 stake. Both players stake the same COPPER amount; winner receives the full pot with no tax or burn.',
    relatedRoutes: ['/docs/cat-battle/wagers'],
  },
  {
    id: 'prize-pool',
    term: 'Prize pool',
    definition:
      'For Community Tournaments: number of entrants × entrance fee. 100% of fees form the COPPER pool.',
    relatedRoutes: ['/docs/tournaments/rewards'],
  },
  {
    id: 'utc',
    term: 'UTC',
    definition:
      'Coordinated Universal Time — the canonical timezone for all official game schedules and timestamps.',
    relatedRoutes: ['/docs/utc'],
  },
  {
    id: 'registration-deadline',
    term: 'Registration deadline',
    definition: 'The UTC timestamp after which tournament registration is no longer available.',
    relatedRoutes: ['/docs/tournaments/registration', '/docs/utc'],
  },
  {
    id: 'tournament-status',
    term: 'Tournament status',
    definition:
      'Lifecycle label such as Upcoming, Registration Open, Full, Starting Soon, Live, Completed, or Cancelled.',
    relatedRoutes: ['/docs/tournaments'],
  },
  {
    id: 'game-validated',
    term: 'Game-validated outcome',
    definition:
      'Critical outcomes — especially Cat Battle resolution — are validated by the game for fairness and consistency.',
    relatedRoutes: ['/docs/cat-battle', '/docs/security'],
  },
  {
    id: 'deterministic-combat',
    term: 'Deterministic combat',
    definition:
      'Given the same battle inputs, Cat Battle resolution produces consistent outcomes under the approved battle rules.',
    relatedRoutes: ['/docs/cat-battle'],
  },
] as const;
