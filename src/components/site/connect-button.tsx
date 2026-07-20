'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { getPublicEnv } from '@/lib/env';
import { ACCESS } from '@/content/game/access';
import { isSolanaNetwork, type SolanaNetwork } from '@/lib/wallet/config';
import type { WalletFlowIntent } from '@/components/wallet/wallet-flow';

/**
 * The one shared wallet-access entry point. Every button that opens the
 * wallet system (header Connect wallet, landing Play Now, /play, /account)
 * renders WalletAccessButton, so there is exactly one dialog, one flow, and
 * one set of API calls. The heavy wallet libraries load only after the
 * player opens the dialog. When wallet connection is not configured, the
 * dialog stays honest: it explains that connection is unavailable and never
 * simulates a wallet, an address, or a balance.
 */

const WalletFlow = dynamic(
  () => import('@/components/wallet/wallet-flow').then((module) => module.WalletFlow),
  {
    ssr: false,
    loading: () => <p className="wallet-flow__note">Loading wallet options…</p>,
  },
);

interface WalletConfig {
  readonly projectId: string;
  readonly siteUrl: string;
  readonly network: SolanaNetwork;
}

function resolveWalletConfig(): WalletConfig | undefined {
  const env = getPublicEnv();
  if (env.reownProjectId === undefined || !isSolanaNetwork(env.solanaNetwork)) {
    return undefined;
  }
  return {
    projectId: env.reownProjectId,
    siteUrl: env.siteUrl ?? (typeof window === 'undefined' ? '' : window.location.origin),
    network: env.solanaNetwork,
  };
}

export interface WalletAccessButtonProps {
  /** Player-facing label on the trigger button. */
  readonly label?: string;
  /**
   * What the player is trying to do. 'play' navigates to /play once access
   * is confirmed; 'connect' stays on the access panel.
   */
  readonly intent?: WalletFlowIntent;
  readonly className?: string;
}

export function WalletAccessButton({
  label = 'Connect wallet',
  intent = 'connect',
  className = 'btn btn-primary',
}: WalletAccessButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [suspendedForSelector, setSuspendedForSelector] = useState(false);
  const headingId = useId();
  const config = resolveWalletConfig();

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

  // The wallet selector overlay lives outside this dialog. A modal dialog
  // would make it inert, so the dialog yields while the selector is open and
  // returns (with focus) when it closes.
  const handleSelectorOpenChange = useCallback((selectorOpen: boolean) => {
    setSuspendedForSelector(selectorOpen);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSuspendedForSelector(false);
  }, []);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
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
          <p className="docs-eyebrow">Wallet connection</p>
          <h2 id={headingId}>Connect a Solana wallet</h2>
          {open ? (
            config !== undefined ? (
              <WalletFlow
                projectId={config.projectId}
                siteUrl={config.siteUrl}
                network={config.network}
                intent={intent}
                onSelectorOpenChange={handleSelectorOpenChange}
                onClose={close}
              />
            ) : (
              <>
                <p>
                  Wallet connection is not available right now. The guides and documentation stay
                  fully open without a wallet.
                </p>
                <ul className="docs-list">
                  <li>
                    Entering the game will require holding at least{' '}
                    {ACCESS.minimumHoldings.toLocaleString('en-US')} {ACCESS.tokenSymbol}.
                  </li>
                  <li>No wallet is connected right now; this page never simulates one.</li>
                  <li>Fablesol will never ask for your seed phrase.</li>
                </ul>
                <div className="cta-row">
                  <Link className="btn btn-secondary" href="/docs/access" onClick={close}>
                    Read the access guide
                  </Link>
                  <button type="button" className="btn btn-ghost" onClick={close}>
                    Close
                  </button>
                </div>
              </>
            )
          ) : null}
        </div>
      </dialog>
    </>
  );
}

/** Header and inline entry point; same shared flow, connect intent. */
export function ConnectButton() {
  return <WalletAccessButton />;
}

/** Landing-page entry point; same shared flow, play intent. */
export function PlayNowButton({ className = 'btn btn-copper btn-large' }: { className?: string }) {
  return <WalletAccessButton label="Play Now" intent="play" className={className} />;
}
