import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AuctionTaxCalculator } from './auction-tax-calculator';
import { EnergySimulator } from './energy-simulator';
import { NpcCapCalculator } from './npc-cap-calculator';

describe('interactive calculators', () => {
  it('updates auction house split', async () => {
    const user = userEvent.setup();
    render(<AuctionTaxCalculator />);
    const input = screen.getByLabelText(/hypothetical sale price/i);
    await user.clear(input);
    await user.type(input, '2000');
    expect(screen.getByText(/sale 2000/i)).toBeInTheDocument();
    expect(screen.getByText(/tax 200/i)).toBeInTheDocument();
  });

  it('handles insufficient energy', async () => {
    const user = userEvent.setup();
    render(<EnergySimulator />);
    await user.click(screen.getByRole('button', { name: /ultimate example/i }));
    expect(screen.getByText(/insufficient energy/i)).toBeInTheDocument();
  });

  it('looks up npc caps for a level', async () => {
    const user = userEvent.setup();
    render(<NpcCapCalculator />);
    const input = screen.getByLabelText(/player \/ tier level/i);
    await user.clear(input);
    await user.type(input, '42');
    expect(screen.getByText(/41–50/)).toBeInTheDocument();
    expect(screen.getAllByText(/500 COPPER/).length).toBeGreaterThan(0);
  });
});
