'use client';

import { useMemo, useState } from 'react';
import {
  ANIMALS,
  formatMaterialName,
  getMaterialRarityForLevel,
  getTransformationMilestone,
  type AnimalId,
} from '@/content/game/animals';

export function AnimalProgression() {
  const [animalId, setAnimalId] = useState<AnimalId>('cow');
  const [level, setLevel] = useState(1);
  const animal = ANIMALS.find((entry) => entry.id === animalId)!;
  const rarity = useMemo(() => getMaterialRarityForLevel(level), [level]);
  const milestone = getTransformationMilestone(level);
  const materialName = formatMaterialName(animal, rarity.rarity);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational preview</span>
      <h3>Animal progression showcase</h3>
      <p>Choose an animal and level to preview transformation milestone and material rarity.</p>
      <div className="chip-row" role="group" aria-label="Select animal">
        {ANIMALS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="chip"
            aria-pressed={animalId === entry.id}
            onClick={() => setAnimalId(entry.id)}
          >
            <span aria-hidden="true">{entry.emoji}</span> {entry.name}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="animal-level">Animal level (1–50)</label>
        <input
          id="animal-level"
          type="range"
          min={1}
          max={50}
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
        />
        <input
          type="number"
          min={1}
          max={50}
          value={level}
          aria-label="Animal level number"
          onChange={(event) => setLevel(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
        />
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Animal</span>
          <strong>{animal.name}</strong>
        </div>
        <div className="stat-pill">
          <span>Level</span>
          <strong>{level}</strong>
        </div>
        <div className="stat-pill">
          <span>Visual milestone</span>
          <strong>Level {milestone}</strong>
        </div>
        <div className="stat-pill">
          <span>Material</span>
          <strong>{materialName}</strong>
        </div>
      </div>
      <p className="live-region" aria-live="polite">
        {rarity.note}
      </p>
      {level === 50 ? (
        <p>Divine chance at level 50: 1%. Mythic remains the normal result.</p>
      ) : null}
    </div>
  );
}
