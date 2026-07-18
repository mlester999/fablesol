'use client';

import { useState } from 'react';
import { getMaterialRarityForLevel, MATERIAL_RARITY_RANGES } from '@/content/game/animals';

export function RarityLadder() {
  const [level, setLevel] = useState(25);
  const current = getMaterialRarityForLevel(level);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational preview</span>
      <h3>Material rarity ladder</h3>
      <p>
        Default animal material progression by level. Level 50 is Mythic with a 1% Divine chance.
      </p>
      <div className="field">
        <label htmlFor="rarity-level">Level</label>
        <input
          id="rarity-level"
          type="range"
          min={1}
          max={50}
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
        />
      </div>
      <div className="rarity-bar">
        {MATERIAL_RARITY_RANGES.map((range) => {
          const active = level >= range.minLevel && level <= range.maxLevel;
          return (
            <div className="rarity-step" data-active={active} key={range.rarity + range.minLevel}>
              <span>
                {range.minLevel === range.maxLevel
                  ? `Level ${range.minLevel}`
                  : `Levels ${range.minLevel}–${range.maxLevel}`}
              </span>
              <strong>
                <span
                  className="rarity-dot"
                  data-rarity={range.rarity.toLowerCase()}
                  aria-hidden="true"
                />
                {range.rarity}
                {range.minLevel === 50 ? ' · 1% Divine chance' : ''}
              </strong>
            </div>
          );
        })}
      </div>
      <p className="live-region" aria-live="polite">
        Level {level}: {current.rarity}
        {current.divineChance > 0 ? ' (1% Divine chance)' : ''}
      </p>
    </div>
  );
}
