'use client';

import { STATUS_EFFECTS } from '@/content/game/cat-battle';

export function StatusEffectsGallery() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Five approved effects</span>
      <h3>Status effect gallery</h3>
      <div className="htp-grid">
        {STATUS_EFFECTS.map((effect) => (
          <div className="panel" key={effect.id}>
            <h3>{effect.name}</h3>
            <p>{effect.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
