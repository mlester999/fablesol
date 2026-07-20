'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { getPublicEnv } from '@/lib/env';
import { logoutPlayer, renewAccess } from '@/lib/wallet/client';
import { isSolanaNetwork, type SolanaNetwork } from '@/lib/wallet/config';
import { refreshFailureMessage, refreshOutcomeMessage } from '@/lib/wallet/refresh-messages';

const WalletFlow = dynamic(
  () => import('@/components/wallet/wallet-flow').then((module) => module.WalletFlow),
  {
    ssr: false,
    loading: () => <p className="wallet-flow__note">Loading wallet options…</p>,
  },
);

/** Copies the full wallet address; the page itself only shows the masked form. */
export function CopyWalletButton({ walletAddress }: { readonly walletAddress: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-inline"
      onClick={() => {
        navigator.clipboard
          .writeText(walletAddress)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2_000);
          })
          .catch(() => undefined);
      }}
    >
      {copied ? 'Copied' : 'Copy address'}
    </button>
  );
}

/**
 * Manual balance refresh from /account. Calls the same canonical fresh
 * server-side evaluation as the wallet modal, then re-renders the page from
 * the server's answer. Receiving more $FABLE never requires reconnecting;
 * only ownership changes require a new signature.
 */
export function RefreshBalanceButton({
  className = 'btn btn-primary',
}: {
  readonly className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          setMessage(null);
          renewAccess()
            .then((renewed) => {
              setMessage(
                refreshOutcomeMessage(
                  renewed.access.result,
                  renewed.access.requiredTokensDisplay,
                  renewed.access.network,
                ),
              );
            })
            .catch((error: unknown) => {
              setMessage(refreshFailureMessage(error));
            })
            .finally(() => {
              setBusy(false);
              router.refresh();
            });
        }}
      >
        {busy ? 'Refreshing balance…' : 'Refresh balance'}
      </button>
      {busy ? (
        <span role="status" className="sr-only">
          Refreshing balance
        </span>
      ) : null}
      {message !== null ? <span role="status">{message}</span> : null}
    </>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        logoutPlayer()
          .catch(() => undefined)
          .finally(() => {
            setBusy(false);
            router.refresh();
          });
      }}
    >
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  );
}

/**
 * Replace-wallet flow: requires the signed-in session, explicit confirmation,
 * and a fresh signature from the replacement wallet. The server invalidates
 * every access session and requires a fresh balance verification afterwards.
 */
export function ReplaceWalletButton() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [suspendedForSelector, setSuspendedForSelector] = useState(false);
  const headingId = useId();

  const env = getPublicEnv();
  const configured = env.reownProjectId !== undefined && isSolanaNetwork(env.solanaNetwork);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const shouldShow = open && !suspendedForSelector;
    if (shouldShow) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, suspendedForSelector]);

  const close = useCallback(() => {
    setOpen(false);
    setConfirmed(false);
    setSuspendedForSelector(false);
    router.refresh();
  }, [router]);

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        Replace wallet
      </button>
      <dialog
        ref={dialogRef}
        className="connect-dialog"
        aria-labelledby={headingId}
        onClose={() => {
          if (!suspendedForSelector) close();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="connect-dialog__body">
          <p className="docs-eyebrow">Wallet replacement</p>
          <h2 id={headingId}>Replace your linked wallet</h2>
          {!open ? null : !configured ? (
            <>
              <p>Wallet connection is not available right now, so wallets cannot be replaced.</p>
              <div className="cta-row">
                <button type="button" className="btn btn-ghost" onClick={close}>
                  Close
                </button>
              </div>
            </>
          ) : !confirmed ? (
            <>
              <p>
                Replacing your wallet immediately ends your current access confirmation. You will
                sign a free verification message with the replacement wallet, and your $FABLE
                holdings will be checked again in that wallet.
              </p>
              <ul className="docs-list">
                <li>The replacement wallet must not be linked to another Fablesol account.</li>
                <li>Signing is free and does not move any tokens.</li>
                <li>Fablesol will never ask for your seed phrase.</li>
              </ul>
              <div className="cta-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setConfirmed(true)}
                >
                  Continue with replacement
                </button>
                <button type="button" className="btn btn-ghost" onClick={close}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <WalletFlow
              projectId={env.reownProjectId ?? ''}
              siteUrl={env.siteUrl ?? window.location.origin}
              network={env.solanaNetwork as SolanaNetwork}
              mode="replace_wallet"
              onSelectorOpenChange={setSuspendedForSelector}
              onClose={close}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
