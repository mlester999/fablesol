'use client';

import { useMemo, useState } from 'react';
import { ACTIVITIES, DAY_CHOICES } from '@/content/game/activities';

type ChoiceId = (typeof DAY_CHOICES)[number]['id'];

export function ActivityExplorer() {
  const [choiceId, setChoiceId] = useState<ChoiceId>(DAY_CHOICES[0]!.id);
  const choice = DAY_CHOICES.find((entry) => entry.id === choiceId)!;
  const activities = useMemo(
    () =>
      ACTIVITIES.filter((activity) =>
        (choice.activities as readonly string[]).includes(activity.id),
      ),
    [choice],
  );

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Choose your day</span>
      <h3>Core activity explorer</h3>
      <p>Different playstyles are welcome. Competitive cat modes are optional.</p>
      <div className="chip-row">
        {DAY_CHOICES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="chip"
            aria-pressed={choiceId === entry.id}
            onClick={() => setChoiceId(entry.id)}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <div className="panel">
        <h3>{choice.title}</h3>
        <p>{choice.description}</p>
        <ul className="docs-list">
          {activities.map((activity) => (
            <li key={activity.id}>
              <strong>{activity.name}:</strong> {activity.summary}
            </li>
          ))}
        </ul>
        <p>
          <small>
            These gameplay activities are planned for the playable world and are not available in
            the current game build.
          </small>
        </p>
      </div>
    </div>
  );
}
