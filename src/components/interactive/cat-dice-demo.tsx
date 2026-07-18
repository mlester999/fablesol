'use client';

import { useState } from 'react';
import { CAT_DICE } from '@/content/game/cat-battle';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

export function CatDiceDemo() {
  const reduced = usePrefersReducedMotion();
  const [faces, setFaces] = useState<[number, number]>([3, 4]);
  const [message, setMessage] = useState('Illustration only, not a real roll.');

  function roll() {
    const next: [number, number] = [
      1 + Math.floor(Math.random() * 6),
      1 + Math.floor(Math.random() * 6),
    ];
    setFaces(next);
    setMessage(`Illustration result: ${next[0]} and ${next[1]}. Cat level does not change odds.`);
  }

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Illustration · no real rewards</span>
      <h3>Cat Dice explainer</h3>
      <p>{CAT_DICE.keyRule} Cat Dice is luck-based and separate from Cat Battle.</p>
      <div className="stat-grid" aria-hidden={reduced ? undefined : true}>
        <div className="stat-pill">
          <span>Die A</span>
          <strong>{faces[0]}</strong>
        </div>
        <div className="stat-pill">
          <span>Die B</span>
          <strong>{faces[1]}</strong>
        </div>
      </div>
      <button type="button" className="btn btn-secondary" onClick={roll}>
        {reduced ? 'Show sample illustration roll' : 'Roll illustration dice'}
      </button>
      <p className="live-region" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
