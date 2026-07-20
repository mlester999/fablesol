import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getWalletServerEnv } from '@/lib/env';
import { deriveDisplayLabel, type ChallengePurpose, type SolanaNetwork } from '@/lib/wallet/config';
import { createWalletMessage, parseWalletMessage } from '@/lib/wallet/message';
import { generateNonce, sha256Hex, type PlayerGateway } from './player-gateway';
import {
  createPlayerAuthUser,
  deletePlayerAuthUser,
  establishPlayerSession,
} from './session-bridge';
import { normalizeSolanaAddress, verifyWalletSignature } from './solana';

/**
 * Wallet-auth orchestration: challenge issuance, server-side signature
 * verification, single-use consumption, and the Supabase session bridge.
 *
 * Failure philosophy: fail closed, return stable machine codes, never leak
 * whether another wallet already has an account beyond the explicit
 * wallet-conflict path, and never log secrets or raw signatures.
 */

export type WalletAuthErrorCode =
  | 'invalid_request'
  | 'rate_limited'
  | 'challenge_not_found'
  | 'challenge_expired'
  | 'challenge_replayed'
  | 'challenge_rejected'
  | 'signature_invalid'
  | 'wallet_conflict'
  | 'wrong_network'
  | 'session_unavailable'
  | 'service_unavailable';

export class WalletAuthError extends Error {
  readonly code: WalletAuthErrorCode;
  readonly httpStatus: number;

  constructor(code: WalletAuthErrorCode, httpStatus: number) {
    super(`Wallet authentication failed: ${code}`);
    this.name = 'WalletAuthError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface IssuedChallenge {
  readonly challengeId: string;
  readonly message: string;
  readonly expiresAt: string;
}

export async function issueChallenge(input: {
  gateway: PlayerGateway;
  walletAddress: string;
  network: SolanaNetwork;
  requestOrigin: string;
  purpose: ChallengePurpose;
  requestedByUserId: string | null;
  clientKeyHash: string | null;
  correlationId: string;
}): Promise<IssuedChallenge> {
  let canonicalWallet: string;
  try {
    canonicalWallet = normalizeSolanaAddress(input.walletAddress);
  } catch {
    throw new WalletAuthError('invalid_request', 400);
  }

  let origin: URL;
  try {
    origin = new URL(input.requestOrigin);
  } catch {
    throw new WalletAuthError('invalid_request', 400);
  }

  const { walletChallengeTtlSeconds } = getWalletServerEnv();
  const challengeId = randomUUID();
  const nonce = generateNonce();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + walletChallengeTtlSeconds * 1_000);

  const message = createWalletMessage({
    domain: origin.host,
    uri: origin.origin,
    walletAddress: canonicalWallet,
    network: input.network,
    nonce,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    challengeId,
  });

  const issued = await input.gateway.issueChallenge({
    challengeId,
    walletAddress: canonicalWallet,
    network: input.network,
    domain: origin.host,
    uri: origin.origin,
    purpose: input.purpose,
    requestedByUserId: input.requestedByUserId,
    nonceHash: sha256Hex(nonce),
    messageHash: sha256Hex(message),
    ttlSeconds: walletChallengeTtlSeconds,
    clientKeyHash: input.clientKeyHash,
    correlationId: input.correlationId,
  });

  if (issued.status === 'rate_limited') {
    throw new WalletAuthError('rate_limited', 429);
  }
  if (issued.status !== 'created') {
    throw new WalletAuthError('invalid_request', 400);
  }
  if (issued.challengeId !== challengeId) {
    // The stored id MUST be the id inside the signed message, or the
    // verify-time challenge binding can never hold. Fail closed.
    throw new WalletAuthError('service_unavailable', 503);
  }

  // The server stores only hashes; the full message goes to the wallet once.
  return { challengeId: issued.challengeId, message, expiresAt: expiresAt.toISOString() };
}

export interface VerifiedChallenge {
  readonly walletAddress: string;
  readonly network: SolanaNetwork;
  readonly purpose: ChallengePurpose;
  readonly requestedByUserId: string | null;
  readonly challengeId: string;
}

/**
 * Verifies a signed challenge end to end: binding checks, canonical message
 * equality, ed25519 signature, then single-use consumption. Fails closed.
 */
export async function verifySignedChallenge(input: {
  gateway: PlayerGateway;
  challengeId: string;
  walletAddress: string;
  network: SolanaNetwork;
  message: string;
  signatureBase64: string;
  requestOrigin: string;
  correlationId: string;
}): Promise<VerifiedChallenge> {
  let canonicalWallet: string;
  try {
    canonicalWallet = normalizeSolanaAddress(input.walletAddress);
  } catch {
    throw new WalletAuthError('invalid_request', 400);
  }

  const begun = await input.gateway.beginVerification({
    challengeId: input.challengeId,
    walletAddress: canonicalWallet,
    correlationId: input.correlationId,
  });

  switch (begun.status) {
    case 'pending':
      break;
    case 'replayed':
      throw new WalletAuthError('challenge_replayed', 409);
    case 'expired':
      throw new WalletAuthError('challenge_expired', 409);
    case 'rejected':
      throw new WalletAuthError('challenge_rejected', 429);
    case 'not_found':
    case 'wallet_mismatch':
    default:
      throw new WalletAuthError('challenge_not_found', 404);
  }

  let parsed;
  try {
    parsed = parseWalletMessage(input.message);
  } catch {
    throw new WalletAuthError('invalid_request', 422);
  }

  let expectedOrigin: URL;
  try {
    expectedOrigin = new URL(input.requestOrigin);
  } catch {
    throw new WalletAuthError('invalid_request', 400);
  }

  const bindingsMatch =
    parsed.challengeId === input.challengeId &&
    parsed.walletAddress === canonicalWallet &&
    parsed.network === input.network &&
    parsed.network === begun.network &&
    parsed.domain === begun.domain &&
    parsed.domain === expectedOrigin.host &&
    parsed.uri === begun.uri &&
    sha256Hex(parsed.nonce) === begun.nonceHash &&
    sha256Hex(input.message) === begun.messageHash &&
    Date.parse(parsed.expiresAt) > Date.now();

  if (!bindingsMatch) {
    await input.gateway.recordWalletEvent({
      challengeId: input.challengeId,
      walletAddress: canonicalWallet,
      eventKey: 'wallet.challenge.rejected',
      result: 'denied',
      reasonCode: 'binding_mismatch',
      correlationId: input.correlationId,
    });
    throw new WalletAuthError('invalid_request', 422);
  }

  const signatureValid = verifyWalletSignature({
    walletAddress: canonicalWallet,
    message: input.message,
    signatureBase64: input.signatureBase64,
  });

  if (!signatureValid) {
    await input.gateway.recordWalletEvent({
      challengeId: input.challengeId,
      walletAddress: canonicalWallet,
      eventKey: 'wallet.signature.denied',
      result: 'denied',
      reasonCode: 'signature_invalid',
      correlationId: input.correlationId,
    });
    throw new WalletAuthError('signature_invalid', 422);
  }

  const consumed = await input.gateway.consumeChallenge({
    challengeId: input.challengeId,
    walletAddress: canonicalWallet,
    messageHash: begun.messageHash,
    correlationId: input.correlationId,
  });

  if (consumed.status !== 'consumed') {
    throw new WalletAuthError('challenge_replayed', 409);
  }

  return {
    walletAddress: canonicalWallet,
    network: input.network,
    purpose: consumed.purpose,
    requestedByUserId: consumed.requestedByUserId,
    challengeId: input.challengeId,
  };
}

export interface PlayerSignInResult {
  readonly userId: string;
  readonly profileStatus: 'active' | 'suspended';
  readonly isNewPlayer: boolean;
}

/**
 * After a verified sign-in challenge: find or create the player, then mint
 * the Supabase session into the caller's cookies.
 */
export async function signInVerifiedWallet(input: {
  gateway: PlayerGateway;
  service: SupabaseClient;
  cookieClient: SupabaseClient;
  walletAddress: string;
  network: SolanaNetwork;
  correlationId: string;
}): Promise<PlayerSignInResult> {
  const existing = await input.gateway.findByWallet(input.walletAddress);

  let userId: string;
  let email: string | undefined;
  let isNewPlayer = false;

  if (existing.found) {
    userId = existing.userId;
    const user = await input.service.auth.admin.getUserById(userId);
    if (user.error || !user.data.user?.email) {
      throw new WalletAuthError('session_unavailable', 503);
    }
    email = user.data.user.email;
  } else {
    const createdUser = await createPlayerAuthUser(
      input.service,
      deriveDisplayLabel(input.walletAddress),
    );
    const registered = await input.gateway.register({
      userId: createdUser.id,
      walletAddress: input.walletAddress,
      network: input.network,
      displayLabel: deriveDisplayLabel(input.walletAddress),
      correlationId: input.correlationId,
    });

    if (registered.status !== 'created') {
      // A concurrent request linked this wallet first. Remove the unused auth
      // user and fall back to the winner's account when it exists.
      await deletePlayerAuthUser(input.service, createdUser.id);
      const winner = await input.gateway.findByWallet(input.walletAddress);
      if (!winner.found) {
        throw new WalletAuthError('wallet_conflict', 409);
      }
      userId = winner.userId;
      const user = await input.service.auth.admin.getUserById(userId);
      if (user.error || !user.data.user?.email) {
        throw new WalletAuthError('session_unavailable', 503);
      }
      email = user.data.user.email;
    } else {
      userId = createdUser.id;
      email = createdUser.email ?? undefined;
      isNewPlayer = true;
    }
  }

  if (!email) {
    throw new WalletAuthError('session_unavailable', 503);
  }

  await establishPlayerSession(input.service, input.cookieClient, email);

  const signIn = await input.gateway.recordSignIn({
    userId,
    walletAddress: input.walletAddress,
    correlationId: input.correlationId,
  });

  return {
    userId,
    profileStatus: signIn.status === 'ok' ? signIn.profileStatus : 'active',
    isNewPlayer,
  };
}
