'use client';

import { useMemo, useState } from 'react';
import { calculateCommunityPrizePool, getLevelTier } from '@/content/game/economy';
import { formatCopper } from '@/lib/format';

export function PrizePoolDemo() {
  const [level, setLevel] = useState(18);
  const [entrants, setEntrants] = useState(8);
  const tier = useMemo(() => getLevelTier(level), [level]);
  const pool = useMemo(
    () => calculateCommunityPrizePool(entrants, tier.communityTournamentFee),
    [entrants, tier.communityTournamentFee],
  );

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational prize pool</span>
      <h3>Community prize pool</h3>
      <p>Entrants × entrance fee = COPPER prize pool. 100% of fees. No tax or developer cut.</p>
      <div className="control-row">
        <div className="field">
          <label htmlFor="pool-level">Level</label>
          <input
            id="pool-level"
            type="number"
            min={1}
            max={50}
            value={level}
            onChange={(event) =>
              setLevel(Math.min(50, Math.max(1, Number(event.target.value) || 1)))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="pool-entrants">Entrants</label>
          <input
            id="pool-entrants"
            type="number"
            min={0}
            max={256}
            value={entrants}
            onChange={(event) =>
              setEntrants(Math.max(0, Math.floor(Number(event.target.value) || 0)))
            }
          />
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Fee each</span>
          <strong>{formatCopper(tier.communityTournamentFee)}</strong>
        </div>
        <div className="stat-pill">
          <span>Entrants</span>
          <strong>{entrants}</strong>
        </div>
        <div className="stat-pill">
          <span>Prize pool</span>
          <strong>{formatCopper(pool)}</strong>
        </div>
      </div>
      <p className="live-region" aria-live="polite">
        {entrants} × {tier.communityTournamentFee} = {pool} COPPER
        {entrants < 2 ? ' · Fewer than 2 players would refund registrants.' : ''}
      </p>
    </div>
  );
}
