import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/landing-nav';
import { WorldHero } from '@/components/landing/world-hero';
import { AvailabilityBadge } from '@/components/site/availability-badge';
import { GAME_DESCRIPTION, GAME_NAME, GAME_TAGLINE, SITE_URL } from '@/content/game/brand';
import { PROJECT_STATUS } from '@/content/game/availability';

export const metadata: Metadata = {
  title: `${GAME_NAME} · ${GAME_TAGLINE}`,
  description: GAME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${GAME_NAME} · ${GAME_TAGLINE}`,
    description: GAME_DESCRIPTION,
    url: SITE_URL,
    siteName: GAME_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${GAME_NAME} · ${GAME_TAGLINE}`,
    description: GAME_DESCRIPTION,
  },
};

export default function LandingPage() {
  return (
    <div className="landing">
      <WorldHero />
      <LandingNav />
      <main id="main-content" className="landing__main">
        <div className="landing__hero">
          <p className="landing__eyebrow">A cozy multiplayer farming world</p>
          <h1 className="landing__title">{GAME_NAME}</h1>
          <p className="landing__description">
            Care for animals, gather rare materials, trade in a fair player economy, and challenge
            friends with your permanent cat companion — all in one welcoming pixel world.
          </p>
          <div className="landing__cta cta-row">
            <Link className="btn btn-primary btn-large" href="/play">
              Play Now
            </Link>
            <Link className="btn btn-secondary btn-large" href="/how-to-play">
              How to Play
            </Link>
          </div>
          <div className="landing__truth">
            <span className="landing__truth-item">
              Player guides <AvailabilityBadge feature="guides" />
            </span>
            <span className="landing__truth-item">
              Game world <AvailabilityBadge feature="game-world" />
            </span>
          </div>
        </div>
      </main>
      <footer className="landing__footer">
        <p>
          {GAME_NAME} — cozy first, competitive second. COPPER is off-chain; $FABLE is on-chain on
          Solana. All official schedules use UTC.{' '}
          <Link href="/docs">Read the full player docs</Link>.
        </p>
        <p className="landing__footer-note">{PROJECT_STATUS.detail}</p>
      </footer>
    </div>
  );
}
