import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LandingNav } from './landing-nav';
import { WorldSceneFallback } from './world-scene-fallback';
import PlayPage from '@/app/(guides)/play/page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

describe('landing navigation', () => {
  it('shows brand, How to Play, Docs, socials, and Connect', () => {
    render(<LandingNav />);
    expect(screen.getByText('Fablesol')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'How to Play' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Docs' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Connect' }).length).toBeGreaterThan(0);
    // Honest project status — no invented "beta" badge.
    expect(screen.getByText('In development')).toBeTruthy();
  });

  it('contains no fake statistics', () => {
    const { container } = render(<LandingNav />);
    expect(container.textContent).not.toMatch(/players online/i);
    expect(container.textContent).not.toMatch(/monthly/i);
  });
});

describe('world scene fallback', () => {
  it('renders the static farm illustration with an accessible description', () => {
    render(<WorldSceneFallback />);
    expect(screen.getByRole('img', { name: /cozy farm village/i })).toBeTruthy();
  });
});

describe('play availability page', () => {
  it('is honest that the world is not playable yet', () => {
    render(<PlayPage />);
    expect(screen.getByText(/The world is being built/)).toBeTruthy();
    expect(screen.getByText(/no playable build/i)).toBeTruthy();
    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
  });
});
