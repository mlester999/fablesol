import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessFlow } from './access-flow';
import { EconomyExplorer } from './economy-explorer';
import { FarmVisitExplorer } from './farm-visit-explorer';
import { AnimalProgression } from './animal-progression';
import { EnergySimulator } from './energy-simulator';
import { FlowDiagram } from '@/components/site/flow-diagram';
import { ACCESS } from '@/content/game/access';
import { COMMUNITY_CARE } from '@/content/game/farm-visits';

afterEach(cleanup);

describe('flow diagram', () => {
  it('renders every step in one responsive list — no hidden desktop-only variant', () => {
    const { container } = render(
      <FlowDiagram
        label="Example flow"
        steps={[
          { title: 'A very long step title that must wrap safely inside its node' },
          { title: 'Second', caption: 'With a caption' },
        ]}
      />,
    );
    const lists = container.querySelectorAll('.flow-diagram');
    expect(lists).toHaveLength(1);
    const steps = within(lists[0] as HTMLElement).getAllByRole('listitem');
    expect(steps).toHaveLength(2);
    expect(lists[0]?.textContent).toContain('wrap safely');
    expect(lists[0]?.textContent).toContain('With a caption');
  });
});

describe('access flow', () => {
  it('shows all four access steps with their real captions', () => {
    const { container } = render(<AccessFlow />);
    for (const step of ACCESS.accessSteps) {
      expect(container.textContent).toContain(step.title);
      expect(container.textContent).toContain(step.text);
    }
  });
});

describe('economy explorer', () => {
  it('keeps $FABLE access visually separate from COPPER circulation', () => {
    render(<EconomyExplorer />);
    const gate = screen.getByRole('group', { name: /separate from COPPER/i });
    expect(gate.textContent).toContain('COPPER circulation');
    expect(gate.textContent).toContain('$FABLE access gate');
    expect(gate.textContent).toMatch(/never an automatic COPPER conversion/i);
  });

  it('switches lenses without losing the flow structure', async () => {
    const user = userEvent.setup();
    const { container } = render(<EconomyExplorer />);
    await user.click(screen.getByRole('tab', { name: 'Trader view' }));
    expect(container.textContent).toContain('Auction House (10% tax)');
    expect(container.querySelectorAll('.flow-diagram')).toHaveLength(1);
  });
});

describe('community care meter', () => {
  it('walks 0/5 to 5/5, one percent per contribution, capped at the daily maximum', async () => {
    const user = userEvent.setup();
    const max = COMMUNITY_CARE.maxContributionsPerFarmPerDay;
    render(<FarmVisitExplorer />);
    await user.click(screen.getByRole('tab', { name: 'Community Care' }));
    expect(screen.getByText(new RegExp(`0/${max} daily care`))).toBeTruthy();
    for (let index = 0; index < max; index += 1) {
      await user.click(screen.getByRole('button', { name: `Visitor ${index + 1} helps` }));
    }
    expect(screen.getAllByText(new RegExp(`${max}/${max} daily care`)).length).toBeGreaterThan(0);
    expect(
      screen.getByText(new RegExp(`\\+${COMMUNITY_CARE.maxDailyBenefitPercent}% provisional`)),
    ).toBeTruthy();
    const cappedButton = screen.getByRole('button', { name: /daily maximum reached/i });
    expect(cappedButton.hasAttribute('disabled')).toBe(true);
    await user.click(screen.getByRole('button', { name: /reset example/i }));
    expect(screen.getByText(new RegExp(`0/${max} daily care`))).toBeTruthy();
  });

  it('states what community care never does', async () => {
    const user = userEvent.setup();
    const { container } = render(<FarmVisitExplorer />);
    await user.click(screen.getByRole('tab', { name: 'Community Care' }));
    expect(container.textContent).toMatch(
      /never creates COPPER, never creates materials, and never improves the 1% Divine chance/i,
    );
  });
});

describe('animal transformation explorer', () => {
  it('shows the milestone track and rarity with a text label, not color alone', () => {
    render(<AnimalProgression />);
    expect(screen.getByRole('img', { name: /transformation milestones/i })).toBeTruthy();
    expect(screen.getByText('Common Milk')).toBeTruthy();
  });

  it('keeps the honest 1% Divine framing at level 50', async () => {
    const user = userEvent.setup();
    render(<AnimalProgression />);
    const numberInput = screen.getByRole('spinbutton', { name: /animal level number/i });
    await user.clear(numberInput);
    await user.type(numberInput, '50');
    expect(screen.getByText(/Divine chance at level 50: 1%/)).toBeTruthy();
    expect(screen.getByText(/Mythic remains\s+the normal result/)).toBeTruthy();
  });
});

describe('energy simulator', () => {
  it('exposes the meter with an accessible current value', () => {
    render(<EnergySimulator />);
    expect(screen.getByRole('img', { name: 'Energy 50 of 100' })).toBeTruthy();
  });
});
