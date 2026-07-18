import type { ReactNode } from 'react';

export interface FlowStep {
  readonly title: string;
  readonly caption?: string;
  readonly icon?: ReactNode;
}

interface FlowDiagramProps {
  readonly steps: readonly FlowStep[];
  readonly label: string;
  /** Accent family for node borders and connectors. */
  readonly accent?: 'copper' | 'moss' | 'fable';
}

/**
 * Responsive process diagram used by every public flow.
 *
 * One DOM structure for all viewports: a numbered ordered list whose nodes
 * wrap text and grow with content. CSS lays it out as a horizontal
 * progression on wide screens and a vertical stepper on narrow ones —
 * never a shrunken desktop drawing. Being a real list, it is also the
 * screen-reader fallback: no separate hidden variant can drift.
 */
export function FlowDiagram({ steps, label, accent = 'copper' }: FlowDiagramProps) {
  return (
    <div className="flow-diagram-region">
      <ol className="flow-diagram" data-accent={accent} aria-label={label}>
        {steps.map((step, index) => (
          <li className="flow-diagram__step" key={step.title}>
            <span className="flow-diagram__marker" aria-hidden="true">
              {step.icon ?? index + 1}
            </span>
            <span className="flow-diagram__text">
              {/* Icons replace the numbered marker, so restate the order
                  here: multi-column layouts must stay unambiguous. */}
              {step.icon ? (
                <small className="flow-diagram__stepnum" aria-hidden="true">
                  Step {index + 1}
                </small>
              ) : null}
              <strong>{step.title}</strong>
              {step.caption ? <span>{step.caption}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* Small flat icons in the shared Fablesol illustration language, sized for
   flow-diagram markers. Decorative only — titles carry the meaning. */

export function FlowIconWallet() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3" y="6" width="18" height="13" rx="2.5" fill="#6b4f35" />
      <rect x="3" y="9" width="18" height="10" rx="2.5" fill="#8a6a48" />
      <rect x="13.5" y="11.5" width="7.5" height="5" rx="1.6" fill="#f3ead3" />
      <circle cx="16.5" cy="14" r="1.2" fill="#b06b2c" />
    </svg>
  );
}

export function FlowIconCoin() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" fill="#c9a227" />
      <circle cx="12" cy="12" r="6" fill="#e6c95c" />
      <path d="M12 8.6v6.8M8.6 12h6.8" stroke="#8f541f" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FlowIconGate() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M4 20V9l8-5 8 5v11" fill="none" stroke="#2f5d46" strokeWidth="2" />
      <path d="M9 20v-6.5h6V20" fill="#4f8a62" />
      <circle cx="12" cy="9" r="1.6" fill="#e6c95c" />
    </svg>
  );
}

export function FlowIconSprout() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M12 20v-7" stroke="#2f5d46" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14c0-4-3-6-7-6 0 4 3 6 7 6Z" fill="#4f8a62" />
      <path d="M12 12c0-3.4 2.6-4.8 6.4-4.8 0 3.4-2.6 4.8-6.4 4.8Z" fill="#2f5d46" />
    </svg>
  );
}
