'use client';

import { ACCESS } from '@/content/game/access';

export function AccessFlow() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Access diagram</span>
      <h3>Wallet → $FABLE → game access → off-chain play</h3>
      <svg className="diagram-svg" viewBox="0 0 720 150" role="img" aria-label="Game access flow">
        {['Wallet', '≥10,000 $FABLE', 'Game access', 'Off-chain systems'].map((label, index) => {
          const x = 30 + index * 170;
          return (
            <g key={label}>
              {index < 3 ? (
                <path d={`M ${x + 130} 75 H ${x + 170}`} stroke="#b87333" strokeWidth="2" />
              ) : null}
              <rect x={x} y={40} width={130} height={70} rx="14" fill="#fffdf7" stroke="#b87333" />
              <text x={x + 65} y={80} textAnchor="middle" fontSize="12" fill="#1c2a22">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="docs-steps">
        {ACCESS.accessSteps.map((step) => (
          <li key={step.id}>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
