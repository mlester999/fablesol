'use client';

import { BATTLE_POWER } from '@/content/game/cat-battle';

export function BattlePowerBreakdown() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Conceptual breakdown</span>
      <h3>Battle Power contributors</h3>
      <p>{BATTLE_POWER.definition}</p>
      <div className="stat-grid">
        {BATTLE_POWER.contributors.map((item) => (
          <div className="stat-pill" key={item}>
            <span>Contributor</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
      <p className="live-region">{BATTLE_POWER.note}</p>
      <p>
        No exact Battle Power formula is published here because an authoritative formula is not
        available in this repository.
      </p>
    </div>
  );
}
