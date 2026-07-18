/**
 * Farm animals, materials, levels, and rarity progression.
 * Consumed by docs, how-to-play, and interactive calculators.
 */

export const ANIMAL_MAX_LEVEL = 50 as const;
export const TRANSFORMATION_MILESTONE_INTERVAL = 10 as const;
export const DIVINE_CHANCE_AT_LEVEL_50 = 0.01 as const;

export const MATERIAL_RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
  'Divine',
] as const;

export type MaterialRarity = (typeof MATERIAL_RARITIES)[number];

export interface RarityRange {
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly rarity: MaterialRarity;
  readonly note?: string;
}

/** Default animal material progression by level. */
export const MATERIAL_RARITY_RANGES: readonly RarityRange[] = [
  { minLevel: 1, maxLevel: 10, rarity: 'Common' },
  { minLevel: 11, maxLevel: 20, rarity: 'Uncommon' },
  { minLevel: 21, maxLevel: 30, rarity: 'Rare' },
  { minLevel: 31, maxLevel: 40, rarity: 'Epic' },
  { minLevel: 41, maxLevel: 45, rarity: 'Legendary' },
  { minLevel: 46, maxLevel: 49, rarity: 'Mythic' },
  {
    minLevel: 50,
    maxLevel: 50,
    rarity: 'Mythic',
    note: 'At level 50 the normal result remains Mythic, with a 1% chance to produce Divine material. Divine is not guaranteed.',
  },
] as const;

export const ANIMALS = [
  {
    id: 'cow',
    name: 'Cow',
    material: 'Milk',
    materialPlural: 'Milk',
    emoji: '🐄',
    summary: 'Produces Milk that grows rarer as the cow levels up.',
    personality: 'Steady and reliable — a cornerstone of every cozy farm.',
  },
  {
    id: 'pig',
    name: 'Pig',
    material: 'Meat',
    materialPlural: 'Meat',
    emoji: '🐷',
    summary: 'Produces Meat used across cooking and trading loops.',
    personality: 'Curious foragers that thrive with consistent care.',
  },
  {
    id: 'horse',
    name: 'Horse',
    material: 'Leather',
    materialPlural: 'Leather',
    emoji: '🐴',
    summary: 'Produces Leather for crafting and player market demand.',
    personality: 'Proud companions that grow more impressive at each milestone.',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    material: 'Eggs',
    materialPlural: 'Eggs',
    emoji: '🐔',
    summary: 'Produces Eggs for cooking, crafting inputs, and trading.',
    personality: 'Lively flockmates that reward daily attention.',
  },
  {
    id: 'goat',
    name: 'Goat',
    material: 'Goat Wool',
    materialPlural: 'Goat Wool',
    emoji: '🐐',
    summary: 'Produces Goat Wool — not goat milk, since Cow already supplies Milk.',
    personality: 'Independent climbers with a soft-side talent for wool.',
  },
] as const;

export type AnimalId = (typeof ANIMALS)[number]['id'];
export type Animal = (typeof ANIMALS)[number];

export const TRANSFORMATION_MILESTONES = [1, 10, 20, 30, 40, 50] as const;

export function clampAnimalLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(ANIMAL_MAX_LEVEL, Math.max(1, Math.round(level)));
}

export function getMaterialRarityForLevel(level: number): {
  rarity: MaterialRarity;
  divineChance: number;
  note: string;
} {
  const clamped = clampAnimalLevel(level);
  const range = MATERIAL_RARITY_RANGES.find(
    (entry) => clamped >= entry.minLevel && clamped <= entry.maxLevel,
  );
  if (range === undefined) {
    return {
      rarity: 'Common',
      divineChance: 0,
      note: 'Level out of expected range.',
    };
  }
  if (clamped === 50) {
    return {
      rarity: 'Mythic',
      divineChance: DIVINE_CHANCE_AT_LEVEL_50,
      note: 'Level 50 normally produces Mythic material, with a 1% chance of Divine. Divine is never guaranteed.',
    };
  }
  return {
    rarity: range.rarity,
    divineChance: 0,
    note:
      range.note ?? `Levels ${range.minLevel}–${range.maxLevel} produce ${range.rarity} material.`,
  };
}

export function getTransformationMilestone(level: number): number {
  const clamped = clampAnimalLevel(level);
  let milestone: number = TRANSFORMATION_MILESTONES[0]!;
  for (const value of TRANSFORMATION_MILESTONES) {
    if (clamped >= value) milestone = value;
  }
  return milestone;
}

export function getAnimalById(id: AnimalId): Animal {
  const animal = ANIMALS.find((entry) => entry.id === id);
  if (animal === undefined) throw new Error(`Unknown animal: ${id}`);
  return animal;
}

export function formatMaterialName(animal: Animal, rarity: MaterialRarity): string {
  return `${rarity} ${animal.material}`;
}
