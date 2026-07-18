import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvailabilityBadge } from './availability-badge';
import { ConnectButton } from './connect-button';
import { PublicNav } from './public-nav';
import { SiteHeader } from './site-header';
import { SocialIconLinks } from './social-links';
import { SOCIAL_LINKS } from '@/lib/site-links';
import { FEATURE_AVAILABILITY } from '@/content/game/availability';

vi.mock('next/navigation', () => ({
  usePathname: () => '/docs',
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

describe('site header', () => {
  it('offers the consistent premium navigation set with an active state', () => {
    render(<SiteHeader />);
    expect(screen.getByText('Fablesol')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'How to Play' })).toBeTruthy();
    const docsLink = screen.getByRole('link', { name: 'Docs' });
    expect(docsLink.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: /Search/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Connect' }).length).toBeGreaterThan(0);
  });

  it('shows the honest project status on inner pages too', () => {
    render(<SiteHeader />);
    expect(screen.getByText('In development')).toBeTruthy();
  });

  it('exposes only Discord and X as social platforms', () => {
    const { container } = render(<SiteHeader />);
    const socialText = container.textContent ?? '';
    expect(socialText).not.toMatch(/telegram|instagram|facebook|youtube|tiktok|reddit/i);
  });
});

describe('shared public navigation', () => {
  async function openDrawerLinkLabels(header: HTMLElement): Promise<string[]> {
    const user = userEvent.setup();
    await user.click(within(header).getByRole('button', { name: /open menu/i }));
    const drawer = within(header).getByRole('dialog', { name: /mobile navigation/i });
    return within(drawer)
      .getAllByRole('link')
      .map((link) => link.textContent ?? '');
  }

  it('renders one identical mobile drawer for both surfaces', async () => {
    const inner = render(<PublicNav variant="inner" />);
    const innerLinks = await openDrawerLinkLabels(inner.container.querySelector('header')!);
    cleanup();
    const landing = render(<PublicNav variant="landing" />);
    const landingLinks = await openDrawerLinkLabels(landing.container.querySelector('header')!);
    expect(innerLinks).toEqual(landingLinks);
    expect(innerLinks).toEqual(['How to Play', 'Docs', 'FAQ', 'Glossary', 'Play status']);
  });

  it('keeps the same structure across variants — only the surface class changes', () => {
    const inner = render(<PublicNav variant="inner" />);
    const innerHeader = inner.container.querySelector('header')!;
    const innerParts = [
      '.public-nav__brand',
      '.public-nav__status',
      '.public-nav__links',
      '.public-nav__search',
      '.public-nav__socials',
      '.public-nav__connect',
      '.mobile-nav-toggle',
    ].map((selector) => innerHeader.querySelector(selector) !== null);
    cleanup();
    const landing = render(<PublicNav variant="landing" />);
    const landingHeader = landing.container.querySelector('header')!;
    const landingParts = [
      '.public-nav__brand',
      '.public-nav__status',
      '.public-nav__links',
      '.public-nav__search',
      '.public-nav__socials',
      '.public-nav__connect',
      '.mobile-nav-toggle',
    ].map((selector) => landingHeader.querySelector(selector) !== null);
    expect(innerParts).toEqual([true, true, true, true, true, true, true]);
    expect(landingParts).toEqual(innerParts);
    expect(innerHeader.className).toContain('public-nav--inner');
    expect(landingHeader.className).toContain('public-nav--landing');
  });

  it('marks the active route in the primary links', () => {
    render(<PublicNav variant="landing" />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const docsLink = within(nav).getByRole('link', { name: 'Docs' });
    expect(docsLink.getAttribute('aria-current')).toBe('page');
  });
});

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
