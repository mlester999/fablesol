'use client';

import { useMemo, useState } from 'react';
import {
  ANIMALS,
  DIVINE_CHANCE_AT_LEVEL_50,
  formatMaterialName,
  getMaterialRarityForLevel,
  getTransformationMilestone,
  TRANSFORMATION_MILESTONES,
  type AnimalId,
} from '@/content/game/animals';
import { AnimalPortrait } from '@/components/site/game-illustrations';

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
      <h3>Animal transformation explorer</h3>
      <p>Choose an animal and level to preview transformation milestone and material rarity.</p>
      <div className="chip-row" role="group" aria-label="Select animal">
        {ANIMALS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="chip chip--portrait"
            aria-pressed={animalId === entry.id}
            onClick={() => setAnimalId(entry.id)}
          >
            <AnimalPortrait animal={entry.id} className="chip__portrait" />
            {entry.name}
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
      <div
        className="milestone-track"
        role="img"
        aria-label={`Transformation milestones at levels ${TRANSFORMATION_MILESTONES.join(', ')}. Current appearance milestone: level ${milestone}.`}
      >
        <span
          className="milestone-track__fill"
          style={{ width: `${((level - 1) / 49) * 100}%` }}
          aria-hidden="true"
        />
        {TRANSFORMATION_MILESTONES.map((mark) => (
          <span
            key={mark}
            className="milestone-track__mark"
            data-reached={level >= mark}
            data-current={milestone === mark}
            style={{ left: `${((mark - 1) / 49) * 100}%` }}
            aria-hidden="true"
          >
            {mark}
          </span>
        ))}
      </div>
      <div className="stat-grid">
        <div className="stat-pill stat-pill--portrait">
          <span>Animal</span>
          <AnimalPortrait animal={animal.id} className="stat-pill__art" />
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
          <strong>
            <span
              className="rarity-dot"
              data-rarity={rarity.rarity.toLowerCase()}
              aria-hidden="true"
            />
            {materialName}
          </strong>
        </div>
      </div>
      <p className="live-region" aria-live="polite">
        {rarity.note}
      </p>
      {level === 50 ? (
        <p>
          Divine chance at level 50: {Math.round(DIVINE_CHANCE_AT_LEVEL_50 * 100)}%. Mythic remains
          the normal result.
        </p>
      ) : null}
    </div>
  );
}
