'use client';

import { ACCESS } from '@/content/game/access';
import {
  FlowDiagram,
  FlowIconCoin,
  FlowIconGate,
  FlowIconSprout,
  FlowIconWallet,
} from '@/components/site/flow-diagram';

const STEP_ICONS = [
  <FlowIconWallet key="wallet" />,
  <FlowIconCoin key="coin" />,
  <FlowIconGate key="gate" />,
  <FlowIconSprout key="sprout" />,
];

export function AccessFlow() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">First-day journey</span>
      <h3>From wallet to your first cozy day</h3>
      <FlowDiagram
        label="Game access flow"
        accent="copper"
        steps={ACCESS.accessSteps.map((step, index) => ({
          title: step.title,
          caption: step.text,
          icon: STEP_ICONS[index],
        }))}
      />
    </div>
  );
}
