'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCUMENTATION_PAGES, DOCUMENTATION_SECTIONS } from '@/content/docs/pages';

export function DocsMobileNav() {
  const pathname = usePathname();

  return (
    <details className="docs-mobile-nav">
      <summary>Browse all guides</summary>
      <div className="docs-mobile-nav__body">
        <Link href="/docs" aria-current={pathname === '/docs' ? 'page' : undefined}>
          Documentation home
        </Link>
        <Link href="/how-to-play">How to Play</Link>
        {DOCUMENTATION_SECTIONS.map((section) => (
          <div className="docs-nav-group" key={section}>
            <strong>{section}</strong>
            {DOCUMENTATION_PAGES.filter((entry) => entry.section === section).map((entry) => (
              <Link
                key={entry.route}
                href={entry.route}
                aria-current={pathname === entry.route ? 'page' : undefined}
              >
                {entry.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
