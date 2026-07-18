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
      <div
        className="mm-timeline"
        role="img"
        aria-label={`Search timeline: plus or minus 5 percent from 0 seconds, 8 percent from 20 seconds, 10 percent from 40 seconds. Currently at ${seconds} seconds, plus or minus ${range} percent.`}
      >
        <div className="mm-timeline__bar" aria-hidden="true">
          <span className="mm-timeline__band" data-active={range === 5}>
            <em>0–20s</em>
            <strong>±5%</strong>
          </span>
          <span className="mm-timeline__band" data-active={range === 8}>
            <em>20–40s</em>
            <strong>±8%</strong>
          </span>
          <span className="mm-timeline__band" data-active={range === 10}>
            <em>40s+</em>
            <strong>±10%</strong>
          </span>
        </div>
        <span
          className="mm-timeline__cursor"
          style={{ left: `${Math.min(seconds / 45, 1) * 100}%` }}
          aria-hidden="true"
        />
        <p className="mm-timeline__cap" aria-hidden="true">
          Wagered matches cap at ±{MATCHMAKING.wageredMaxRangePercent}% no matter how long the
          search runs.
        </p>
      </div>
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
