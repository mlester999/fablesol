import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityBadge } from './availability-badge';
import { ConnectButton } from './connect-button';
import { SocialIconLinks } from './social-links';
import { SOCIAL_LINKS } from '@/lib/site-links';
import { FEATURE_AVAILABILITY } from '@/content/game/availability';

afterEach(cleanup);

describe('social links', () => {
  it('approves only Discord and X', () => {
    expect(SOCIAL_LINKS.map((link) => link.id)).toEqual(['discord', 'x']);
  });

  it('renders an honest pending state instead of dead links when unconfigured', () => {
    const { container } = render(<SocialIconLinks showLabels />);
    const anchors = container.querySelectorAll('a');
    for (const anchor of anchors) {
      // Any rendered anchor must be a configured https URL with safe rel.
      expect(anchor.getAttribute('href')).toMatch(/^https:\/\//);
      expect(anchor.getAttribute('rel')).toContain('noopener');
      expect(anchor.getAttribute('target')).toBe('_blank');
    }
    // Every approved platform appears either as a real link or a pending chip.
    expect(screen.getAllByText(/Discord/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^X$/).length).toBeGreaterThan(0);
  });
});

describe('connect button', () => {
  it('never fakes a connected wallet state', async () => {
    const user = userEvent.setup();
    render(<ConnectButton />);
    // jsdom lacks native dialog methods; stub them.
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = () => {
      dialog.setAttribute('open', '');
    };
    dialog.close = () => {
      dialog.removeAttribute('open');
    };
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    const scope = within(dialog);
    expect(scope.getByText(/No wallet is connected right now/)).toBeTruthy();
    expect(scope.getByText(/never ask for your seed phrase/i)).toBeTruthy();
    // No fabricated address or connected claim anywhere.
    expect(dialog.textContent).not.toMatch(/0x[0-9a-fA-F]{6,}/);
    expect(dialog.textContent?.toLowerCase()).not.toContain('connected!');
    // The planned status is honest.
    expect(scope.getByText('Planned')).toBeTruthy();
  });
});

describe('availability badges', () => {
  it('renders label text, not color alone', () => {
    const { container } = render(<AvailabilityBadge feature="game-world" />);
    const badge = container.querySelector('.availability-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('Planned');
    expect(
      badge?.querySelector('.availability-badge__symbol')?.textContent?.length,
    ).toBeGreaterThan(0);
  });

  it('keeps gameplay features honest — nothing playable is marked live', () => {
    const liveIds = FEATURE_AVAILABILITY.filter((f) => f.status === 'live').map((f) => f.id);
    // Only the documentation surfaces are live in Phase 1.
    expect(liveIds.sort()).toEqual(['docs-search', 'guides', 'how-to-play']);
  });
});
