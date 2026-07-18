'use client';

import { useMemo, useState } from 'react';
import { calculateWagerPot, getLevelTier } from '@/content/game/economy';
import { formatCopper } from '@/lib/format';

export function WagerCalculator() {
  const [level, setLevel] = useState(12);
  const tier = useMemo(() => getLevelTier(level), [level]);
  const pot = useMemo(() => calculateWagerPot(tier.wagerAmount), [tier.wagerAmount]);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational · no real stakes</span>
      <h3>Wager pot calculator</h3>
      <p>Both players stake the same amount. Winner receives the full pot. Tax 0. Burn 0.</p>
      <div className="field">
        <label htmlFor="wager-level">Level tier</label>
        <input
          id="wager-level"
          type="number"
          min={1}
          max={50}
          value={level}
          onChange={(event) => setLevel(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
        />
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Stake each</span>
          <strong>{formatCopper(pot.stakeEach)}</strong>
        </div>
        <div className="stat-pill">
          <span>Combined pot</span>
          <strong>{formatCopper(pot.pot)}</strong>
        </div>
        <div className="stat-pill">
          <span>Winner receives</span>
          <strong>{formatCopper(pot.winnerReceives)}</strong>
        </div>
        <div className="stat-pill">
          <span>Tax / burn</span>
          <strong>0 / 0</strong>
        </div>
      </div>
    </div>
  );
}
