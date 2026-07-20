import Link from 'next/link';
import type { Metadata } from 'next';

import { ConnectButton } from '@/components/site/connect-button';
import { SocialIconLinks } from '@/components/site/social-links';
import { VerifyAccessButton } from '@/components/play/play-actions';
import { createDocumentationMetadata } from '@/content/docs/metadata';
import { GAME_NAME, GAME_PHILOSOPHY } from '@/content/game/brand';
import { ACCESS } from '@/content/game/access';
import { loadAccessStatus, type AccessView } from '@/lib/server/access';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';
import { formatUtc } from '@/lib/wallet/datetime';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createDocumentationMetadata({
  title: `Play ${GAME_NAME}`,
  description: `${GAME_NAME}'s protected player entry. Verify your wallet and $FABLE access while the playable world is in development.`,
  route: '/play',
});

/**
 * Protected player entry foundation. Access is revalidated server-side on
 * every request to this page; the page never claims the playable world
 * exists yet and never shows fabricated balances or players.
 */
export default async function PlayPage() {
  const supabase = await getSupabaseServerClient();

  let signedIn = false;
  let access: AccessView | null = null;
  let displayLabel: string | null = null;
  let statusUnavailable = false;

  if (supabase !== undefined) {
    const user = await supabase.auth.getUser();
    if (!user.error && user.data.user) {
      signedIn = true;
      try {
        const outcome = await loadAccessStatus(supabase);
        access = outcome.view;
        displayLabel = outcome.me?.displayLabel ?? null;
      } catch (error) {
        if (error instanceof PlayerMeUnavailableError) {
          statusUnavailable = true;
        } else {
          throw error;
        }
      }
    }
  }

  return (
    <div className="home-hero play-page">
      <div>
        <p className="docs-eyebrow">Play {GAME_NAME}</p>
        {!signedIn ? (
          <>
            <h1>Verify your access</h1>
            <p>
              Entering {GAME_NAME} requires a verified Solana wallet holding at least{' '}
              {ACCESS.minimumHoldings.toLocaleString('en-US')} {ACCESS.tokenSymbol}. Connect your
              wallet and sign a free verification message to continue. The guides and documentation
              stay open to everyone without a wallet.
            </p>
            <p>
              <strong>{GAME_PHILOSOPHY}</strong> The playable world is still in development; wallet
              verification prepares your account for opening day.
            </p>
            <div className="cta-row">
              <ConnectButton />
              <Link className="btn btn-secondary" href="/docs/access">
                Read the access guide
              </Link>
              <Link className="btn btn-ghost" href="/docs">
                Browse all docs
              </Link>
            </div>
          </>
        ) : statusUnavailable || access === null ? (
          <>
            <h1>Access status unavailable</h1>
            <p>
              Your access status could not be checked just now. Protected entry stays closed until
              verification succeeds; please try again shortly. The public guides remain open.
            </p>
            <div className="cta-row">
              <VerifyAccessButton label="Try again" />
              <Link className="btn btn-ghost" href="/docs">
                Browse the docs
              </Link>
            </div>
          </>
        ) : (
          <PlayStates access={access} displayLabel={displayLabel} />
        )}
      </div>
      <aside className="panel">
        <h2 style={{ fontFamily: 'var(--fb-font-display)', fontSize: '1.35rem', margin: 0 }}>
          While the world is being built
        </h2>
        <ul className="docs-list" style={{ margin: 0 }}>
          <li>Access requires holding at least 10,000 $FABLE in your connected wallet</li>
          <li>Signing a verification message is free and never moves tokens</li>
          <li>Learn the two currencies: off-chain COPPER and on-chain $FABLE</li>
          <li>Preview Cat Dice, Cat Battle, and tournament rules in the docs</li>
        </ul>
        <div className="cta-row" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--fb-muted)', fontSize: '0.9rem' }}>Follow along:</span>
          <SocialIconLinks showLabels />
        </div>
      </aside>
    </div>
  );
}

function PlayStates({
  access,
  displayLabel,
}: {
  readonly access: AccessView;
  readonly displayLabel: string | null;
}) {
  const greeting = displayLabel !== null ? `Welcome back, ${displayLabel}.` : 'Welcome back.';

  if (access.result === 'eligible') {
    return (
      <>
        <span className="play-status__state">Access confirmed</span>
        <h1>The world is being built</h1>
        <p>
          {greeting} Your wallet is verified and your {ACCESS.tokenSymbol} holdings meet the access
          requirement. The playable world is still in development, so there is no build to enter
          yet, and we will never pretend otherwise.
        </p>
        <p>
          Your access confirmation lasts a short time and is rechecked automatically whenever you
          enter protected areas
          {access.sessionExpiresAt !== null
            ? `; the current confirmation expires at ${formatUtc(access.sessionExpiresAt)}`
            : ''}
          .
        </p>
        <div className="cta-row">
          <VerifyAccessButton />
          <Link className="btn btn-secondary" href="/account">
            View your account
          </Link>
          <Link className="btn btn-ghost" href="/how-to-play">
            Learn how to play
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'balance_below_requirement') {
    return (
      <>
        <span className="play-status__state">More $FABLE needed</span>
        <h1>Almost there</h1>
        <p>
          {greeting} Your wallet is verified, but it holds
          {access.observedTokensDisplay !== null
            ? ` ${access.observedTokensDisplay} ${ACCESS.tokenSymbol}, which is `
            : ' '}
          below the required {access.requiredTokensDisplay} {ACCESS.tokenSymbol}. Top up the
          connected wallet, then verify again. Falling below the requirement can also prevent a
          later access renewal.
        </p>
        <div className="cta-row">
          <VerifyAccessButton />
          <Link className="btn btn-secondary" href="/docs/fable">
            About $FABLE
          </Link>
          <Link className="btn btn-ghost" href="/account">
            Your account
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'profile_suspended') {
    return (
      <>
        <span className="play-status__state">Account restricted</span>
        <h1>This account is restricted</h1>
        <p>
          {greeting} This account cannot enter protected areas right now. The public guides and
          documentation remain fully available.
        </p>
        <div className="cta-row">
          <Link className="btn btn-secondary" href="/docs">
            Browse the docs
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'token_configuration_missing') {
    return (
      <>
        <span className="play-status__state">Verification not available</span>
        <h1>Access checks have not opened yet</h1>
        <p>
          {greeting} Your wallet is verified, but {ACCESS.tokenSymbol} balance verification is not
          available right now, so protected entry stays closed. No balance is shown because none was
          checked. The public guides remain open.
        </p>
        <div className="cta-row">
          <VerifyAccessButton label="Try again" />
          <Link className="btn btn-ghost" href="/docs/access">
            Read the access guide
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'rpc_unavailable') {
    return (
      <>
        <span className="play-status__state">Verification unavailable</span>
        <h1>Verification is temporarily unavailable</h1>
        <p>
          {greeting} Your {ACCESS.tokenSymbol} holdings could not be checked just now, so protected
          entry stays closed until a check succeeds. No cached or estimated balance is ever used.
        </p>
        <div className="cta-row">
          <VerifyAccessButton label="Try again" />
          <Link className="btn btn-ghost" href="/docs">
            Browse the docs
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'wrong_network') {
    return (
      <>
        <span className="play-status__state">Network change needed</span>
        <h1>Switch your wallet network</h1>
        <p>
          {greeting} Your linked wallet is set up for a different network than {GAME_NAME} uses
          right now. Reconnect on the supported network, then verify again.
        </p>
        <div className="cta-row">
          <ConnectButton />
          <Link className="btn btn-ghost" href="/account">
            Your account
          </Link>
        </div>
      </>
    );
  }

  if (access.result === 'wallet_not_linked') {
    return (
      <>
        <span className="play-status__state">Wallet needed</span>
        <h1>Link a wallet to continue</h1>
        <p>
          {greeting} No verified wallet is linked to this account yet. Connect a Solana wallet and
          sign the free verification message to continue.
        </p>
        <div className="cta-row">
          <ConnectButton />
          <Link className="btn btn-ghost" href="/docs/access">
            Read the access guide
          </Link>
        </div>
      </>
    );
  }

  // session_expired or reverification_required
  return (
    <>
      <span className="play-status__state">Access check needed</span>
      <h1>Verify your access to continue</h1>
      <p>
        {greeting} Your previous access confirmation has expired. Access is rechecked on every
        protected entry; verify your current {ACCESS.tokenSymbol} holdings to continue.
      </p>
      <div className="cta-row">
        <VerifyAccessButton />
        <Link className="btn btn-secondary" href="/account">
          Your account
        </Link>
      </div>
    </>
  );
}
