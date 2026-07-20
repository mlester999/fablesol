import Link from 'next/link';

import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { loadPlayerDirectory } from '@/lib/players';

export const metadata = { title: 'Players' };
export const dynamic = 'force-dynamic';

function formatTimestamp(value: string | null): string {
  if (value === null) return '—';
  return new Date(value).toLocaleString();
}

const ACCESS_STATE_LABELS: Readonly<Record<string, string>> = {
  unverified: 'Unverified',
  eligible: 'Eligible',
  ineligible: 'Ineligible',
  stale: 'Needs recheck',
};

const ONBOARDING_LABELS: Readonly<Record<string, string>> = {
  profile_created: 'Profile created',
  wallet_verified: 'Wallet verified',
  access_checked: 'Access checked',
};

/**
 * Read-only player directory. There is deliberately no "grant access" or
 * "edit balance" control: eligibility comes only from the server-side
 * $FABLE verification pipeline.
 */
export default async function PlayersPage() {
  await requireAuthorizedAdmin('players.view');
  const players = await loadPlayerDirectory();

  return (
    <div className="page-stack">
      <section className="card" aria-labelledby="players-heading">
        <h2 id="players-heading">Players ({players.length})</h2>
        <p className="card__note">
          Player access is decided only by server-side wallet verification and the on-chain $FABLE
          balance check. This directory is read-only and never contains signatures, session tokens,
          or challenge secrets.
        </p>
        {players.length === 0 ? (
          <p>No player profiles exist yet. Profiles appear when players verify a wallet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col">Status</th>
                  <th scope="col">Wallet</th>
                  <th scope="col">$FABLE access</th>
                  <th scope="col">Last access check</th>
                  <th scope="col">Last sign-in</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.profileId}>
                    <td>
                      <Link href={`/players/${player.userId}`}>
                        <strong>{player.displayLabel}</strong>
                      </Link>
                      <span className="table-sub">
                        {ONBOARDING_LABELS[player.onboardingState] ?? player.onboardingState}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-pill--${player.status}`}>
                        {player.status}
                      </span>
                    </td>
                    <td>
                      {player.walletMasked !== null ? (
                        <code>{player.walletMasked}</code>
                      ) : (
                        'Not linked'
                      )}
                      <span className="table-sub">
                        {player.walletVerificationState === 'verified' ? 'Verified' : 'Unlinked'}
                      </span>
                    </td>
                    <td>{ACCESS_STATE_LABELS[player.accessState] ?? player.accessState}</td>
                    <td>{formatTimestamp(player.lastAccessVerificationAt)}</td>
                    <td>{formatTimestamp(player.lastSignInAt)}</td>
                    <td>{formatTimestamp(player.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
