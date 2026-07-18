/** Approved cozy activity categories and first-day journey beats. */

import type { FeatureAvailabilityId } from './availability';

export const ACTIVITIES = [
  {
    id: 'farming',
    featureId: 'farming' satisfies FeatureAvailabilityId,
    name: 'Farming',
    summary: 'Grow crops and support the wider production loop that feeds crafting and trading.',
    playstyles: ['care', 'gather'],
  },
  {
    id: 'animals',
    featureId: 'animal-care' satisfies FeatureAvailabilityId,
    name: 'Animal care and ranching',
    summary:
      'Raise cows, pigs, horses, chickens, and goats from level 1 to 50 for rarer materials.',
    playstyles: ['care'],
  },
  {
    id: 'fishing',
    featureId: 'fishing' satisfies FeatureAvailabilityId,
    name: 'Fishing',
    summary: 'A peaceful gathering activity that contributes materials and relaxed play sessions.',
    playstyles: ['gather', 'relax'],
  },
  {
    id: 'mining',
    featureId: 'mining' satisfies FeatureAvailabilityId,
    name: 'Mining',
    summary: 'Gather mineral resources that support crafting and player economy demand.',
    playstyles: ['gather'],
  },
  {
    id: 'woodcutting',
    featureId: 'woodcutting' satisfies FeatureAvailabilityId,
    name: 'Woodcutting',
    summary: 'Collect wood for crafting, housing, and trade.',
    playstyles: ['gather'],
  },
  {
    id: 'cooking',
    featureId: 'cooking' satisfies FeatureAvailabilityId,
    name: 'Cooking',
    summary: 'Transform ingredients into prepared goods for use and trade.',
    playstyles: ['craft'],
  },
  {
    id: 'crafting',
    featureId: 'crafting' satisfies FeatureAvailabilityId,
    name: 'Crafting',
    summary:
      'Convert materials into useful and tradeable items, including combat equipment pathways.',
    playstyles: ['craft'],
  },
  {
    id: 'housing',
    featureId: 'housing' satisfies FeatureAvailabilityId,
    name: 'Housing',
    summary: 'Decorate and personalize your space for cozy expression and social presence.',
    playstyles: ['relax'],
  },
  {
    id: 'exploration',
    featureId: 'exploration' satisfies FeatureAvailabilityId,
    name: 'Exploration',
    summary: 'Move through the shared world, discover activities, and find social moments.',
    playstyles: ['relax', 'social'],
  },
  {
    id: 'social',
    featureId: 'social' satisfies FeatureAvailabilityId,
    name: 'Social multiplayer',
    summary: 'Share the world with other players in a welcoming multiplayer environment.',
    playstyles: ['social'],
  },
  {
    id: 'trading',
    featureId: 'player-trading' satisfies FeatureAvailabilityId,
    name: 'Player trading',
    summary: 'Exchange value with other players through peer and market systems.',
    playstyles: ['trade'],
  },
  {
    id: 'auction-house',
    featureId: 'auction-house' satisfies FeatureAvailabilityId,
    name: 'Auction House participation',
    summary: 'List and purchase eligible items with a transparent 10% tax.',
    playstyles: ['trade'],
  },
  {
    id: 'cat-activities',
    featureId: 'cat-companion' satisfies FeatureAvailabilityId,
    name: 'Cat activities',
    summary:
      'Spend time with your permanent cat through casual play, Cat Dice, and optional Cat Battle.',
    playstyles: ['cat', 'compete'],
  },
] as const;

export const DAY_CHOICES = [
  {
    id: 'care',
    title: 'Care for animals',
    description: 'Level animals, collect materials, and watch rarity climb over time.',
    activities: ['animals', 'farming'],
  },
  {
    id: 'gather',
    title: 'Gather resources',
    description: 'Fish, mine, and cut wood at a peaceful pace.',
    activities: ['fishing', 'mining', 'woodcutting'],
  },
  {
    id: 'craft',
    title: 'Craft items',
    description: 'Cook and craft with materials from your farm and gathering runs.',
    activities: ['cooking', 'crafting'],
  },
  {
    id: 'trade',
    title: 'Trade with players',
    description: 'Use the Auction House and player economy loops to circulate value.',
    activities: ['trading', 'auction-house'],
  },
  {
    id: 'relax',
    title: 'Relax and decorate',
    description: 'Focus on housing, exploration, and soft social moments.',
    activities: ['housing', 'exploration', 'social'],
  },
  {
    id: 'cat',
    title: 'Play with your cat',
    description: 'Enjoy casual cat time and optional Cat Dice sessions.',
    activities: ['cat-activities'],
  },
  {
    id: 'tournament',
    title: 'Enter a tournament',
    description: 'Optional competitive path — never required to enjoy the cozy core.',
    activities: ['cat-activities'],
  },
] as const;

export const PLAYER_JOURNEY = [
  {
    id: 'wallet',
    title: 'Connect wallet',
    text: 'Connect a compatible Solana wallet.',
  },
  {
    id: 'access',
    title: 'Meet access requirement',
    text: 'Hold at least 10,000 $FABLE to enter the game.',
  },
  {
    id: 'world',
    title: 'Enter the world',
    text: 'Step into Fablesol’s cozy multiplayer farm world.',
  },
  {
    id: 'cozy',
    title: 'Begin cozy activities',
    text: 'Farm, gather, cook, craft, and explore at your own pace.',
  },
  {
    id: 'animals',
    title: 'Care for animals',
    text: 'Raise the five farm animals and collect their materials.',
  },
  {
    id: 'levels',
    title: 'Improve animal levels',
    text: 'Progress animals toward level 50 and visual milestones every 10 levels.',
  },
  {
    id: 'rarity',
    title: 'Reach material rarity milestones',
    text: 'Unlock higher rarities as levels rise, culminating in Mythic output with a 1% Divine chance at 50.',
  },
  {
    id: 'economy',
    title: 'Use player economy systems',
    text: 'Engage with Copper Exchange pathways, NPC caps, and the Auction House.',
  },
  {
    id: 'cat',
    title: 'Develop the permanent cat',
    text: 'Build identity through personality and long-term companionship.',
  },
  {
    id: 'skills',
    title: 'Unlock Cat Battle skills',
    text: 'At confirmed levels, unlock Basic Attack, actives, Passive, and Ultimate.',
  },
  {
    id: 'gear',
    title: 'Equip Weapon, Armor, and Accessory',
    text: 'Use the three combat equipment slots to shape Battle Power.',
  },
  {
    id: 'modes',
    title: 'Enter Cat Dice or Cat Battle',
    text: 'Choose casual luck-based dice or strategic turn-based battles.',
  },
  {
    id: 'events',
    title: 'Join tournaments',
    text: 'Optionally enter Community or Official Sponsored tournaments.',
  },
  {
    id: 'mastery',
    title: 'Level 50 mastery',
    text: 'Reach level 50 animal production: Mythic materials with a 1% Divine chance.',
  },
] as const;
