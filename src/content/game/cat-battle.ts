/**
 * Cat companion, Cat Dice, and Cat Battle systems.
 */

export const CAT_COMPANION = {
  permanentCount: 1,
  identity: [
    'A long-term companion',
    'Part of the player’s identity',
    'Connected to casual activities',
    'Connected to Cat Dice',
    'Connected to Cat Battle',
    'Progresses over time',
  ],
  hasPersonality: true,
  hasBattleClass: true,
  notIncluded: [
    'Cat breeding',
    'Cat burning',
    'Rental cats',
    'Disposable battle units',
    'Gacha acquisition of additional permanent cats',
  ],
} as const;

export const CAT_DICE = {
  nature: 'Casual luck-based activity',
  separateFromBattle: true,
  levelAffectsOdds: false,
  keyRule: 'Cat level does not affect Cat Dice probability.',
  notSkillBasedCombat: true,
} as const;

export const CAT_BATTLE = {
  format: 'Best-of-1',
  style: 'Turn-based strategic combat',
  actionsPerTurn: 1,
  turnTimerSeconds: 30,
  targetMatchMinutes: { min: 2, max: 4 },
  serverAuthoritative: true,
  deterministic: true,
  speedDeterminesFirst: true,
  mobileFriendly: true,
  philosophy:
    'Easy to learn, hard to master — strategic without esports-level mechanical complexity.',
} as const;

export const BATTLE_STATS = [
  {
    id: 'hp',
    name: 'HP',
    description: 'How much damage the cat can withstand before losing the battle.',
  },
  {
    id: 'attack',
    name: 'Attack',
    description: 'Influences offensive strength of damaging actions.',
  },
  {
    id: 'defense',
    name: 'Defense',
    description: 'Reduces or mitigates incoming damage according to the battle formula.',
  },
  {
    id: 'speed',
    name: 'Speed',
    description: 'Determines who acts first and any other confirmed speed ordering behavior.',
  },
  {
    id: 'energy',
    name: 'Energy',
    description: 'Resource spent on active skills and the Ultimate.',
  },
] as const;

/** Luck is not a permanent core stat. */
export const HAS_PERMANENT_LUCK_STAT = false;

export const ENERGY = {
  starting: 50,
  maximum: 100,
  gainAfterAction: 15,
  basicAttackCost: 0,
  normalSkillCostRange: { min: 25, max: 40 },
  ultimateCostRange: { min: 70, max: 100 },
  exampleActiveSkillCost: 30,
  exampleUltimateCost: 85,
} as const;

export function applyEnergyAfterAction(
  current: number,
  skillCost: number,
): {
  before: number;
  cost: number;
  afterSpend: number;
  afterGain: number;
  capped: boolean;
  canAfford: boolean;
} {
  const before = Math.min(ENERGY.maximum, Math.max(0, current));
  const cost = Math.max(0, skillCost);
  const canAfford = before >= cost;
  if (!canAfford) {
    return {
      before,
      cost,
      afterSpend: before,
      afterGain: before,
      capped: false,
      canAfford: false,
    };
  }
  const afterSpend = before - cost;
  const uncapped = afterSpend + ENERGY.gainAfterAction;
  const afterGain = Math.min(ENERGY.maximum, uncapped);
  return {
    before,
    cost,
    afterSpend,
    afterGain,
    capped: uncapped > ENERGY.maximum,
    canAfford: true,
  };
}

export const BATTLE_CLASSES = [
  {
    id: 'fighter',
    name: 'Fighter',
    role: 'Balanced sustained damage',
    strengths: ['Medium durability', 'Attack buffs', 'Guard break tools', 'Counter options'],
    tradeoffs: ['Not the tankiest', 'Not the fastest burst'],
    statEmphasis: ['Attack', 'HP', 'Defense'],
    playstyle: 'Consistent pressure with flexible mid-fight tools.',
    softCounters: 'Pressures Controller',
    softCounteredBy: 'Support can outlast sustained pressure',
  },
  {
    id: 'tank',
    name: 'Tank',
    role: 'Frontline durability',
    strengths: ['Highest HP and Defense', 'Shields', 'Damage reduction', 'Reflect or punish tools'],
    tradeoffs: ['Lower damage output'],
    statEmphasis: ['HP', 'Defense'],
    playstyle: 'Absorb pressure, protect tempo, punish overcommitment.',
    softCounters: 'Survives Assassin burst windows',
    softCounteredBy: 'Controller disrupts tank setups',
  },
  {
    id: 'assassin',
    name: 'Assassin',
    role: 'Burst damage',
    strengths: ['Highest Speed', 'Burst damage', 'Armor penetration', 'Execute-style tools'],
    tradeoffs: ['Low durability'],
    statEmphasis: ['Speed', 'Attack'],
    playstyle: 'Strike first, finish fragile targets, avoid prolonged trades.',
    softCounters: 'Bursts Support',
    softCounteredBy: 'Tank can survive the opening burst',
  },
  {
    id: 'support',
    name: 'Support',
    role: 'Sustain and protection',
    strengths: ['Healing', 'Shields', 'Buffs', 'Cleanse'],
    tradeoffs: ['Lower damage'],
    statEmphasis: ['HP', 'Energy efficiency themes'],
    playstyle: 'Extend fights, stabilize, and outlast pressure.',
    softCounters: 'Outlasts Fighter',
    softCounteredBy: 'Assassin burst can overwhelm sustain windows',
  },
  {
    id: 'controller',
    name: 'Controller',
    role: 'Tempo and disruption',
    strengths: ['Slows', 'Debuffs', 'Tempo control', 'Medium durability'],
    tradeoffs: ['Not pure burst', 'Not pure tank'],
    statEmphasis: ['Speed', 'Defense', 'Utility'],
    playstyle: 'Shape the pace of battle and deny clean opponent plans.',
    softCounters: 'Disrupts Tank',
    softCounteredBy: 'Fighter pressures Controller',
  },
] as const;

export type BattleClassId = (typeof BATTLE_CLASSES)[number]['id'];

/** Soft strategic relationships — not automatic wins or fixed damage bonuses. */
export const CLASS_SOFT_COUNTERS = [
  { from: 'Fighter', to: 'Controller', note: 'Fighter pressures Controller' },
  { from: 'Controller', to: 'Tank', note: 'Controller disrupts Tank' },
  { from: 'Tank', to: 'Assassin', note: 'Tank survives Assassin' },
  { from: 'Assassin', to: 'Support', note: 'Assassin bursts Support' },
  { from: 'Support', to: 'Fighter', note: 'Support outlasts Fighter' },
] as const;

export const STATUS_EFFECTS = [
  {
    id: 'heal',
    name: 'Heal',
    description: 'Restores HP.',
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Absorbs or protects against damage according to the implemented rules.',
  },
  {
    id: 'bleed',
    name: 'Bleed',
    description: 'Causes damaging pressure over its defined duration.',
  },
  {
    id: 'stun',
    name: 'Stun',
    description: 'Prevents an action according to the implemented duration and rules.',
  },
  {
    id: 'weaken',
    name: 'Weaken',
    description: 'Reduces combat effectiveness according to the implemented rules.',
  },
] as const;

export const SKILL_LOADOUT = {
  basicAttack: 1,
  equippedActiveSkills: 2,
  ultimate: 1,
  passive: 1,
  cannotChangeAfterMatchmaking: true,
  classSkillPoolApprox: 6,
  unlocks: [
    { level: 1, unlock: 'Basic Attack' },
    { level: 5, unlock: 'Active Skill 1' },
    { level: 10, unlock: 'Passive' },
    { level: 20, unlock: 'Active Skill 2' },
    { level: 30, unlock: 'Ultimate' },
    { level: '40–50', unlock: 'Skill upgrades or specialization' },
  ],
  costs: {
    basicAttack: 0,
    activeSkill1Typical: '25–30 Energy',
    activeSkill2Typical: '35–45 Energy, may include a 1–2 turn cooldown',
    ultimateTypical: '80–100 Energy, normally once per battle',
    passive: 'Always active',
  },
} as const;

export const BATTLE_POWER = {
  definition:
    'Battle Power summarizes build and progression strength for matchmaking similarity searches.',
  contributors: ['Cat level', 'Core stats', 'Skill upgrades', 'Equipment', 'Passive bonuses'],
  winsDoNotChange: true,
  notMmr: true,
  note: 'Winning or losing does not directly change Battle Power. Only progression or build changes affect it. Battle Power is not proof that two players have identical skill.',
} as const;

export const MATCHMAKING = {
  sameLevelTier: true,
  initialRangePercent: 5,
  expansion: [
    { atSeconds: 0, rangePercent: 5 },
    { atSeconds: 20, rangePercent: 8 },
    { atSeconds: 40, rangePercent: 10 },
  ],
  wageredMaxRangePercent: 12,
  noHiddenMmr: true,
  noGuaranteedInstantMatch: true,
} as const;

export const EQUIPMENT_SLOTS = [
  {
    id: 'weapon',
    name: 'Weapon',
    role: 'Primarily supports offensive strength or class-appropriate offense.',
  },
  {
    id: 'armor',
    name: 'Armor',
    role: 'Primarily supports HP and Defense.',
  },
  {
    id: 'accessory',
    name: 'Accessory',
    role: 'Provides a smaller specialized bonus such as Speed, Energy, or a modest class-related effect.',
  },
] as const;

export const EQUIPMENT_RULES = {
  slots: 3,
  contributesToBattlePower: true,
  acquisition: [
    'Bosses',
    'Tournaments',
    'Treasure chests',
    'Crafting',
    'Auction House or player trading',
  ],
  notIncluded: [
    'Gacha equipment',
    'Paid loot boxes',
    'Pay-to-win equipment purchases',
    'Helmets as a separate slot',
    'Gloves',
    'Boots',
    'Multiple ring slots',
    'Necklace as another slot',
    'Gems / sockets',
    'Enchanting / reforging / awakening',
    'Random hidden affixes systems as core loop',
    '+1 to +15 enhancement ladders',
    'Durability repair systems',
  ],
  progressionNote:
    'Equipment progression is based on acquiring or crafting a better item rather than endlessly enhancing one item.',
  itemFields: [
    'Name',
    'Rarity',
    'Required Cat Level',
    'Battle Power',
    'Main Stat',
    'Sell value when applicable',
  ],
  rarityLabelsMayMatchMaterials:
    'Equipment may use the same seven rarity labels as materials without sharing identical acquisition rules.',
} as const;

export const BATTLE_FLOW = [
  'Match found',
  'Builds locked',
  'Speed determines first action',
  'Player chooses one action',
  'Energy and effects update',
  'Opponent takes a turn',
  'Continue until one cat wins',
] as const;
