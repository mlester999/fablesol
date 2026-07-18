'use client';

import { useState } from 'react';
import { BATTLE_CLASSES, type BattleClassId } from '@/content/game/cat-battle';

export function BattleClassSelector() {
  const [id, setId] = useState<BattleClassId>(BATTLE_CLASSES[0]!.id);
  const selected = BATTLE_CLASSES.find((entry) => entry.id === id)!;

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational preview</span>
      <h3>Battle Class selector</h3>
      <div className="chip-row" role="tablist" aria-label="Battle classes">
        {BATTLE_CLASSES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            className="chip"
            aria-selected={id === entry.id}
            onClick={() => setId(entry.id)}
          >
            {entry.name}
          </button>
        ))}
      </div>
      <div className="panel">
        <h3>{selected.name}</h3>
        <p>
          <strong>Role:</strong> {selected.role}
        </p>
        <p>
          <strong>Playstyle:</strong> {selected.playstyle}
        </p>
        <p>
          <strong>Stat emphasis:</strong> {selected.statEmphasis.join(', ')}
        </p>
        <p>
          <strong>Strengths:</strong> {selected.strengths.join('; ')}
        </p>
        <p>
          <strong>Tradeoffs:</strong> {selected.tradeoffs.join('; ')}
        </p>
        <p>
          <strong>Soft counters:</strong> {selected.softCounters}
        </p>
        <p>
          <strong>Soft countered by:</strong> {selected.softCounteredBy}
        </p>
      </div>
    </div>
  );
}
