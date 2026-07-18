'use client';

import { useMemo, useState } from 'react';
import { getLevelTier } from '@/content/game/economy';
import { formatCopper } from '@/lib/format';

export function NpcCapCalculator() {
  const [level, setLevel] = useState(15);
  const tier = useMemo(() => getLevelTier(level), [level]);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Provisional · educational</span>
      <h3>Level-tier economy lookup</h3>
      <p>
        NPC COPPER caps are account-wide and reset using UTC. Fees derive from the daily cap
        relationship.
      </p>
      <div className="field">
        <label htmlFor="npc-level">Player / tier level (1–50)</label>
        <input
          id="npc-level"
          type="number"
          min={1}
          max={50}
          value={level}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            setLevel(Math.min(50, Math.max(1, Math.round(next))));
          }}
        />
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Tier</span>
          <strong>
            {tier.minLevel}–{tier.maxLevel}
          </strong>
        </div>
        <div className="stat-pill">
          <span>Daily NPC cap</span>
          <strong>{formatCopper(tier.dailyNpcCap)}</strong>
        </div>
        <div className="stat-pill">
          <span>Weekly NPC cap</span>
          <strong>{formatCopper(tier.weeklyNpcCap)}</strong>
        </div>
        <div className="stat-pill">
          <span>Community fee</span>
          <strong>{formatCopper(tier.communityTournamentFee)}</strong>
        </div>
        <div className="stat-pill">
          <span>Wager amount</span>
          <strong>{formatCopper(tier.wagerAmount)}</strong>
        </div>
      </div>
      <p className="live-region" aria-live="polite">
        At level {level}, daily cap {tier.dailyNpcCap} COPPER supports two community entries of{' '}
        {tier.communityTournamentFee} if spent on nothing else.
      </p>
    </div>
  );
}
