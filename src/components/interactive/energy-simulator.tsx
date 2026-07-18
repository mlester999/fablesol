'use client';

import { useState } from 'react';
import { applyEnergyAfterAction, ENERGY } from '@/content/game/cat-battle';

const ACTIONS = [
  { id: 'basic', label: 'Basic Attack', cost: ENERGY.basicAttackCost },
  { id: 'active', label: 'Active skill example', cost: ENERGY.exampleActiveSkillCost },
  { id: 'ultimate', label: 'Ultimate example', cost: ENERGY.exampleUltimateCost },
] as const;

export function EnergySimulator() {
  const [energy, setEnergy] = useState<number>(ENERGY.starting);
  const [message, setMessage] = useState('Start at 50 Energy. Choose an action.');

  function act(cost: number, label: string) {
    const result = applyEnergyAfterAction(energy, cost);
    if (!result.canAfford) {
      setMessage(`Insufficient Energy for ${label}. Need ${cost}, have ${result.before}.`);
      return;
    }
    setEnergy(result.afterGain);
    setMessage(
      `${label}: spent ${result.cost}, then +${ENERGY.gainAfterAction} → ${result.afterGain}${
        result.capped ? ' (capped at 100)' : ''
      }.`,
    );
  }

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Documentation simulator</span>
      <h3>Energy timeline</h3>
      <p>
        Start {ENERGY.starting}, max {ENERGY.maximum}, gain {ENERGY.gainAfterAction} after each
        action.
      </p>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Current Energy</span>
          <strong>{energy}</strong>
        </div>
      </div>
      <div className="chip-row">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            className="chip"
            onClick={() => act(action.cost, action.label)}
          >
            {action.label} ({action.cost})
          </button>
        ))}
        <button
          type="button"
          className="chip"
          onClick={() => {
            setEnergy(ENERGY.starting);
            setMessage('Reset to 50 Energy.');
          }}
        >
          Reset
        </button>
      </div>
      <p className="live-region" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
