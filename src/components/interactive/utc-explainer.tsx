'use client';

import { TIMEZONE_RULE } from '@/content/game/tournaments';

export function UtcExplainer() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Timezone rule</span>
      <h3>UTC is authoritative</h3>
      <p>{TIMEZONE_RULE.statement}</p>
      <div className="panel">
        <p>
          <strong>Example registration deadline:</strong> 2026-09-01 17:00 UTC
        </p>
        <p>
          <strong>Example tournament start:</strong> 2026-09-01 18:00 UTC
        </p>
        <p>{TIMEZONE_RULE.noAutoLocalConversion}</p>
      </div>
      <p>You may convert privately, but official UI and documentation keep the UTC label.</p>
    </div>
  );
}
