'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { renewAccess, WalletClientError } from '@/lib/wallet/client';

/**
 * Client actions for /play. Verification always happens server-side; this
 * button only asks the server to run it again and then re-renders the page
 * from the server's answer.
 */
export function VerifyAccessButton({ label = 'Refresh balance' }: { readonly label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleVerify() {
    setBusy(true);
    setMessage(null);
    try {
      await renewAccess();
    } catch (error) {
      setMessage(
        error instanceof WalletClientError
          ? error.message
          : 'Verification is temporarily unavailable. Please try again shortly.',
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <span className="play-status">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void handleVerify()}
        disabled={busy}
      >
        {busy ? 'Refreshing balance…' : label}
      </button>
      {message !== null ? <span role="alert">{message}</span> : null}
    </span>
  );
}
