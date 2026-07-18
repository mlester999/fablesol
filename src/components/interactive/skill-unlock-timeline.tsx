'use client';

import { SKILL_LOADOUT } from '@/content/game/cat-battle';

export function SkillUnlockTimeline() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Progression</span>
      <h3>Skill unlock timeline</h3>
      <ol className="docs-steps">
        {SKILL_LOADOUT.unlocks.map((entry) => (
          <li key={String(entry.level) + entry.unlock}>
            <strong>Level {entry.level}</strong>
            <span>{entry.unlock}</span>
          </li>
        ))}
      </ol>
      <p>Equipped actives: {SKILL_LOADOUT.equippedActiveSkills}. Skills lock after matchmaking.</p>
    </div>
  );
}
