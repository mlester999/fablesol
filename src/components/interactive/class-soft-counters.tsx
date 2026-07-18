'use client';

import { CLASS_SOFT_COUNTERS } from '@/content/game/cat-battle';

export function ClassSoftCounters() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Soft strategic relationships</span>
      <h3>Class soft counters</h3>
      <p>These are not automatic wins and do not imply fixed class damage bonuses.</p>
      <ul className="docs-list">
        {CLASS_SOFT_COUNTERS.map((entry) => (
          <li key={entry.note}>{entry.note}</li>
        ))}
      </ul>
    </div>
  );
}
