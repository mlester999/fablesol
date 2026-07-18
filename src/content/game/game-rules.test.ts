import { describe, expect, it } from 'vitest';
import {
  ANIMAL_MAX_LEVEL,
  ANIMALS,
  DIVINE_CHANCE_AT_LEVEL_50,
  getMaterialRarityForLevel,
  MATERIAL_RARITIES,
} from './animals';
import {
  applyEnergyAfterAction,
  BATTLE_CLASSES,
  CAT_DICE,
  ENERGY,
  EQUIPMENT_SLOTS,
  MATCHMAKING,
  STATUS_EFFECTS,
} from './cat-battle';
import {
  AUCTION_HOUSE_TAX_RATE,
  calculateAuctionHouseSplit,
  calculateCommunityPrizePool,
  calculateWagerPot,
  getLevelTier,
  LEVEL_TIERS,
} from './economy';
import { ACCESS } from './access';
import { TIMEZONE_RULE } from './tournaments';
import { DOCUMENTATION_PAGES, DOCUMENTATION_ROUTES } from '@/content/docs/pages';
import { searchDocumentation } from '@/content/docs/search';

describe('access and currencies', () => {
  it('requires 10,000 $FABLE', () => {
    expect(ACCESS.minimumHoldings).toBe(10_000);
    expect(ACCESS.tokenSymbol).toBe('$FABLE');
    expect(ACCESS.chain).toBe('Solana');
  });
});

describe('animals and rarities', () => {
  it('has five animals with approved materials', () => {
    expect(ANIMALS).toHaveLength(5);
    expect(ANIMALS.map((a) => [a.name, a.material])).toEqual([
      ['Cow', 'Milk'],
      ['Pig', 'Meat'],
      ['Horse', 'Leather'],
      ['Chicken', 'Eggs'],
      ['Goat', 'Goat Wool'],
    ]);
    expect(ANIMAL_MAX_LEVEL).toBe(50);
    expect(MATERIAL_RARITIES).toHaveLength(7);
  });

  it('uses mythic with 1% divine at level 50', () => {
    const result = getMaterialRarityForLevel(50);
    expect(result.rarity).toBe('Mythic');
    expect(result.divineChance).toBe(DIVINE_CHANCE_AT_LEVEL_50);
    expect(DIVINE_CHANCE_AT_LEVEL_50).toBe(0.01);
    expect(getMaterialRarityForLevel(10).rarity).toBe('Common');
    expect(getMaterialRarityForLevel(25).rarity).toBe('Rare');
  });
});

describe('economy calculators', () => {
  it('keeps auction tax at exactly 10%', () => {
    expect(AUCTION_HOUSE_TAX_RATE).toBe(0.1);
    const split = calculateAuctionHouseSplit(1000);
    expect(split.tax).toBe(100);
    expect(split.sellerReceives).toBe(900);
  });

  it('derives community fees and wagers from NPC caps', () => {
    for (const tier of LEVEL_TIERS) {
      expect(tier.communityTournamentFee).toBe(tier.dailyNpcCap / 2);
      expect(tier.wagerAmount).toBe(tier.communityTournamentFee / 2);
    }
    expect(getLevelTier(1).dailyNpcCap).toBe(100);
    expect(getLevelTier(50).communityTournamentFee).toBe(250);
    expect(getLevelTier(0).minLevel).toBe(1);
    expect(getLevelTier(999).maxLevel).toBe(50);
  });

  it('computes prize pools and wager pots without tax', () => {
    expect(calculateCommunityPrizePool(8, 100)).toBe(800);
    const pot = calculateWagerPot(50);
    expect(pot.pot).toBe(100);
    expect(pot.tax).toBe(0);
    expect(pot.burn).toBe(0);
  });
});

describe('cat battle rules', () => {
  it('keeps energy math capped and insufficient-safe', () => {
    expect(ENERGY.starting).toBe(50);
    expect(ENERGY.maximum).toBe(100);
    expect(ENERGY.gainAfterAction).toBe(15);
    const ok = applyEnergyAfterAction(50, 30);
    expect(ok.canAfford).toBe(true);
    expect(ok.afterGain).toBe(35);
    const fail = applyEnergyAfterAction(20, 85);
    expect(fail.canAfford).toBe(false);
    const cap = applyEnergyAfterAction(95, 0);
    expect(cap.afterGain).toBe(100);
    expect(cap.capped).toBe(true);
  });

  it('keeps approved class/status/equipment counts and dice rule', () => {
    expect(BATTLE_CLASSES).toHaveLength(5);
    expect(STATUS_EFFECTS.map((s) => s.name)).toEqual([
      'Heal',
      'Shield',
      'Bleed',
      'Stun',
      'Weaken',
    ]);
    expect(EQUIPMENT_SLOTS).toHaveLength(3);
    expect(CAT_DICE.levelAffectsOdds).toBe(false);
    expect(MATCHMAKING.expansion[0]?.rangePercent).toBe(5);
    expect(MATCHMAKING.expansion[1]?.rangePercent).toBe(8);
    expect(MATCHMAKING.expansion[2]?.rangePercent).toBe(10);
    expect(MATCHMAKING.wageredMaxRangePercent).toBe(12);
  });
});

describe('documentation architecture', () => {
  it('registers all required docs routes', () => {
    // The complete Phase 1 required public route list.
    const required = [
      '/how-to-play',
      '/docs',
      '/docs/getting-started',
      '/docs/game-overview',
      '/docs/access',
      '/docs/first-day',
      '/docs/player-progression',
      '/docs/activities',
      '/docs/farming',
      '/docs/animals',
      '/docs/animal-progression',
      '/docs/materials',
      '/docs/fishing',
      '/docs/mining',
      '/docs/woodcutting',
      '/docs/cooking',
      '/docs/crafting',
      '/docs/housing',
      '/docs/exploration',
      '/docs/social',
      '/docs/inventory',
      '/docs/economy',
      '/docs/copper',
      '/docs/fable',
      '/docs/copper-exchange',
      '/docs/npc-selling',
      '/docs/auction-house',
      '/docs/player-trading',
      '/docs/cat',
      '/docs/cat-personality',
      '/docs/cat-dice',
      '/docs/cat-battle',
      '/docs/cat-battle/classes',
      '/docs/cat-battle/stats',
      '/docs/cat-battle/energy',
      '/docs/cat-battle/skills',
      '/docs/cat-battle/status-effects',
      '/docs/cat-battle/battle-power',
      '/docs/cat-battle/equipment',
      '/docs/cat-battle/matchmaking',
      '/docs/cat-battle/wagers',
      '/docs/tournaments',
      '/docs/tournaments/community',
      '/docs/tournaments/official',
      '/docs/tournaments/registration',
      '/docs/tournaments/rewards',
      '/docs/tournaments/refunds',
      '/docs/utc',
      '/docs/fair-play',
      '/docs/security',
      '/docs/faq',
      '/docs/glossary',
    ];
    for (const route of required) {
      expect(DOCUMENTATION_ROUTES).toContain(route);
    }
    for (const page of DOCUMENTATION_PAGES) {
      expect(page.content.length).toBeGreaterThan(0);
      expect(page.content[0]?.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('resolves every related slug to a real page', () => {
    const slugs = new Set(DOCUMENTATION_PAGES.map((page) => page.slug));
    for (const page of DOCUMENTATION_PAGES) {
      for (const related of page.related) {
        expect(slugs.has(related), `${page.slug} → related '${related}'`).toBe(true);
      }
    }
  });

  it('search finds critical terms', () => {
    expect(searchDocumentation('Divine').length).toBeGreaterThan(0);
    expect(searchDocumentation('Battle Power')[0]?.searchText).toContain('battle power');
    expect(searchDocumentation('zzznomatch123').length).toBe(0);
  });

  it('documents UTC as official timezone', () => {
    expect(TIMEZONE_RULE.canonical).toBe('UTC');
    expect(TIMEZONE_RULE.statement).toContain('UTC');
  });
});
