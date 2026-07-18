'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ACCESS } from '@/content/game/access';
import { AvailabilityBadge } from './availability-badge';

/**
 * Honest wallet-connect shell. Wallet integration ships in the next phase;
 * this dialog explains the real access rules and never pretends a wallet is
 * connected, never shows an address, and never invents a balance.
 */
export function ConnectButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        Connect
      </button>
      <dialog
        ref={dialogRef}
        className="connect-dialog"
        aria-labelledby={headingId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="connect-dialog__body">
          <p className="docs-eyebrow">
            Wallet connection <AvailabilityBadge feature="wallet-connect" />
          </p>
          <h2 id={headingId}>Connect a Solana wallet</h2>
          <p>
            Wallet connection arrives with the next game update. When it opens, you will connect a
            compatible {ACCESS.chain} wallet, and entering the world will require holding at least{' '}
            {ACCESS.minimumHoldings.toLocaleString('en-US')} {ACCESS.tokenSymbol}.
          </p>
          <ul className="docs-list">
            <li>No wallet is connected right now; this preview never simulates one.</li>
            <li>
              {ACCESS.tokenSymbol} is on-chain; {ACCESS.copperName} is the separate off-chain
              in-game currency.
            </li>
            <li>Fablesol will never ask for your seed phrase.</li>
          </ul>
          <div className="cta-row">
            <Link className="btn btn-secondary" href="/docs/access" onClick={() => setOpen(false)}>
              Read the access guide
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
