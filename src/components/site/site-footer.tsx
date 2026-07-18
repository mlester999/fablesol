import Link from 'next/link';
import { GAME_NAME, GAME_PHILOSOPHY, DOCUMENTATION_REVISION } from '@/content/game/brand';
import { BrandMark } from './brand-mark';
import { SocialIconLinks } from './social-links';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div>
            <BrandMark />
            <p className="site-footer__meta">
              {GAME_NAME} player documentation. {GAME_PHILOSOPHY}
            </p>
            <p className="site-footer__meta">{DOCUMENTATION_REVISION}</p>
          </div>
          <div>
            <strong>Guides</strong>
            <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.6rem' }}>
              <Link href="/how-to-play">How to Play</Link>
              <Link href="/docs">Documentation</Link>
              <Link href="/docs/getting-started">Getting started</Link>
              <Link href="/docs/faq">FAQ</Link>
            </div>
          </div>
          <div>
            <strong>Systems</strong>
            <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.6rem' }}>
              <Link href="/docs/economy">Economy</Link>
              <Link href="/docs/cat">Permanent cat</Link>
              <Link href="/docs/cat-battle">Cat Battle</Link>
              <Link href="/docs/tournaments">Tournaments</Link>
            </div>
          </div>
          <div>
            <strong>Community</strong>
            <div className="site-footer__socials">
              <SocialIconLinks showLabels />
            </div>
          </div>
        </div>
        <p className="site-footer__meta">
          All official game schedules and timestamps are displayed in UTC. COPPER is off-chain.
          $FABLE is on-chain on Solana. Digital asset values can change; this site is not financial
          advice.
        </p>
      </div>
    </footer>
  );
}
