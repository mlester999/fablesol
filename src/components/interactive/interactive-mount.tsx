'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { DocumentationBlock } from '@/content/docs/types';

type InteractiveName = Extract<DocumentationBlock, { type: 'interactive' }>['component'];

function Fallback() {
  return (
    <div className="interactive-card" aria-busy="true">
      <span className="interactive-card__label">Loading interactive tool</span>
      <p>Preparing the educational widget…</p>
    </div>
  );
}

function lazyInteractive(loader: () => Promise<{ default: ComponentType }>) {
  return dynamic(loader, {
    ssr: false,
    loading: () => <Fallback />,
  });
}

const INTERACTIVE_COMPONENTS: Record<InteractiveName, ComponentType> = {
  'animal-progression': lazyInteractive(() =>
    import('./animal-progression').then((m) => ({ default: m.AnimalProgression })),
  ),
  'rarity-ladder': lazyInteractive(() =>
    import('./rarity-ladder').then((m) => ({ default: m.RarityLadder })),
  ),
  'npc-cap-calculator': lazyInteractive(() =>
    import('./npc-cap-calculator').then((m) => ({ default: m.NpcCapCalculator })),
  ),
  'auction-tax-calculator': lazyInteractive(() =>
    import('./auction-tax-calculator').then((m) => ({ default: m.AuctionTaxCalculator })),
  ),
  'energy-simulator': lazyInteractive(() =>
    import('./energy-simulator').then((m) => ({ default: m.EnergySimulator })),
  ),
  'battle-class-selector': lazyInteractive(() =>
    import('./battle-class-selector').then((m) => ({ default: m.BattleClassSelector })),
  ),
  'matchmaking-timeline': lazyInteractive(() =>
    import('./matchmaking-timeline').then((m) => ({ default: m.MatchmakingTimeline })),
  ),
  'tournament-fee-calculator': lazyInteractive(() =>
    import('./tournament-fee-calculator').then((m) => ({ default: m.TournamentFeeCalculator })),
  ),
  'wager-calculator': lazyInteractive(() =>
    import('./wager-calculator').then((m) => ({ default: m.WagerCalculator })),
  ),
  'economy-explorer': lazyInteractive(() =>
    import('./economy-explorer').then((m) => ({ default: m.EconomyExplorer })),
  ),
  'cat-dice-demo': lazyInteractive(() =>
    import('./cat-dice-demo').then((m) => ({ default: m.CatDiceDemo })),
  ),
  'tournament-registration-demo': lazyInteractive(() =>
    import('./tournament-registration-demo').then((m) => ({
      default: m.TournamentRegistrationDemo,
    })),
  ),
  'equipment-loadout': lazyInteractive(() =>
    import('./equipment-loadout').then((m) => ({ default: m.EquipmentLoadout })),
  ),
  'skill-unlock-timeline': lazyInteractive(() =>
    import('./skill-unlock-timeline').then((m) => ({ default: m.SkillUnlockTimeline })),
  ),
  'battle-power-breakdown': lazyInteractive(() =>
    import('./battle-power-breakdown').then((m) => ({ default: m.BattlePowerBreakdown })),
  ),
  'activity-explorer': lazyInteractive(() =>
    import('./activity-explorer').then((m) => ({ default: m.ActivityExplorer })),
  ),
  'utc-explainer': lazyInteractive(() =>
    import('./utc-explainer').then((m) => ({ default: m.UtcExplainer })),
  ),
  'access-flow': lazyInteractive(() =>
    import('./access-flow').then((m) => ({ default: m.AccessFlow })),
  ),
  'status-effects-gallery': lazyInteractive(() =>
    import('./status-effects-gallery').then((m) => ({ default: m.StatusEffectsGallery })),
  ),
  'stat-explorer': lazyInteractive(() =>
    import('./stat-explorer').then((m) => ({ default: m.StatExplorer })),
  ),
  'currency-comparison': lazyInteractive(() =>
    import('./currency-comparison').then((m) => ({ default: m.CurrencyComparison })),
  ),
  'market-comparison': lazyInteractive(() =>
    import('./market-comparison').then((m) => ({ default: m.MarketComparison })),
  ),
  'class-soft-counters': lazyInteractive(() =>
    import('./class-soft-counters').then((m) => ({ default: m.ClassSoftCounters })),
  ),
  'battle-flow': lazyInteractive(() =>
    import('./battle-flow').then((m) => ({ default: m.BattleFlow })),
  ),
  'prize-pool-demo': lazyInteractive(() =>
    import('./prize-pool-demo').then((m) => ({ default: m.PrizePoolDemo })),
  ),
};

export function InteractiveMount({ component }: { readonly component: InteractiveName }) {
  const Lazy = INTERACTIVE_COMPONENTS[component];
  return <Lazy />;
}
