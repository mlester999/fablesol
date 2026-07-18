'use client';

import { useState } from 'react';
import { BATTLE_STATS } from '@/content/game/cat-battle';

type StatId = (typeof BATTLE_STATS)[number]['id'];

export function StatExplorer() {
  const [id, setId] = useState<StatId>(BATTLE_STATS[0]!.id);
  const stat = BATTLE_STATS.find((entry) => entry.id === id)!;

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Stat explainer</span>
      <h3>Core stats</h3>
      <div className="chip-row">
        {BATTLE_STATS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="chip"
            aria-pressed={id === entry.id}
            onClick={() => setId(entry.id)}
          >
            {entry.name}
          </button>
        ))}
      </div>
      <div className="panel">
        <h3>{stat.name}</h3>
        <p>{stat.description}</p>
      </div>
      <p>Luck is not a permanent core stat.</p>
    </div>
  );
}
