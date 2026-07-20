import Link from 'next/link';
import type { Metadata } from 'next';

import {
  CopyWalletButton,
  LogoutButton,
  RefreshBalanceButton,
  ReplaceWalletButton,
} from '@/components/account/account-actions';
import { ConnectButton } from '@/components/site/connect-button';
import { createDocumentationMetadata } from '@/content/docs/metadata';
import { GAME_NAME } from '@/content/game/brand';
import { loadAccessStatus } from '@/lib/server/access';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { formatUtc } from '@/lib/wallet/datetime';
import { maskWalletAddress, networkDisplayName, isSolanaNetwork } from '@/lib/wallet/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createDocumentationMetadata({
  title: 'Your account',
  description: `Your ${GAME_NAME} player account: linked wallet, verification state, and $FABLE access status.`,
  route: '/account',
});

const ACCESS_STATE_LABELS: Readonly<Record<string, string>> = {
  eligible: 'Access confirmed',
  balance_below_requirement: 'Below the requirement',
  profile_suspended: 'Account restricted',
  token_configuration_missing: 'Verification not available',
  rpc_unavailable: 'Verification temporarily unavailable',
  session_expired: 'Access check needed',
  reverification_required: 'Access check needed',
  wrong_network: 'Network change needed',
  wallet_not_linked: 'No wallet linked',
  wallet_not_verified: 'Wallet not verified',
};

/**
 * The signed-in player's account page. Shows only real, server-confirmed
 * information: no fake balances, no seed phrases, no session tokens.
 */
export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();

  if (supabase === undefined) {
    return (
      <AccountShell>
        <p>
          Player accounts are not available right now. The guides and documentation remain open to
          everyone.
        </p>
        <div className="cta-row">
          <Link className="btn btn-secondary" href="/docs">
            Browse the docs
          </Link>
        </div>
      </AccountShell>
    );
  }

  const user = await supabase.auth.getUser();
  if (user.error || !user.data.user) {
    return (
      <AccountShell>
        <p>
          Sign in with your Solana wallet to see your account, your linked wallet, and your $FABLE
          access status.
        </p>
        <div className="cta-row">
          <ConnectButton />
          <Link className="btn btn-ghost" href="/docs/access">
            Read the access guide
          </Link>
        </div>
      </AccountShell>
    );
  }

  let outcome;
  try {
    outcome = await loadAccessStatus(supabase);
  } catch (error) {
    if (error instanceof PlayerMeUnavailableError) {
      return (
        <AccountShell>
          <p>
            Your account information could not be loaded just now. Please try again shortly. The
            public guides remain open.
          </p>
          <div className="cta-row">
            <Link className="btn btn-secondary" href="/account">
              Try again
            </Link>
          </div>
        </AccountShell>
      );
    }
    throw error;
  }

  const me = outcome.me;
  if (me === null) {
    return (
      <AccountShell>
        <p>
          No player profile is linked to this session yet. Connect and verify a Solana wallet to
          create your account.
        </p>
        <div className="cta-row">
          <ConnectButton />
          <Link className="btn btn-ghost" href="/docs/access">
            Read the access guide
          </Link>
        </div>
      </AccountShell>
    );
  }

  const access = outcome.view;
  const wallet = me.wallet;
  const accessLabel = ACCESS_STATE_LABELS[access.result] ?? 'Verification needed';

  return (
    <AccountShell>
      <div className="account-grid">
        <section className="panel" aria-labelledby="account-profile">
          <h2 id="account-profile">Account</h2>
          <dl className="account-facts">
            <div>
              <dt>Display label</dt>
              <dd>{me.displayLabel}</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>
                <code>{me.profileId}</code>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{me.status === 'active' ? 'Active' : 'Restricted'}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>{formatUtc(me.createdAt)}</dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{formatUtc(me.lastSuccessfulSignInAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="account-wallet">
          <h2 id="account-wallet">Linked wallet</h2>
          {wallet === null ? (
            <>
              <p>No wallet is linked yet. Connect and verify a Solana wallet to link one.</p>
              <div className="cta-row">
                <ConnectButton />
              </div>
            </>
          ) : (
            <>
              <dl className="account-facts">
                <div>
                  <dt>Wallet</dt>
                  <dd>
                    <code>{maskWalletAddress(wallet.walletAddress)}</code>{' '}
                    <CopyWalletButton walletAddress={wallet.walletAddress} />
                  </dd>
                </div>
                <div>
                  <dt>Network</dt>
                  <dd>
                    {isSolanaNetwork(wallet.network)
                      ? networkDisplayName(wallet.network)
                      : wallet.network}
                  </dd>
                </div>
                <div>
                  <dt>Ownership verified</dt>
                  <dd>{formatUtc(me.lastWalletVerificationAt)}</dd>
                </div>
              </dl>
              <div className="cta-row">
                <ReplaceWalletButton />
              </div>
            </>
          )}
        </section>

        <section className="panel" aria-labelledby="account-access">
          <h2 id="account-access">$FABLE access</h2>
          <dl className="account-facts">
            <div>
              <dt>Current state</dt>
              <dd>{accessLabel}</dd>
            </div>
            <div>
              <dt>Requirement</dt>
              <dd>Hold at least {access.requiredTokensDisplay} $FABLE</dd>
            </div>
            {access.observedTokensDisplay !== null ? (
              <div>
                <dt>Verified balance</dt>
                <dd>{access.observedTokensDisplay} $FABLE</dd>
              </div>
            ) : null}
            <div>
              <dt>Last verification</dt>
              <dd>{formatUtc(me.lastAccessVerificationAt)}</dd>
            </div>
            {access.sessionExpiresAt !== null ? (
              <div>
                <dt>Confirmation expires</dt>
                <dd>{formatUtc(access.sessionExpiresAt)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="cta-row">
            {access.result === 'eligible' ? (
              <Link className="btn btn-primary" href="/play">
                Enter Fablesol
              </Link>
            ) : null}
            {me.status === 'active' && wallet !== null ? (
              <RefreshBalanceButton
                className={access.result === 'eligible' ? 'btn btn-secondary' : 'btn btn-primary'}
              />
            ) : null}
            <LogoutButton />
          </div>
        </section>

        <section className="panel" aria-labelledby="account-security">
          <h2 id="account-security">Security</h2>
          <ul className="docs-list" style={{ margin: 0 }}>
            <li>{GAME_NAME} will never ask for your seed phrase or private key.</li>
            <li>Always check that the site address is correct before signing anything.</li>
            <li>A balance check reads public chain data and never moves your tokens.</li>
            <li>Connecting a wallet does not give {GAME_NAME} custody of your funds.</li>
          </ul>
        </section>
      </div>
    </AccountShell>
  );
}

function AccountShell({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="home-hero play-page account-page">
      <div style={{ width: '100%' }}>
        <p className="docs-eyebrow">Your account</p>
        <h1>Account and access</h1>
        {children}
      </div>
    </div>
  );
}
