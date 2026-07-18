import Link from 'next/link';
import { BrandMark } from '@/components/site/brand-mark';

export default function NotFound() {
  return (
    <main id="main-content" className="home-hero">
      <div className="panel" style={{ gap: '1rem' }}>
        <BrandMark />
        <p className="docs-eyebrow">404</p>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--fb-font-display)',
            fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
          }}
        >
          Page not found
        </h1>
        <p style={{ margin: 0, color: 'var(--fb-ink-soft)', lineHeight: 1.65 }}>
          That page does not exist. Try the docs home, search, or the How to Play journey.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/docs">
            Documentation home
          </Link>
          <Link className="btn btn-secondary" href="/how-to-play">
            How to Play
          </Link>
          <Link className="btn btn-ghost" href="/">
            Site home
          </Link>
        </div>
      </div>
    </main>
  );
}
