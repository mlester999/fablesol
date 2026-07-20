import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { loadPlayerDetail } from '@/lib/players';

export const metadata = { title: 'Player detail' };
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

interface PlayerDetailPageProps {
  readonly params: Promise<{ readonly userId: string }>;
}

/**
 * Read-only player investigation view. Sections appear only when the caller
 * holds the matching permission; the database enforces the same checks.
 */
export default async function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  await requireAuthorizedAdmin('players.view');

  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) {
    notFound();
  }

  const detail = await loadPlayerDetail(userId);
  if (detail === undefined) {
    notFound();
  }

  const { profile, wallets, accessEvaluations, accessSessions, securityEvents, permissions } =
    detail;

  return (
    <div className="page-stack">
      <p>
        <Link href="/players">Back to the player directory</Link>
      </p>

      <section className="card" aria-labelledby="player-profile-heading">
        <h2 id="player-profile-heading">{profile.displayLabel}</h2>
        <div className="table-scroll">
          <table className="data-table">
            <tbody>
              <tr>
                <th scope="row">Profile ID</th>
                <td>
                  <code>{profile.profileId}</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Status</th>
                <td>
                  <span className={`status-pill status-pill--${profile.status}`}>
                    {profile.status}
                  </span>
                  {profile.status === 'suspended' && profile.suspensionReason !== null ? (
                    <span className="table-sub">{profile.suspensionReason}</span>
                  ) : null}
                </td>
              </tr>
              <tr>
                <th scope="row">$FABLE access state</th>
                <td>{ACCESS_STATE_LABELS[profile.accessState] ?? profile.accessState}</td>
              </tr>
              <tr>
                <th scope="row">Onboarding</th>
                <td>{profile.onboardingState.replace(/_/gu, ' ')}</td>
              </tr>
              <tr>
                <th scope="row">Created</th>
                <td>{formatTimestamp(profile.createdAt)}</td>
              </tr>
              <tr>
                <th scope="row">Last sign-in</th>
                <td>{formatTimestamp(profile.lastSignInAt)}</td>
              </tr>
              <tr>
                <th scope="row">Last wallet verification</th>
                <td>{formatTimestamp(profile.lastWalletVerificationAt)}</td>
              </tr>
              <tr>
                <th scope="row">Last access verification</th>
                <td>{formatTimestamp(profile.lastAccessVerificationAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="player-wallets-heading">
        <h2 id="player-wallets-heading">Wallet history ({wallets.length})</h2>
        {!permissions.supportView ? (
          <p className="card__note">
            Wallet addresses are masked. Support detail permission is required for full addresses.
          </p>
        ) : null}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Wallet</th>
                <th scope="col">Network</th>
                <th scope="col">Status</th>
                <th scope="col">First verified</th>
                <th scope="col">Last verified</th>
                <th scope="col">Replaced</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.walletId}>
                  <td>
                    <code>{wallet.wallet}</code>
                  </td>
                  <td>{wallet.network}</td>
                  <td>{wallet.status}</td>
                  <td>{formatTimestamp(wallet.firstVerifiedAt)}</td>
                  <td>{formatTimestamp(wallet.lastVerifiedAt)}</td>
                  <td>{formatTimestamp(wallet.replacedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {permissions.accessHistory && accessEvaluations !== null ? (
        <section className="card" aria-labelledby="player-evaluations-heading">
          <h2 id="player-evaluations-heading">Access evaluations ({accessEvaluations.length})</h2>
          <p className="card__note">
            Balances are integer base-unit evidence from the server-side verification pipeline.
            Administrators cannot create, edit, or override evaluations.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Result</th>
                  <th scope="col">Wallet</th>
                  <th scope="col">Verified balance</th>
                  <th scope="col">Required (base units)</th>
                  <th scope="col">Token accounts</th>
                  <th scope="col">Evaluated</th>
                </tr>
              </thead>
              <tbody>
                {accessEvaluations.map((evaluation) => (
                  <tr key={evaluation.evaluationId}>
                    <td>{evaluation.result.replace(/_/gu, ' ')}</td>
                    <td>
                      {evaluation.walletMasked !== null ? (
                        <code>{evaluation.walletMasked}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {evaluation.observedDisplay !== null
                        ? `${evaluation.observedDisplay} $FABLE`
                        : '—'}
                    </td>
                    <td>{evaluation.requiredBaseUnits ?? '—'}</td>
                    <td>{evaluation.tokenAccountCount ?? '—'}</td>
                    <td>{formatTimestamp(evaluation.evaluatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.accessHistory && accessSessions !== null ? (
        <section className="card" aria-labelledby="player-sessions-heading">
          <h2 id="player-sessions-heading">Access sessions ({accessSessions.length})</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Wallet</th>
                  <th scope="col">Network</th>
                  <th scope="col">Created</th>
                  <th scope="col">Expires</th>
                  <th scope="col">Invalidated</th>
                  <th scope="col">Reason</th>
                </tr>
              </thead>
              <tbody>
                {accessSessions.map((session) => (
                  <tr key={session.sessionId}>
                    <td>
                      {session.walletMasked !== null ? <code>{session.walletMasked}</code> : '—'}
                    </td>
                    <td>{session.network}</td>
                    <td>{formatTimestamp(session.createdAt)}</td>
                    <td>{formatTimestamp(session.expiresAt)}</td>
                    <td>{formatTimestamp(session.invalidatedAt)}</td>
                    <td>{session.invalidationReason?.replace(/_/gu, ' ') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.securityEvents && securityEvents !== null ? (
        <section className="card" aria-labelledby="player-security-heading">
          <h2 id="player-security-heading">Security events ({securityEvents.length})</h2>
          <p className="card__note">
            Append-only history. Raw signatures, nonces, and session tokens are never stored.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Result</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Wallet</th>
                  <th scope="col">Correlation</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {securityEvents.map((event) => (
                  <tr key={event.eventId}>
                    <td>
                      <code>{event.eventKey}</code>
                    </td>
                    <td>{event.result}</td>
                    <td>{event.reasonCode?.replace(/_/gu, ' ') ?? '—'}</td>
                    <td>{event.walletMasked !== null ? <code>{event.walletMasked}</code> : '—'}</td>
                    <td>
                      {event.correlationId !== null ? <code>{event.correlationId}</code> : '—'}
                    </td>
                    <td>{formatTimestamp(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
