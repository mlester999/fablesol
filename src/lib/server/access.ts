import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getPublicEnv, getWalletServerEnv } from '@/lib/env';
import {
  baseUnitsToDecimalString,
  decimalAmountToBaseUnits,
  formatDecimalString,
} from '@/lib/wallet/amounts';
import { isWalletAddressShaped, type AccessResult, type SolanaNetwork } from '@/lib/wallet/config';
import { loadPlayerMe, type PlayerMeFound } from './player-me';
import type { PlayerGateway } from './player-gateway';
import {
  createSolanaTokenVerifier,
  SolanaVerificationError,
  type SolanaTokenVerifier,
} from './solana';

/**
 * The one canonical server-authoritative access evaluator.
 *
 * Every protected entry point (initial entry, refresh, reconnect, renewal,
 * wallet change, and future multiplayer channel establishment) calls this
 * contract. The client never supplies a balance and can never mark itself
 * eligible; all evidence comes from the configured RPC endpoint and is
 * persisted with the decision.
 */

export interface AccessView {
  readonly result: AccessResult;
  readonly network: SolanaNetwork | null;
  readonly requiredTokensDisplay: string;
  readonly observedTokensDisplay: string | null;
  readonly sessionExpiresAt: string | null;
  readonly evaluatedAt: string | null;
  readonly configured: boolean;
}

export interface AccessEvaluationOutcome {
  readonly view: AccessView;
  readonly me: PlayerMeFound | null;
}

interface WalletAccessConfig {
  readonly network: SolanaNetwork;
  readonly rpcUrl: string;
  readonly tokenMint: string;
  readonly requiredTokens: string;
  readonly sessionTtlSeconds: number;
}

export function resolveWalletAccessConfig(): WalletAccessConfig | undefined {
  const publicEnv = getPublicEnv();
  const serverEnv = getWalletServerEnv();

  if (
    publicEnv.solanaNetwork === undefined ||
    serverEnv.solanaRpcUrl === undefined ||
    serverEnv.fableTokenMint === undefined ||
    !isWalletAddressShaped(serverEnv.fableTokenMint) ||
    !/^\d+(?:\.\d+)?$/u.test(serverEnv.fableAccessRequiredTokens)
  ) {
    return undefined;
  }

  return {
    network: publicEnv.solanaNetwork,
    rpcUrl: serverEnv.solanaRpcUrl,
    tokenMint: serverEnv.fableTokenMint,
    requiredTokens: serverEnv.fableAccessRequiredTokens,
    sessionTtlSeconds: serverEnv.playerAccessSessionTtlSeconds,
  };
}

export function requiredTokensDisplay(): string {
  return formatDecimalString(getWalletServerEnv().fableAccessRequiredTokens);
}

function view(
  result: AccessResult,
  overrides: Partial<Omit<AccessView, 'result'>> = {},
): AccessView {
  return {
    result,
    network: getPublicEnv().solanaNetwork ?? null,
    requiredTokensDisplay: requiredTokensDisplay(),
    observedTokensDisplay: null,
    sessionExpiresAt: null,
    evaluatedAt: null,
    configured: resolveWalletAccessConfig() !== undefined,
    ...overrides,
  };
}

export interface EvaluateAccessInput {
  readonly userClient: SupabaseClient;
  readonly gateway: PlayerGateway;
  readonly userId: string;
  readonly correlationId: string;
  /** Injectable for tests; production uses the configured RPC endpoint. */
  readonly verifier?: SolanaTokenVerifier;
}

/** Runs a fresh balance verification and persists the decision. */
export async function evaluateAccess(input: EvaluateAccessInput): Promise<AccessEvaluationOutcome> {
  const me = await loadPlayerMe(input.userClient);
  if (!me.found) {
    return { view: view('wallet_not_linked'), me: null };
  }

  const config = resolveWalletAccessConfig();

  if (me.status === 'suspended') {
    if (config !== undefined) {
      await input.gateway.recordAccessEvaluation({
        userId: input.userId,
        result: 'profile_suspended',
        walletId: me.wallet?.walletId ?? null,
        walletAddress: me.wallet?.walletAddress ?? null,
        network: config.network,
        tokenMint: null,
        tokenDecimals: null,
        requiredBaseUnits: null,
        observedBaseUnits: null,
        observedDisplay: null,
        tokenAccountCount: null,
        rpcSlot: null,
        sessionTtlSeconds: null,
        correlationId: input.correlationId,
      });
    }
    return { view: view('profile_suspended'), me };
  }

  if (me.wallet === null) {
    return { view: view('wallet_not_linked'), me };
  }

  if (config === undefined) {
    // Fail safe and stay honest: no mint, no balance, no access.
    const publicEnv = getPublicEnv();
    if (publicEnv.solanaNetwork !== undefined) {
      await input.gateway.recordAccessEvaluation({
        userId: input.userId,
        result: 'token_configuration_missing',
        walletId: me.wallet.walletId,
        walletAddress: me.wallet.walletAddress,
        network: publicEnv.solanaNetwork,
        tokenMint: null,
        tokenDecimals: null,
        requiredBaseUnits: null,
        observedBaseUnits: null,
        observedDisplay: null,
        tokenAccountCount: null,
        rpcSlot: null,
        sessionTtlSeconds: null,
        correlationId: input.correlationId,
      });
    }
    return { view: view('token_configuration_missing'), me };
  }

  if (me.wallet.network !== config.network) {
    await input.gateway.recordAccessEvaluation({
      userId: input.userId,
      result: 'wrong_network',
      walletId: me.wallet.walletId,
      walletAddress: me.wallet.walletAddress,
      network: config.network,
      tokenMint: config.tokenMint,
      tokenDecimals: null,
      requiredBaseUnits: null,
      observedBaseUnits: null,
      observedDisplay: null,
      tokenAccountCount: null,
      rpcSlot: null,
      sessionTtlSeconds: null,
      correlationId: input.correlationId,
    });
    return { view: view('wrong_network'), me };
  }

  const verifier =
    input.verifier ?? createSolanaTokenVerifier({ rpcUrl: config.rpcUrl, network: config.network });

  let balance;
  try {
    balance = await verifier.verifyBalance(me.wallet.walletAddress, config.tokenMint);
  } catch (error) {
    const reason: AccessResult =
      error instanceof SolanaVerificationError && error.code === 'NETWORK_MISMATCH'
        ? 'wrong_network'
        : 'rpc_unavailable';
    await input.gateway.recordAccessEvaluation({
      userId: input.userId,
      result: reason,
      walletId: me.wallet.walletId,
      walletAddress: me.wallet.walletAddress,
      network: config.network,
      tokenMint: config.tokenMint,
      tokenDecimals: null,
      requiredBaseUnits: null,
      observedBaseUnits: null,
      observedDisplay: null,
      tokenAccountCount: null,
      rpcSlot: null,
      sessionTtlSeconds: null,
      correlationId: input.correlationId,
    });
    return { view: view(reason), me };
  }

  // Integer base units decide eligibility; no floating point is involved.
  const requiredBaseUnits = decimalAmountToBaseUnits(config.requiredTokens, balance.decimals);
  const observedDisplay = baseUnitsToDecimalString(balance.baseUnits, balance.decimals);
  const eligible = balance.baseUnits >= requiredBaseUnits;
  const result: AccessResult = eligible ? 'eligible' : 'balance_below_requirement';

  const recorded = await input.gateway.recordAccessEvaluation({
    userId: input.userId,
    result,
    walletId: me.wallet.walletId,
    walletAddress: balance.walletAddress,
    network: config.network,
    tokenMint: balance.mintAddress,
    tokenDecimals: balance.decimals,
    requiredBaseUnits: requiredBaseUnits.toString(),
    observedBaseUnits: balance.baseUnits.toString(),
    observedDisplay,
    tokenAccountCount: balance.tokenAccountCount,
    rpcSlot: balance.slot,
    sessionTtlSeconds: eligible ? config.sessionTtlSeconds : null,
    correlationId: input.correlationId,
  });

  const sessionExpiresAt =
    recorded.status === 'recorded' && recorded.sessionExpiresAt !== null
      ? recorded.sessionExpiresAt
      : null;

  return {
    view: view(result, {
      observedTokensDisplay: formatDecimalString(observedDisplay),
      sessionExpiresAt,
      evaluatedAt: new Date().toISOString(),
    }),
    me,
  };
}

/**
 * Reads the current access state without a fresh RPC check. An unexpired
 * access session remains valid until its own expiration; an expired or
 * missing one requires renewal through evaluateAccess.
 */
export async function loadAccessStatus(
  userClient: SupabaseClient,
): Promise<AccessEvaluationOutcome> {
  const me = await loadPlayerMe(userClient);
  if (!me.found) {
    return { view: view('wallet_not_linked'), me: null };
  }

  if (me.status === 'suspended') {
    return { view: view('profile_suspended'), me };
  }

  if (me.wallet === null) {
    return { view: view('wallet_not_linked'), me };
  }

  if (me.accessSession !== null && Date.parse(me.accessSession.expiresAt) > Date.now()) {
    const latest = me.latestEvaluation;
    return {
      view: view('eligible', {
        observedTokensDisplay:
          latest?.observedDisplay != null ? formatDecimalString(latest.observedDisplay) : null,
        sessionExpiresAt: me.accessSession.expiresAt,
        evaluatedAt: latest?.evaluatedAt ?? null,
      }),
      me,
    };
  }

  if (me.accessSession === null && me.latestEvaluation === null) {
    return { view: view('reverification_required'), me };
  }

  return { view: view('session_expired'), me };
}
