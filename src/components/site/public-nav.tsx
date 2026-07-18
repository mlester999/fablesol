'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { BrandMark } from './brand-mark';
import { ConnectButton } from './connect-button';
import { SocialIconLinks } from './social-links';
import { DocsSearch } from '@/components/docs/docs-search';
import { PROJECT_STATUS } from '@/content/game/availability';

const NAV = [
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/docs', label: 'Docs' },
] as const;

const DRAWER_EXTRAS = [
  { href: '/docs/faq', label: 'FAQ' },
  { href: '/docs/glossary', label: 'Glossary' },
  { href: '/play', label: 'Play status' },
] as const;

interface PublicNavProps {
  /**
   * landing — floating translucent bar over the animated world scene.
   * inner — sticky parchment bar for guide and docs routes.
   * Both variants share the exact same structure, links, drawer, and
   * controls; only the surface treatment differs.
   */
  readonly variant: 'landing' | 'inner';
}

export function PublicNav({ variant }: PublicNavProps) {
  const pathname = usePathname();
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

  function isCurrent(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className={`public-nav public-nav--${variant}`}>
      <div className="public-nav__inner">
        <span className="public-nav__brand">
          <BrandMark />
          <span className="public-nav__status" title={PROJECT_STATUS.detail}>
            {PROJECT_STATUS.label}
          </span>
        </span>
        <nav className="public-nav__links" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="public-nav__actions">
          <span className="public-nav__search">
            <DocsSearch />
          </span>
          <span className="public-nav__socials">
            <SocialIconLinks />
          </span>
          <span className="public-nav__connect">
            <ConnectButton />
          </span>
          <button
            type="button"
            className="mobile-nav-toggle"
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
            <div className="drawer__head">
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
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {DRAWER_EXTRAS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn btn-ghost"
                  aria-current={pathname === item.href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
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
