'use client';

import { useEffect, useState } from 'react';
import { MATCHMAKING } from '@/content/game/cat-battle';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

export function MatchmakingTimeline() {
  const reduced = usePrefersReducedMotion();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || reduced) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value >= 45) {
          setRunning(false);
          return 45;
        }
        return value + 1;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, reduced]);

  const range = seconds >= 40 ? 10 : seconds >= 20 ? 8 : 5;

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational preview</span>
      <h3>Matchmaking range expansion</h3>
      <p>
        Same level tier, similar Battle Power. Wagered matches never exceed ±
        {MATCHMAKING.wageredMaxRangePercent}%.
      </p>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Elapsed</span>
          <strong>{seconds}s</strong>
        </div>
        <div className="stat-pill">
          <span>Search range</span>
          <strong>±{range}%</strong>
        </div>
        <div className="stat-pill">
          <span>Wagered max</span>
          <strong>±{MATCHMAKING.wageredMaxRangePercent}%</strong>
        </div>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className="chip"
          onClick={() => {
            setSeconds(0);
            setRunning(!reduced);
          }}
        >
          {reduced ? 'Show start (±5%)' : running ? 'Running…' : 'Simulate search'}
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
          }}
        >
          0s · ±5%
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            setRunning(false);
            setSeconds(20);
          }}
        >
          20s · ±8%
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            setRunning(false);
            setSeconds(40);
          }}
        >
          40s · ±10%
        </button>
      </div>
      <ul className="docs-list">
        {MATCHMAKING.expansion.map((step) => (
          <li key={step.atSeconds}>
            At {step.atSeconds}s: ±{step.rangePercent}%
          </li>
        ))}
      </ul>
      <p className="live-region" aria-live="polite">
        Current educational range: ±{range}%
      </p>
    </div>
  );
}
