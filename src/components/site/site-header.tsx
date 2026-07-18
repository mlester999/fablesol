'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { BrandMark } from './brand-mark';
import { ConnectButton } from './connect-button';
import { SocialIconLinks } from './social-links';
import { DocsSearch } from '@/components/docs/docs-search';

const NAV = [
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/docs', label: 'Docs' },
] as const;

export function SiteHeader() {
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
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark />
        <nav className="site-nav" aria-label="Primary">
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
        <div className="site-header__actions">
          <DocsSearch />
          <span className="site-header__socials">
            <SocialIconLinks />
          </span>
          <span className="site-header__connect">
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
                  aria-current={pathname === item.href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/docs/faq" className="btn btn-ghost" onClick={() => setOpen(false)}>
                FAQ
              </Link>
              <Link href="/docs/glossary" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Glossary
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
