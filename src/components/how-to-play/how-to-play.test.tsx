import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { HowToPlayExperience } from './how-to-play-experience';

afterEach(cleanup);

describe('how to play journey', () => {
  it('renders all sixteen chapters in order', () => {
    render(<HowToPlayExperience />);
    const headings = [
      /Welcome to Fablesol/,
      /Your first day/,
      /Choose how to spend your day/,
      /Meet the five animals/,
      /Animal growth and transformations/,
      /Material rarities/,
      /Visit friends’ farms/,
      /How the economy flows/,
      /COPPER and \$FABLE/,
      /Meet your permanent cat/,
      /Cat Dice versus Cat Battle/,
      /Learn Cat Battle/,
      /Equipment and Battle Power/,
      /^Tournaments$/,
      /Fair play and security/,
      /Continue into the full docs/,
    ];
    for (const heading of headings) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
  });

  it('provides a journey navigation covering every chapter', () => {
    render(<HowToPlayExperience />);
    const nav = screen.getByRole('navigation', { name: /journey chapters/i });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(16);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^#[a-z-]+$/);
    }
  });

  it('presents farm visits honestly as planned with the approved capacity', () => {
    const { container } = render(<HowToPlayExperience />);
    const text = container.textContent ?? '';
    // One calm Planned statement, never presented as playable.
    expect(text).toContain('This approved feature is planned and is not available');
    expect(screen.getAllByText('Planned').length).toBe(1);
    // Capacity summary: 10 visitors, 1 owner, 11 maximum, 5 daily care.
    expect(text).toContain('visitors at once');
    expect(text).toContain('players maximum');
    expect(text).toMatch(/only the owner can manage, collect from, or economically benefit/i);
  });

  it('keeps critical rules visible as plain text', () => {
    const { container } = render(<HowToPlayExperience />);
    const text = container.textContent ?? '';
    expect(text).toContain('1% chance of Divine');
    expect(text).toContain('Cat level does not affect Cat Dice probability.');
    expect(text).toMatch(/Auction House tax is\s+exactly 10%/);
    expect(text).toContain('All official game schedules and timestamps are displayed in UTC.');
  });

  it('labels the registration example as educational and non-transactional', () => {
    const { container } = render(<HowToPlayExperience />);
    expect(container.textContent).toMatch(/no real COPPER charged/i);
  });

  it('contains no fake statistics and only truthful availability', () => {
    const { container } = render(<HowToPlayExperience />);
    expect(container.textContent).not.toMatch(/players online/i);
    expect(container.textContent).not.toMatch(/monthly (active )?users/i);
  });

  it('uses no em dashes or status-dashboard wording in rendered copy', () => {
    const { container } = render(<HowToPlayExperience />);
    expect(container.textContent).not.toContain('—');
    expect(container.textContent).not.toMatch(/feature status:/i);
  });
});
