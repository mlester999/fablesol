'use client';

import { useState } from 'react';

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
      <svg className="diagram-svg" viewBox="0 0 640 180" role="img" aria-label={layer.title}>
        {layer.nodes.map((node, index) => {
          const x = 20 + index * 120;
          return (
            <g key={node}>
              {index < layer.nodes.length - 1 ? (
                <path
                  d={`M ${x + 90} 90 H ${x + 120}`}
                  stroke="#2f5d46"
                  strokeWidth="2"
                  fill="none"
                />
              ) : null}
              <rect
                x={x}
                y={55}
                width={100}
                height={70}
                rx="12"
                fill="#fffdf7"
                stroke="#1c2a22"
                strokeOpacity="0.18"
              />
              <text x={x + 50} y={95} textAnchor="middle" fontSize="11" fill="#1c2a22">
                {node.split(' ').map((word, wordIndex) => (
                  <tspan key={word + wordIndex} x={x + 50} dy={wordIndex === 0 ? 0 : 14}>
                    {word}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="live-region" aria-live="polite">
        {layer.text}
      </p>
      <p>
        Full text flow: Animals → Materials → Crafting/trading → Copper Exchange → COPPER → Auction
        House / participation → other players → continued circulation. Separately: Wallet → 10,000
        $FABLE → game access.
      </p>
    </div>
  );
}
