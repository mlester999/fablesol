'use client';

import { useMemo, useState } from 'react';
import { getLevelTier } from '@/content/game/economy';
import { formatCopper } from '@/lib/format';

export function TournamentFeeCalculator() {
  const [level, setLevel] = useState(22);
  const tier = useMemo(() => getLevelTier(level), [level]);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational</span>
      <h3>Community tournament fee</h3>
      <p>Entrance fee is half the daily NPC COPPER cap for the level tier.</p>
      <div className="field">
        <label htmlFor="fee-level">Level</label>
        <input
          id="fee-level"
          type="number"
          min={1}
          max={50}
          value={level}
          onChange={(event) => setLevel(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
        />
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Daily NPC cap</span>
          <strong>{formatCopper(tier.dailyNpcCap)}</strong>
        </div>
        <div className="stat-pill">
          <span>Community fee</span>
          <strong>{formatCopper(tier.communityTournamentFee)}</strong>
        </div>
        <div className="stat-pill">
          <span>Two entries</span>
          <strong>{formatCopper(tier.communityTournamentFee * 2)}</strong>
        </div>
      </div>
    </div>
  );
}
