'use client';

import type { AccessResult, ChallengePurpose, SolanaNetwork } from './config';

/**
 * Browser-side client for the player wallet API. Client state is never a
 * source of truth: every response here is a server statement, and protected
 * access is always re-decided server-side.
 */

export interface AccessViewPayload {
  readonly result: AccessResult;
  readonly network: SolanaNetwork | null;
  readonly requiredTokensDisplay: string;
  readonly observedTokensDisplay: string | null;
  readonly sessionExpiresAt: string | null;
  readonly evaluatedAt: string | null;
  readonly configured: boolean;
}

export interface PlayerStatusPayload {
  readonly displayLabel: string;
  readonly profileStatus: 'active' | 'suspended';
  readonly walletMasked: string | null;
  readonly network: string | null;
  readonly lastAccessVerificationAt: string | null;
}

export type WalletClientErrorCode =
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
  | 'service_unavailable'
  | 'unauthenticated'
  | 'network_error';

export class WalletClientError extends Error {
  readonly code: WalletClientErrorCode;

  constructor(code: WalletClientErrorCode, message: string) {
    super(message);
    this.name = 'WalletClientError';
    this.code = code;
  }
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
  } catch {
    throw new WalletClientError('network_error', 'The connection dropped. Please try again.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const error =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error: { code?: string; message?: string } }).error
        : undefined;
    const code = (error?.code ?? 'service_unavailable') as WalletClientErrorCode;
    throw new WalletClientError(
      code,
      error?.message ?? 'This service is temporarily unavailable. Please try again shortly.',
    );
  }

  return body as T;
}

export interface ChallengeResponse {
  readonly challengeId: string;
  readonly message: string;
  readonly expiresAt: string;
}

export function requestWalletChallenge(input: {
  walletAddress: string;
  network: SolanaNetwork;
  purpose?: ChallengePurpose;
}): Promise<ChallengeResponse> {
  return requestJson<ChallengeResponse>('/api/wallet/challenge', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: input.walletAddress,
      network: input.network,
      purpose: input.purpose ?? 'sign_in',
    }),
  });
}

export interface VerifyResponse {
  readonly player: {
    readonly walletMasked: string;
    readonly profileStatus: 'active' | 'suspended';
    readonly isNewPlayer: boolean;
  };
  readonly access: AccessViewPayload;
}

export function verifyWalletChallenge(input: {
  challengeId: string;
  walletAddress: string;
  network: SolanaNetwork;
  message: string;
  signature: string;
}): Promise<VerifyResponse> {
  return requestJson<VerifyResponse>('/api/wallet/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface ReplaceResponse {
  readonly wallet: { readonly walletMasked: string };
  readonly replaced: boolean;
  readonly access: AccessViewPayload;
}

export function replaceWalletWithChallenge(input: {
  challengeId: string;
  walletAddress: string;
  network: SolanaNetwork;
  message: string;
  signature: string;
}): Promise<ReplaceResponse> {
  return requestJson<ReplaceResponse>('/api/wallet/replace', {
    method: 'POST',
    body: JSON.stringify({ ...input, confirmReplacement: true }),
  });
}

export interface StatusResponse {
  readonly access: AccessViewPayload;
  readonly player: PlayerStatusPayload | null;
}

export function fetchAccessStatus(): Promise<StatusResponse> {
  return requestJson<StatusResponse>('/api/access/status', { method: 'GET' });
}

export interface RenewResponse {
  readonly access: AccessViewPayload;
}

export function renewAccess(): Promise<RenewResponse> {
  return requestJson<RenewResponse>('/api/access/renew', { method: 'POST' });
}

export function logoutPlayer(): Promise<{ loggedOut: boolean }> {
  return requestJson<{ loggedOut: boolean }>('/api/player/logout', { method: 'POST' });
}

export function encodeSignatureBase64(signature: Uint8Array): string {
  let binary = '';
  for (const byte of signature) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
