import 'server-only';

import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { hashClientKey } from './player-gateway';
import { WalletAuthError, type WalletAuthErrorCode } from './wallet-auth';

/**
 * Shared HTTP plumbing for the player API routes: stable machine-readable
 * error codes, player-friendly messages, correlation ids, and no-store
 * caching. Never include stack traces, secrets, or account-existence hints.
 */

export type PlayerApiErrorCode = WalletAuthErrorCode | 'unauthenticated' | 'method_not_allowed';

const ERROR_MESSAGES: Readonly<Record<PlayerApiErrorCode, string>> = {
  invalid_request: 'That request could not be processed. Please try again.',
  rate_limited: 'Too many attempts right now. Please wait a moment and try again.',
  challenge_not_found:
    'This verification request is no longer available. Start again to get a new one.',
  challenge_expired:
    'The verification message expired before it was signed. Start again to get a fresh one.',
  challenge_replayed: 'This verification message was already used. Start again to get a fresh one.',
  challenge_rejected: 'Too many verification attempts. Start again to get a fresh message.',
  signature_invalid:
    'The signature could not be verified. Make sure you signed with the connected wallet.',
  wallet_conflict: 'This wallet is already linked to another Fablesol account.',
  wrong_network: 'The connected wallet is on a different network than Fablesol supports right now.',
  session_unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  service_unavailable: 'This service is temporarily unavailable. Please try again shortly.',
  unauthenticated: 'Sign in with your wallet to continue.',
  method_not_allowed: 'That request method is not supported.',
};

export function newCorrelationId(): string {
  return randomUUID();
}

export function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

export function errorResponse(
  code: PlayerApiErrorCode,
  status: number,
  correlationId: string,
): NextResponse {
  return jsonResponse({ error: { code, message: ERROR_MESSAGES[code] }, correlationId }, status);
}

export function walletAuthErrorResponse(
  error: WalletAuthError,
  correlationId: string,
): NextResponse {
  return errorResponse(error.code, error.httpStatus, correlationId);
}

/** Hashed rate-limit partition key; the raw client address never persists. */
export function clientKeyHashFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const client = forwarded?.split(',')[0]?.trim();
  if (!client) return null;
  return hashClientKey(client);
}

/** Origin the player is actually visiting; binds challenges to this domain. */
export function requestOrigin(request: NextRequest): string {
  return request.nextUrl.origin;
}
