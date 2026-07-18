/**
 * COPPER economy, NPC caps, Auction House, and derived tournament stakes.
 * Tournament fees and wagers are derived from these tables — do not hardcode elsewhere.
 */

export const AUCTION_HOUSE_TAX_RATE = 0.1 as const;

export interface LevelTier {
  readonly id: string;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly dailyNpcCap: number;
  readonly weeklyNpcCap: number;
  /** Community Cat Battle tournament entrance fee = half daily NPC cap. */
  readonly communityTournamentFee: number;
  /** Optional 1v1 wager = half community tournament fee. */
  readonly wagerAmount: number;
}

/**
 * Provisional economy tuning values.
 * Labeled provisional until live simulation locks final numbers.
 */
export const LEVEL_TIERS: readonly LevelTier[] = [
  {
    id: '1-10',
    minLevel: 1,
    maxLevel: 10,
    dailyNpcCap: 100,
    weeklyNpcCap: 700,
    communityTournamentFee: 50,
    wagerAmount: 25,
  },
  {
    id: '11-20',
    minLevel: 11,
    maxLevel: 20,
    dailyNpcCap: 200,
    weeklyNpcCap: 1400,
    communityTournamentFee: 100,
    wagerAmount: 50,
  },
  {
    id: '21-30',
    minLevel: 21,
    maxLevel: 30,
    dailyNpcCap: 300,
    weeklyNpcCap: 2100,
    communityTournamentFee: 150,
    wagerAmount: 75,
  },
  {
    id: '31-40',
    minLevel: 31,
    maxLevel: 40,
    dailyNpcCap: 400,
    weeklyNpcCap: 2800,
    communityTournamentFee: 200,
    wagerAmount: 100,
  },
  {
    id: '41-50',
    minLevel: 41,
    maxLevel: 50,
    dailyNpcCap: 500,
    weeklyNpcCap: 3500,
    communityTournamentFee: 250,
    wagerAmount: 125,
  },
] as const;

export const ECONOMY_NOTES = {
  copperScarce:
    'COPPER is intentionally scarce. NPC selling is a limited supplementary source, not the main engine of COPPER generation.',
  copperExchangeMain:
    'The Copper Exchange is intended to be the main meaningful way COPPER enters player economic circulation.',
  npcCapsAccountWide: 'NPC COPPER selling limits are account-wide and reset using UTC.',
  provisionalLabel:
    'These NPC caps and derived fees are provisional balance values and may be retuned after economy simulation.',
  auctionTax:
    'The Auction House tax is exactly 10%. The seller receives the remaining amount after tax.',
  noFableToCopperAuto:
    '$FABLE does not automatically convert into COPPER. On-chain holdings and the off-chain economy remain separate systems.',
  tournamentRedistribution:
    'Tournament rewards primarily redistribute COPPER between players rather than minting unlimited new COPPER.',
} as const;

export function clampPlayerLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(50, Math.max(1, Math.round(level)));
}

export function getLevelTier(level: number): LevelTier {
  const clamped = clampPlayerLevel(level);
  const tier = LEVEL_TIERS.find((entry) => clamped >= entry.minLevel && clamped <= entry.maxLevel);
  if (tier === undefined) {
    return LEVEL_TIERS[0]!;
  }
  return tier;
}

export function calculateAuctionHouseSplit(salePrice: number): {
  gross: number;
  tax: number;
  sellerReceives: number;
  taxRate: number;
} {
  const gross = Math.max(0, Number.isFinite(salePrice) ? salePrice : 0);
  const tax = Math.round(gross * AUCTION_HOUSE_TAX_RATE * 100) / 100;
  const sellerReceives = Math.round((gross - tax) * 100) / 100;
  return {
    gross,
    tax,
    sellerReceives,
    taxRate: AUCTION_HOUSE_TAX_RATE,
  };
}

export function calculateCommunityPrizePool(entrants: number, fee: number): number {
  const safeEntrants = Math.max(0, Math.floor(entrants));
  const safeFee = Math.max(0, fee);
  return safeEntrants * safeFee;
}

export function calculateWagerPot(wagerAmount: number): {
  stakeEach: number;
  pot: number;
  winnerReceives: number;
  tax: number;
  burn: number;
} {
  const stakeEach = Math.max(0, wagerAmount);
  const pot = stakeEach * 2;
  return {
    stakeEach,
    pot,
    winnerReceives: pot,
    tax: 0,
    burn: 0,
  };
}

export const MARKET_SYSTEMS = [
  {
    id: 'copper-exchange',
    name: 'Copper Exchange',
    role: 'Main meaningful COPPER circulation pathway for players.',
    currency: 'COPPER-focused player exchange activity',
    tax: 'Not defined as a fixed public percentage in this documentation.',
  },
  {
    id: 'auction-house',
    name: 'Auction House',
    role: 'Player-driven item trading marketplace.',
    currency: 'Listings settled in COPPER',
    tax: 'Exactly 10% Auction House tax.',
  },
  {
    id: 'npc-selling',
    name: 'NPC selling',
    role: 'Limited supplementary COPPER source with account-wide daily and weekly caps.',
    currency: 'COPPER',
    tax: 'Subject to daily/weekly caps rather than unlimited generation.',
  },
  {
    id: 'tournaments',
    name: 'Tournaments',
    role: 'Redistribute entrance fees into prize pools among participants.',
    currency: 'COPPER entrance fees; official events may add sponsored rewards',
    tax: 'No tournament tax, burn, or developer cut on Community pools.',
  },
] as const;
