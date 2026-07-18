import Link from 'next/link';
import type { Metadata } from 'next';
import { AvailabilityBadge } from '@/components/site/availability-badge';
import { SocialIconLinks } from '@/components/site/social-links';
import { createDocumentationMetadata } from '@/content/docs/metadata';
import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { PROJECT_STATUS } from '@/content/game/availability';

export const metadata: Metadata = createDocumentationMetadata({
  title: `Play ${GAME_NAME}`,
  description: `${GAME_NAME}'s playable world is in active development. See what is live today and how to get ready for opening day.`,
  route: '/play',
});

export default function PlayPage() {
  return (
    <div className="home-hero play-page">
      <div>
        <p className="docs-eyebrow">
          Play {GAME_NAME} · <AvailabilityBadge feature="game-world" />
        </p>
        <h1>The world is being built</h1>
        <p>
          {PROJECT_STATUS.detail} There is no playable build to enter yet, and we will never pretend
          otherwise.
        </p>
        <p>
          <strong>{GAME_PHILOSOPHY}</strong> While the farm takes shape, you can learn every
          confirmed rule, from the 10,000 $FABLE access requirement to the level-50 Divine chance.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/how-to-play">
            Learn how to play
          </Link>
          <Link className="btn btn-secondary" href="/docs/getting-started">
            Getting started guide
          </Link>
          <Link className="btn btn-ghost" href="/docs">
            Browse all docs
          </Link>
        </div>
      </div>
      <aside className="panel">
        <h2 style={{ fontFamily: 'var(--fb-font-display)', fontSize: '1.35rem', margin: 0 }}>
          Get ready for opening day
        </h2>
        <ul className="docs-list" style={{ margin: 0 }}>
          <li>Read the access guide: entry requires holding at least 10,000 $FABLE on Solana</li>
          <li>Learn the two currencies: off-chain COPPER and on-chain $FABLE</li>
          <li>Meet the five farm animals and the seven material rarities</li>
          <li>Preview Cat Dice, Cat Battle, and tournament rules</li>
        </ul>
        <div className="cta-row" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--fb-muted)', fontSize: '0.9rem' }}>Follow along:</span>
          <SocialIconLinks showLabels />
        </div>
      </aside>
    </div>
  );
}
