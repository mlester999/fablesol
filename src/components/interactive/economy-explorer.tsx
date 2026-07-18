'use client';

import { useState } from 'react';
import { FlowDiagram, FlowIconCoin, FlowIconWallet } from '@/components/site/flow-diagram';

const LAYERS = [
  {
    id: 'new',
    title: 'New player view',
    nodes: ['Wallet', '10,000 $FABLE', 'Game access', 'First animals', 'First materials'],
    text: 'Access is on-chain. Early play focuses on cozy activities before deep market play.',
  },
  {
    id: 'farmer',
    title: 'Farmer view',
    nodes: [
      'Animals',
      'Materials',
      'Crafting / cooking',
      'Limited NPC COPPER',
      'Copper Exchange pathway',
    ],
    text: 'Production creates materials. NPC COPPER is capped. Copper Exchange is the main meaningful COPPER pathway.',
  },
  {
    id: 'trader',
    title: 'Trader view',
    nodes: [
      'Materials / items',
      'Auction House (10% tax)',
      'Player circulation',
      'Copper Exchange',
    ],
    text: 'Auction House moves items with a transparent 10% tax. COPPER keeps circulating between players.',
  },
  {
    id: 'battle',
    title: 'Cat Battle player view',
    nodes: [
      'Permanent cat',
      'Skills & equipment',
      'Battle Power',
      'Matchmaking',
      'Optional wagers',
    ],
    text: 'Battle Power comes from build progression, not win/loss MMR jumps.',
  },
  {
    id: 'tournament',
    title: 'Tournament view',
    nodes: ['Entrance fees', 'Prize pool', 'Redistribution', 'Optional sponsored rewards'],
    text: 'Community fees form 100% of the COPPER pool. Official events may add sponsored rewards.',
  },
] as const;

export function EconomyExplorer() {
  const [layerId, setLayerId] = useState<(typeof LAYERS)[number]['id']>('farmer');
  const layer = LAYERS.find((entry) => entry.id === layerId)!;

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Interactive economy explorer</span>
      <h3>How value moves</h3>
      <p>
        $FABLE does not automatically convert into COPPER. Select a lens to simplify the diagram.
      </p>
      <div className="chip-row" role="tablist" aria-label="Economy layers">
        {LAYERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="chip"
            role="tab"
            aria-selected={layerId === entry.id}
            onClick={() => setLayerId(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <FlowDiagram
        label={layer.title}
        accent="moss"
        steps={layer.nodes.map((node) => ({ title: node }))}
      />
      <p className="live-region" aria-live="polite">
        {layer.text}
      </p>
      <div className="economy-gate" role="group" aria-label="On-chain access, separate from COPPER">
        <span className="economy-gate__track" data-kind="copper">
          <FlowIconCoin />
          <span>
            <strong>COPPER circulation:</strong> animals → materials → crafting and trading → Copper
            Exchange → COPPER → Auction House and participation → other players → continued
            circulation. Entirely off-chain.
          </span>
        </span>
        <span className="economy-gate__track" data-kind="fable">
          <FlowIconWallet />
          <span>
            <strong>$FABLE access gate:</strong> wallet → 10,000 $FABLE → game access. On-chain, and
            never an automatic COPPER conversion.
          </span>
        </span>
      </div>
    </div>
  );
}
