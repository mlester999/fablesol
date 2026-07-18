'use client';

import { useEffect, useId, useRef, useState } from 'react';

export function TournamentRegistrationDemo() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fee = 100;
  const balance = 450;
  const remaining = balance - fee;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      queueMicrotask(() => closeRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Example · no real COPPER charged</span>
      <h3>Tournament registration confirmation</h3>
      <p>Players must deliberately confirm before COPPER is charged. Schedules stay in UTC.</p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setConfirmed(false);
          setOpen(true);
        }}
      >
        Enter Tournament (demo)
      </button>
      {confirmed ? (
        <p className="live-region" aria-live="polite">
          Demo only: confirmation recorded in the documentation UI. No registration or payment
          occurred.
        </p>
      ) : null}
      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
      >
        <div className="search-dialog__body">
          <h3 id={titleId}>Confirm tournament entry</h3>
          <ul className="docs-list">
            <li>Tournament name: Meadow Cup (example)</li>
            <li>Tier: Levels 11–20 (example)</li>
            <li>Start: 2026-08-12 19:00 UTC</li>
            <li>Expected duration: about 90 minutes</li>
            <li>Registration deadline: 2026-08-12 18:30 UTC</li>
            <li>Entrance fee: {fee} COPPER</li>
            <li>Current regular COPPER: {balance} (example)</li>
            <li>Remaining after payment: {remaining} COPPER (example)</li>
            <li>Sponsored $FABLE prize: not configured in this example</li>
            <li>Refunds: fewer than 2 players, cancellation, or qualifying system failure</li>
          </ul>
          <p>
            <strong>No real COPPER will be charged.</strong>
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirmed(true);
                setOpen(false);
              }}
            >
              Confirm entry (demo)
            </button>
            <button
              ref={closeRef}
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
