'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useAppKitState,
  useDisconnect,
} from '@reown/appkit/react';
import type { Provider as SolanaSignerProvider } from '@reown/appkit-adapter-solana/react';

import { appKitNetworkFor, initializeFablesolAppKit } from '@/lib/wallet/appkit';
import {
  encodeSignatureBase64,
  fetchAccessStatus,
  logoutPlayer,
  renewAccess,
  replaceWalletWithChallenge,
  requestWalletChallenge,
  verifyWalletChallenge,
  WalletClientError,
  type AccessViewPayload,
  type PlayerStatusPayload,
} from '@/lib/wallet/client';
import { maskWalletAddress, networkDisplayName, type SolanaNetwork } from '@/lib/wallet/config';
import { formatUtc } from '@/lib/wallet/datetime';
import { refreshFailureMessage, refreshOutcomeMessage } from '@/lib/wallet/refresh-messages';

/**
 * The full wallet verification flow. Every displayed balance and access
 * decision comes from the server; this component never invents state. The
 * flow is cancelable at every step and never traps the player.
 */

export type WalletFlowMode = 'sign_in' | 'replace_wallet';

/**
 * Why the player opened the flow. 'play' proceeds to /play as soon as the
 * server confirms eligibility; 'connect' stays on the access panel. Both
 * intents share every step of connection, verification, and evaluation.
 */
export type WalletFlowIntent = 'connect' | 'play';

interface WalletFlowProps {
  readonly projectId: string;
  readonly siteUrl: string;
  readonly network: SolanaNetwork;
  readonly mode?: WalletFlowMode;
  readonly intent?: WalletFlowIntent;
  /** Called while the wallet selector overlay is open so the host dialog can yield. */
  readonly onSelectorOpenChange?: (open: boolean) => void;
  readonly onClose: () => void;
}

type Phase =
  | 'loading'
  | 'disconnected'
  | 'connecting'
  | 'wrong_network'
  | 'requesting_challenge'
  | 'awaiting_signature'
  | 'verifying'
  | 'signed_in'
  | 'signature_rejected'
  | 'flow_error';

interface FlowError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

const PHASE_ANNOUNCEMENTS: Readonly<Record<Phase, string>> = {
  loading: 'Checking your current access status.',
  disconnected: 'No wallet is connected.',
  connecting: 'Opening your wallet.',
  wrong_network: 'The connected wallet is on an unsupported network.',
  requesting_challenge: 'Preparing a verification message.',
  awaiting_signature: 'Waiting for you to sign the verification message in your wallet.',
  verifying: 'Verifying your signature and checking your holdings.',
  signed_in: 'Verification complete.',
  signature_rejected: 'The signature request was declined.',
  flow_error: 'Something needs your attention.',
};

/**
 * Reason-specific, security-safe guidance per error code. Messages explain
 * what to do next without revealing which internal check failed or whether
 * any account exists.
 */
const ERROR_GUIDANCE: Readonly<Partial<Record<string, string>>> = {
  invalid_request:
    'The verification request did not match what was issued. Start the verification again to get a fresh message.',
  rate_limited: 'Too many attempts right now. Wait a moment, then try again.',
  challenge_not_found:
    'This verification request is no longer available. Start again to get a new one.',
  challenge_expired:
    'The verification message expired before it was signed. Start again and sign the fresh message promptly.',
  challenge_replayed: 'This verification message was already used. Start again to get a fresh one.',
  challenge_rejected: 'Too many attempts for this message. Start again to get a fresh one.',
  signature_invalid:
    'The signature could not be verified. Make sure you signed with the wallet that is connected, then try again.',
  wallet_conflict: 'This wallet is already linked to another Fablesol account.',
  wrong_network: 'The connected wallet is on an unsupported network. Switch network and try again.',
  session_unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  service_unavailable: 'This service is temporarily unavailable. Please try again shortly.',
  unauthenticated: 'Your session ended. Connect your wallet again to continue.',
  network_error: 'The connection dropped. Check your internet connection and try again.',
};

function errorFromClient(error: unknown): FlowError {
  if (error instanceof WalletClientError) {
    return {
      code: error.code,
      message: ERROR_GUIDANCE[error.code] ?? error.message,
      retryable: error.code !== 'wallet_conflict',
    };
  }
  return {
    code: 'unknown',
    message: 'Something went wrong. Please try again.',
    retryable: true,
  };
}

export function WalletFlow({
  projectId,
  siteUrl,
  network,
  mode = 'sign_in',
  intent = 'connect',
  onSelectorOpenChange,
  onClose,
}: WalletFlowProps) {
  useState(() => {
    initializeFablesolAppKit({ projectId, siteUrl, network });
    return true;
  });

  const { open: openAppKit } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { open: selectorOpen } = useAppKitState();
  const { walletProvider } = useAppKitProvider<SolanaSignerProvider>('solana');
  const { disconnect } = useDisconnect();

  const [phase, setPhase] = useState<Phase>('loading');
  const [flowError, setFlowError] = useState<FlowError | null>(null);
  const [access, setAccess] = useState<AccessViewPayload | null>(null);
  const [player, setPlayer] = useState<PlayerStatusPayload | null>(null);
  const [walletMasked, setWalletMasked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  /** Last successful balance, kept only for honest "previous check" labeling. */
  const [staleBalance, setStaleBalance] = useState<{
    readonly display: string;
    readonly at: string | null;
  } | null>(null);

  const router = useRouter();

  const operationRef = useRef(0);
  const verifiedAddressRef = useRef<string | null>(null);
  const previousAddressRef = useRef<string | undefined>(undefined);
  const wasWrongNetworkRef = useRef(false);

  const expectedNetworkId = appKitNetworkFor(network).id;
  const onCorrectNetwork = caipNetwork === undefined || caipNetwork.id === expectedNetworkId;

  // Wrong-network is derived from the live wallet state rather than stored,
  // so it can never go stale and never needs a state write in an effect.
  const wrongNetwork = isConnected && address !== undefined && !onCorrectNetwork;
  const effectivePhase: Phase = wrongNetwork ? 'wrong_network' : phase;

  useEffect(() => {
    onSelectorOpenChange?.(selectorOpen);
  }, [selectorOpen, onSelectorOpenChange]);

  // Restore an existing server session exactly once per mount. The server
  // decides. With play intent and a still-valid access session, go straight
  // to /play; the page revalidates the session server-side on arrival.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const operation = ++operationRef.current;
    fetchAccessStatus()
      .then((status) => {
        if (operationRef.current !== operation) return;
        if (mode === 'replace_wallet') {
          setPhase('disconnected');
          return;
        }
        if (intent === 'play' && status.access.result === 'eligible') {
          onClose();
          router.push('/play');
          return;
        }
        setAccess(status.access);
        setPlayer(status.player);
        setWalletMasked(status.player?.walletMasked ?? null);
        setPhase('signed_in');
      })
      .catch(() => {
        if (operationRef.current !== operation) return;
        setPhase('disconnected');
      });
  }, [mode, intent, onClose, router]);

  const runVerification = useCallback(
    async (walletAddress: string) => {
      const operation = ++operationRef.current;
      setFlowError(null);

      try {
        setPhase('requesting_challenge');
        const challenge = await requestWalletChallenge({
          walletAddress,
          network,
          purpose: mode === 'replace_wallet' ? 'wallet_replacement' : 'sign_in',
        });
        if (operationRef.current !== operation) return;

        setPhase('awaiting_signature');
        if (!walletProvider) {
          throw new WalletClientError(
            'service_unavailable',
            'The connected wallet cannot sign messages. Try a different wallet.',
          );
        }
        let signature: Uint8Array;
        try {
          signature = await walletProvider.signMessage(new TextEncoder().encode(challenge.message));
        } catch {
          if (operationRef.current === operation) {
            setPhase('signature_rejected');
          }
          return;
        }
        if (operationRef.current !== operation) return;

        setPhase('verifying');
        const payload = {
          challengeId: challenge.challengeId,
          walletAddress,
          network,
          message: challenge.message,
          signature: encodeSignatureBase64(signature),
        };

        if (mode === 'replace_wallet') {
          const result = await replaceWalletWithChallenge(payload);
          if (operationRef.current !== operation) return;
          setAccess(result.access);
          setWalletMasked(result.wallet.walletMasked);
          verifiedAddressRef.current = walletAddress;
          setPhase('signed_in');
        } else {
          const result = await verifyWalletChallenge(payload);
          if (operationRef.current !== operation) return;
          verifiedAddressRef.current = walletAddress;
          if (intent === 'play' && result.access.result === 'eligible') {
            onClose();
            router.push('/play');
            return;
          }
          setAccess(result.access);
          setWalletMasked(result.player.walletMasked);
          const status = await fetchAccessStatus().catch(() => null);
          if (operationRef.current !== operation) return;
          if (status) setPlayer(status.player);
          setPhase('signed_in');
        }
      } catch (error) {
        if (operationRef.current !== operation) return;
        setFlowError(errorFromClient(error));
        setPhase('flow_error');
      }
    },
    [intent, mode, network, onClose, router, walletProvider],
  );

  // React to wallet connection and to the wallet changing mid-flow.
  useEffect(() => {
    const previous = previousAddressRef.current;
    previousAddressRef.current = address;
    const wasWrongNetwork = wasWrongNetworkRef.current;
    wasWrongNetworkRef.current = isConnected && address !== undefined && !onCorrectNetwork;

    if (!isConnected || address === undefined || !onCorrectNetwork) {
      return;
    }
    if (address === verifiedAddressRef.current) {
      return;
    }
    if (previous !== undefined && previous !== address) {
      // A different wallet appeared: any previous verification no longer
      // applies. Fresh ownership proof is required.
      verifiedAddressRef.current = null;
    }
    if (phase === 'disconnected' || phase === 'connecting' || wasWrongNetwork) {
      void runVerification(address);
    }
  }, [address, isConnected, onCorrectNetwork, phase, runVerification]);

  const startConnect = useCallback(() => {
    setFlowError(null);
    if (isConnected && address !== undefined && onCorrectNetwork) {
      void runVerification(address);
      return;
    }
    setPhase('connecting');
    void openAppKit({ view: 'Connect' });
  }, [address, isConnected, onCorrectNetwork, openAppKit, runVerification]);

  const switchNetwork = useCallback(() => {
    void openAppKit({ view: 'Networks' });
  }, [openAppKit]);

  /**
   * Manual Refresh balance: always a fresh server-authoritative chain
   * evaluation through the canonical renewal endpoint; nothing is reused
   * from the previous application state.
   */
  const handleRefreshBalance = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFlowError(null);
    setRefreshMessage(null);
    const previous = access;
    try {
      const renewed = await renewAccess();
      const fresh = renewed.access;
      if (intent === 'play' && fresh.result === 'eligible') {
        onClose();
        router.push('/play');
        return;
      }
      // The chain could not be read: no new balance exists. Keep the prior
      // value only as a clearly labeled previous verification.
      if (
        fresh.observedTokensDisplay === null &&
        previous?.observedTokensDisplay != null &&
        (fresh.result === 'rpc_unavailable' || fresh.result === 'token_configuration_missing')
      ) {
        setStaleBalance({ display: previous.observedTokensDisplay, at: previous.evaluatedAt });
      } else {
        setStaleBalance(null);
      }
      setAccess(fresh);
      setRefreshMessage(refreshOutcomeMessage(fresh.result, fresh.requiredTokensDisplay, network));
    } catch (error) {
      setRefreshMessage(refreshFailureMessage(error));
    } finally {
      setBusy(false);
    }
  }, [access, busy, intent, network, onClose, router]);

  const handleLogout = useCallback(async () => {
    setBusy(true);
    try {
      await logoutPlayer().catch(() => undefined);
      await disconnect().catch(() => undefined);
    } finally {
      verifiedAddressRef.current = null;
      setAccess(null);
      setPlayer(null);
      setWalletMasked(null);
      setRefreshMessage(null);
      setStaleBalance(null);
      setBusy(false);
      setPhase('disconnected');
    }
  }, [disconnect]);

  const handleCopyWallet = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2_000);
    } catch {
      // Clipboard access denied; nothing sensitive happens either way.
    }
  }, [address]);

  const cancelAndClose = useCallback(() => {
    operationRef.current += 1;
    onClose();
  }, [onClose]);

  /** Eligible players only: proceed to the protected entry page. */
  const enterFablesol = useCallback(() => {
    cancelAndClose();
    router.push('/play');
  }, [cancelAndClose, router]);

  return (
    <div className="wallet-flow">
      <p aria-live="polite" className="sr-only">
        {PHASE_ANNOUNCEMENTS[effectivePhase]}
      </p>

      {effectivePhase === 'loading' ? (
        <p className="wallet-flow__note">Checking your access status…</p>
      ) : null}

      {effectivePhase === 'disconnected' || effectivePhase === 'connecting' ? (
        <>
          <p>
            Connect a compatible Solana wallet to verify ownership and check the{' '}
            {networkDisplayName(network)} access requirement.
          </p>
          <ul className="docs-list">
            <li>Signing the verification message is free and does not send a transaction.</li>
            <li>A balance check never moves your tokens.</li>
            <li>Fablesol will never ask for your seed phrase.</li>
          </ul>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={startConnect}
              disabled={effectivePhase === 'connecting'}
            >
              {effectivePhase === 'connecting' ? 'Opening wallet options…' : 'Choose a wallet'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelAndClose}>
              Cancel
            </button>
          </div>
        </>
      ) : null}

      {effectivePhase === 'wrong_network' ? (
        <>
          <p role="status">
            The connected wallet is on a different network. Fablesol currently uses{' '}
            <strong>{networkDisplayName(network)}</strong>.
          </p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary" onClick={switchNetwork}>
              Switch network
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelAndClose}>
              Cancel
            </button>
          </div>
        </>
      ) : null}

      {effectivePhase === 'requesting_challenge' || effectivePhase === 'verifying' ? (
        <p className="wallet-flow__note" role="status">
          {effectivePhase === 'requesting_challenge'
            ? 'Preparing your verification message…'
            : 'Verifying your signature and checking your $FABLE holdings…'}
        </p>
      ) : null}

      {effectivePhase === 'awaiting_signature' ? (
        <>
          <p role="status">
            <strong>Check your wallet.</strong> Approve the signature request to prove you own this
            wallet. Signing is free and does not move any tokens.
          </p>
          <p className="wallet-flow__note">
            Before signing, confirm the message shows the site you are visiting.
          </p>
          <div className="cta-row">
            <button type="button" className="btn btn-ghost" onClick={cancelAndClose}>
              Cancel
            </button>
          </div>
        </>
      ) : null}

      {effectivePhase === 'signature_rejected' ? (
        <>
          <p role="status">
            The signature request was declined. Nothing was signed and nothing changed.
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (address ? void runVerification(address) : startConnect())}
            >
              Try again
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelAndClose}>
              Close
            </button>
          </div>
        </>
      ) : null}

      {effectivePhase === 'flow_error' && flowError !== null ? (
        <>
          <p role="alert">{flowError.message}</p>
          <div className="cta-row">
            {flowError.retryable ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => (address ? void runVerification(address) : startConnect())}
              >
                Try again
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={cancelAndClose}>
              Close
            </button>
          </div>
        </>
      ) : null}

      {effectivePhase === 'signed_in' && access !== null ? (
        <AccessPanel
          access={access}
          player={player}
          walletMasked={walletMasked ?? (address ? maskWalletAddress(address) : null)}
          network={network}
          busy={busy}
          copyFeedback={copyFeedback}
          canCopy={Boolean(address)}
          flowError={flowError}
          refreshMessage={refreshMessage}
          staleBalance={staleBalance}
          onRefreshBalance={() => void handleRefreshBalance()}
          onEnterFablesol={enterFablesol}
          onLogout={() => void handleLogout()}
          onCopyWallet={() => void handleCopyWallet()}
          onReconnect={startConnect}
          onClose={cancelAndClose}
        />
      ) : null}
    </div>
  );
}

interface AccessPanelProps {
  readonly access: AccessViewPayload;
  readonly player: PlayerStatusPayload | null;
  readonly walletMasked: string | null;
  readonly network: SolanaNetwork;
  readonly busy: boolean;
  readonly copyFeedback: boolean;
  readonly canCopy: boolean;
  readonly flowError: FlowError | null;
  readonly refreshMessage: string | null;
  readonly staleBalance: { readonly display: string; readonly at: string | null } | null;
  readonly onRefreshBalance: () => void;
  readonly onEnterFablesol: () => void;
  readonly onLogout: () => void;
  readonly onCopyWallet: () => void;
  readonly onReconnect: () => void;
  readonly onClose: () => void;
}

function AccessPanel({
  access,
  player,
  walletMasked,
  network,
  busy,
  copyFeedback,
  canCopy,
  flowError,
  refreshMessage,
  staleBalance,
  onRefreshBalance,
  onEnterFablesol,
  onLogout,
  onCopyWallet,
  onReconnect,
  onClose,
}: AccessPanelProps) {
  const suspended = player?.profileStatus === 'suspended' || access.result === 'profile_suspended';
  const eligible = !suspended && access.result === 'eligible';

  return (
    <div
      className={`wallet-flow__panel ${
        eligible ? 'wallet-flow__panel--eligible' : 'wallet-flow__panel--blocked'
      }`}
    >
      {walletMasked !== null ? (
        <dl className="wallet-flow__facts">
          <div>
            <dt>Wallet</dt>
            <dd>
              <code>{walletMasked}</code>{' '}
              {canCopy ? (
                <button type="button" className="btn btn-ghost btn-inline" onClick={onCopyWallet}>
                  {copyFeedback ? 'Copied' : 'Copy address'}
                </button>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>{networkDisplayName(network)}</dd>
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
          ) : staleBalance !== null ? (
            <div>
              <dt>Last verified balance</dt>
              <dd>
                {staleBalance.display} $FABLE
                {staleBalance.at !== null ? ` (checked ${formatUtc(staleBalance.at)})` : ''}
              </dd>
            </div>
          ) : null}
          {access.evaluatedAt !== null ? (
            <div>
              <dt>Last checked</dt>
              <dd>{formatUtc(access.evaluatedAt)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {suspended ? (
        <p role="status">
          <strong>Account restricted.</strong> This account cannot enter protected areas right now.
        </p>
      ) : access.result === 'eligible' ? (
        <p role="status">
          <strong>Access confirmed.</strong> Your wallet holds the required $FABLE. The playable
          world is still in development, and your access will be rechecked whenever you enter
          protected areas.
        </p>
      ) : access.result === 'balance_below_requirement' ? (
        <>
          <p role="status">
            <strong>Not enough $FABLE yet.</strong> This wallet holds less than the required{' '}
            {access.requiredTokensDisplay} $FABLE, so protected areas stay closed for now.
          </p>
          <p className="wallet-flow__note">
            To meet the requirement, transfer more $FABLE into this connected wallet from a wallet
            you control, then select Refresh balance. Fablesol never moves tokens for you, and the
            guides stay open to everyone.
          </p>
        </>
      ) : access.result === 'token_configuration_missing' ? (
        <p role="status">
          <strong>Balance checks are not available right now.</strong> Your wallet is verified, and
          the site works normally. Access verification will open later; no balance is shown because
          none was checked.
        </p>
      ) : access.result === 'rpc_unavailable' ? (
        <p role="status">
          <strong>Verification is temporarily unavailable.</strong> Your holdings could not be
          checked. Please try again shortly.
        </p>
      ) : access.result === 'session_expired' || access.result === 'reverification_required' ? (
        <p role="status">
          <strong>Access check needed.</strong> Verify your current $FABLE holdings to continue to
          protected areas.
        </p>
      ) : access.result === 'wrong_network' ? (
        <p role="status">
          <strong>Unsupported network.</strong> Reconnect your wallet on{' '}
          {networkDisplayName(network)}.
        </p>
      ) : access.result === 'wallet_not_linked' ? (
        <p role="status">
          <strong>No wallet is linked yet.</strong> Connect and verify a wallet to continue.
        </p>
      ) : (
        <p role="status">
          <strong>Verification needed.</strong> Verify your wallet to continue.
        </p>
      )}

      {flowError !== null ? <p role="alert">{flowError.message}</p> : null}

      {busy ? (
        <p role="status" className="wallet-flow__note">
          Refreshing balance… checking your current $FABLE holdings.
        </p>
      ) : refreshMessage !== null ? (
        <p role="status" className="wallet-flow__note">
          {refreshMessage}
        </p>
      ) : null}

      <div className="cta-row">
        {eligible ? (
          <button type="button" className="btn btn-primary" onClick={onEnterFablesol}>
            Enter Fablesol
          </button>
        ) : null}
        {access.result === 'wallet_not_linked' ? (
          <button type="button" className="btn btn-primary" onClick={onReconnect} disabled={busy}>
            Connect wallet
          </button>
        ) : suspended ? null : (
          <button
            type="button"
            className={eligible ? 'btn btn-secondary' : 'btn btn-primary'}
            onClick={onRefreshBalance}
            disabled={busy}
          >
            {busy ? 'Refreshing balance…' : 'Refresh balance'}
          </button>
        )}
        <Link className="btn btn-secondary" href="/account" onClick={onClose}>
          Account
        </Link>
        <button type="button" className="btn btn-ghost" onClick={onLogout} disabled={busy}>
          Log out
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="wallet-flow__note">
        Fablesol never asks for your seed phrase, and a balance check never moves tokens. Wallet
        connection does not give Fablesol control of your funds.
      </p>
    </div>
  );
}
