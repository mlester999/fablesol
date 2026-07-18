import type { DOCUMENTATION_REVIEW_DATE } from '@/content/game/brand';
import type { FeatureAvailabilityId } from '@/content/game/availability';

export type DocumentationSection =
  | 'Getting Started'
  | 'Cozy World'
  | 'Economy'
  | 'Your Cat'
  | 'Cat Battle'
  | 'Tournaments'
  | 'Rules and Support';

export type DocumentationAudience =
  'New players' | 'Players' | 'Competitive players' | 'All players';

export type CalloutTone = 'tip' | 'important' | 'safety' | 'rule' | 'provisional' | 'example';

export interface DocCallout {
  readonly type: 'callout';
  readonly tone: CalloutTone;
  readonly title: string;
  readonly text: string;
}

export interface DocList {
  readonly type: 'list';
  readonly ordered?: boolean;
  readonly items: readonly string[];
}

export interface DocSteps {
  readonly type: 'steps';
  readonly items: readonly { readonly title: string; readonly text: string }[];
}

export interface DocTable {
  readonly type: 'table';
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface DocLinks {
  readonly type: 'links';
  readonly links: readonly {
    readonly label: string;
    readonly href: string;
    readonly description: string;
  }[];
}

export interface DocInteractive {
  readonly type: 'interactive';
  readonly component:
    | 'animal-progression'
    | 'rarity-ladder'
    | 'npc-cap-calculator'
    | 'auction-tax-calculator'
    | 'energy-simulator'
    | 'battle-class-selector'
    | 'matchmaking-timeline'
    | 'tournament-fee-calculator'
    | 'wager-calculator'
    | 'economy-explorer'
    | 'cat-dice-demo'
    | 'tournament-registration-demo'
    | 'equipment-loadout'
    | 'skill-unlock-timeline'
    | 'battle-power-breakdown'
    | 'activity-explorer'
    | 'utc-explainer'
    | 'access-flow'
    | 'status-effects-gallery'
    | 'stat-explorer'
    | 'currency-comparison'
    | 'market-comparison'
    | 'class-soft-counters'
    | 'battle-flow'
    | 'prize-pool-demo'
    | 'farm-visit-explorer';
}

export type DocumentationBlock =
  DocCallout | DocList | DocSteps | DocTable | DocLinks | DocInteractive;

export interface DocumentationSectionContent {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly blocks?: readonly DocumentationBlock[];
}

export interface DocumentationPage {
  readonly slug: string;
  readonly route: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly section: DocumentationSection;
  readonly audience: DocumentationAudience;
  readonly keywords: readonly string[];
  readonly related: readonly string[];
  readonly lastReviewed: typeof DOCUMENTATION_REVIEW_DATE;
  /**
   * Feature whose live/planned status this page explains. Pages describing
   * game systems must set this so the availability badge renders.
   */
  readonly availability?: FeatureAvailabilityId;
  readonly content: readonly DocumentationSectionContent[];
}

export interface DocumentationSearchEntry {
  readonly id: string;
  readonly title: string;
  readonly route: string;
  readonly section: string;
  readonly category: DocumentationSection | 'How to Play' | 'Glossary' | 'FAQ';
  readonly description: string;
  readonly heading?: string;
  readonly excerpt: string;
  readonly searchText: string;
}
