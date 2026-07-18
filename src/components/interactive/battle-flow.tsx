'use client';

import { BATTLE_FLOW, CAT_BATTLE } from '@/content/game/cat-battle';

export function BattleFlow() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Battle flow</span>
      <h3>How a Cat Battle unfolds</h3>
      <p>
        {CAT_BATTLE.format}, turn-based, {CAT_BATTLE.turnTimerSeconds}s timer, validated by the
        game.
      </p>
      <ol className="docs-steps">
        {BATTLE_FLOW.map((step, index) => (
          <li key={step}>
            <strong>Step {index + 1}</strong>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
