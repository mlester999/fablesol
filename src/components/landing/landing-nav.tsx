'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { BrandMark } from '@/components/site/brand-mark';
import { ConnectButton } from '@/components/site/connect-button';
import { SocialIconLinks } from '@/components/site/social-links';
import { PROJECT_STATUS } from '@/content/game/availability';

const NAV = [
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/docs', label: 'Docs' },
] as const;

/** Floating translucent navigation for the landing world view. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="landing-nav">
      <div className="landing-nav__inner">
        <span className="landing-nav__brand">
          <BrandMark />
          <span className="landing-nav__status" title={PROJECT_STATUS.detail}>
            {PROJECT_STATUS.label}
          </span>
        </span>
        <nav className="landing-nav__links" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="landing-nav__actions">
          <span className="landing-nav__socials">
            <SocialIconLinks />
          </span>
          <span className="landing-nav__connect">
            <ConnectButton />
          </span>
          <button
            type="button"
            className="mobile-nav-toggle landing-nav__toggle"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open ? (
        <div className="drawer" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="drawer__panel"
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="site-header__actions" style={{ justifyContent: 'space-between' }}>
              <strong>Menu</strong>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <nav aria-label="Mobile primary">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/play" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Play status
              </Link>
            </nav>
            <div className="drawer__meta">
              <SocialIconLinks showLabels />
            </div>
            <ConnectButton />
          </div>
        </div>
      ) : null}
    </header>
  );
}
