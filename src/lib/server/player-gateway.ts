import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { ChallengePurpose, SolanaNetwork } from '@/lib/wallet/config';

/**
 * Thin, typed wrapper around the Phase 2B security-definer database
 * functions. Only the trusted server calls these with the service role; the
 * database revalidates every argument and enforces rate limits, single-use
 * challenges, and append-only history on its side.
 */

export class PlayerGatewayError extends Error {
  constructor(operation: string) {
    super(`Player persistence operation failed: ${operation}`);
    this.name = 'PlayerGatewayError';
  }
}

export function generateNonce(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Rate-limit partition key; only the hash ever leaves this process. */
export function hashClientKey(value: string): string {
  return sha256Hex(`fablesol-client:${value}`);
}

const issueChallengeSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('created'),
      challengeId: z.uuid(),
      issuedAt: z.string(),
      expiresAt: z.string(),
    })
    .loose(),
  z.object({ status: z.literal('rate_limited'), reasonCode: z.string() }).loose(),
  z.object({ status: z.literal('invalid'), reasonCode: z.string() }).loose(),
]);

const beginVerificationSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('pending'),
      challengeId: z.uuid(),
      walletAddress: z.string(),
      network: z.string(),
      domain: z.string(),
      uri: z.string(),
      purpose: z.enum(['sign_in', 'wallet_replacement']),
      requestedByUserId: z.uuid().nullable(),
      nonceHash: z.string(),
      messageHash: z.string(),
      issuedAt: z.string(),
      expiresAt: z.string(),
    })
    .loose(),
  z.object({ status: z.literal('not_found') }).loose(),
  z.object({ status: z.literal('wallet_mismatch') }).loose(),
  z.object({ status: z.literal('replayed') }).loose(),
  z.object({ status: z.literal('expired') }).loose(),
  z.object({ status: z.literal('rejected') }).loose(),
  z.object({ status: z.literal('invalid') }).loose(),
]);

const consumeChallengeSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('consumed'),
      challengeId: z.uuid(),
      purpose: z.enum(['sign_in', 'wallet_replacement']),
      network: z.string(),
      requestedByUserId: z.uuid().nullable(),
    })
    .loose(),
  z.object({ status: z.literal('not_consumable') }).loose(),
  z.object({ status: z.literal('invalid') }).loose(),
]);

const findByWalletSchema = z.union([
  z
    .object({
      found: z.literal(true),
      userId: z.uuid(),
      profileId: z.uuid(),
      profileStatus: z.enum(['active', 'suspended']),
      displayLabel: z.string(),
      walletId: z.uuid(),
      network: z.string(),
    })
    .loose(),
  z.object({ found: z.literal(false) }).loose(),
]);

const registerSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('created'), profileId: z.uuid(), walletId: z.uuid() }).loose(),
  z.object({ status: z.literal('conflict'), reasonCode: z.string() }).loose(),
  z.object({ status: z.literal('invalid'), reasonCode: z.string() }).loose(),
]);

const signInSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('ok'),
      profileId: z.uuid(),
      profileStatus: z.enum(['active', 'suspended']),
    })
    .loose(),
  z.object({ status: z.literal('not_found') }).loose(),
]);

const replaceWalletSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('replaced'), walletId: z.uuid() }).loose(),
  z.object({ status: z.literal('unchanged'), reasonCode: z.string() }).loose(),
  z.object({ status: z.literal('conflict'), reasonCode: z.string() }).loose(),
  z.object({ status: z.literal('denied'), reasonCode: z.string() }).loose(),
  z.object({ status: z.literal('not_found') }).loose(),
  z.object({ status: z.literal('invalid'), reasonCode: z.string() }).loose(),
]);

const recordEvaluationSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('recorded'),
      evaluationId: z.uuid(),
      sessionId: z.uuid().nullable(),
      sessionExpiresAt: z.string().nullable(),
    })
    .loose(),
  z.object({ status: z.literal('not_found') }).loose(),
  z.object({ status: z.literal('invalid'), reasonCode: z.string() }).loose(),
]);

async function callRpc<T>(
  service: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
  schema: z.ZodType<T>,
): Promise<T> {
  const result = await service.rpc(fn, args);
  if (result.error) {
    throw new PlayerGatewayError(fn);
  }
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    throw new PlayerGatewayError(fn);
  }
  return parsed.data;
}

export type IssueChallengeResult = z.infer<typeof issueChallengeSchema>;
export type BeginVerificationResult = z.infer<typeof beginVerificationSchema>;
export type ConsumeChallengeResult = z.infer<typeof consumeChallengeSchema>;
export type FindByWalletResult = z.infer<typeof findByWalletSchema>;
export type RegisterResult = z.infer<typeof registerSchema>;
export type SignInResult = z.infer<typeof signInSchema>;
export type ReplaceWalletResult = z.infer<typeof replaceWalletSchema>;
export type RecordEvaluationResult = z.infer<typeof recordEvaluationSchema>;

export function createPlayerGateway(service: SupabaseClient) {
  return {
    issueChallenge(input: {
      /** Server-generated id; it is embedded in the signed message and MUST
       *  become the stored row id so the verify-time binding can hold. */
      challengeId: string;
      walletAddress: string;
      network: SolanaNetwork;
      domain: string;
      uri: string;
      purpose: ChallengePurpose;
      requestedByUserId: string | null;
      nonceHash: string;
      messageHash: string;
      ttlSeconds: number;
      clientKeyHash: string | null;
      correlationId: string;
    }): Promise<IssueChallengeResult> {
      return callRpc(
        service,
        'player_issue_wallet_challenge',
        {
          p_challenge_id: input.challengeId,
          p_wallet_address: input.walletAddress,
          p_network: input.network,
          p_domain: input.domain,
          p_uri: input.uri,
          p_purpose: input.purpose,
          p_requested_by_user_id: input.requestedByUserId,
          p_nonce_hash: input.nonceHash,
          p_message_hash: input.messageHash,
          p_ttl_seconds: input.ttlSeconds,
          p_client_key_hash: input.clientKeyHash,
          p_correlation_id: input.correlationId,
        },
        issueChallengeSchema,
      );
    },

    beginVerification(input: {
      challengeId: string;
      walletAddress: string;
      correlationId: string;
    }): Promise<BeginVerificationResult> {
      return callRpc(
        service,
        'player_begin_challenge_verification',
        {
          p_challenge_id: input.challengeId,
          p_wallet_address: input.walletAddress,
          p_correlation_id: input.correlationId,
        },
        beginVerificationSchema,
      );
    },

    consumeChallenge(input: {
      challengeId: string;
      walletAddress: string;
      messageHash: string;
      correlationId: string;
    }): Promise<ConsumeChallengeResult> {
      return callRpc(
        service,
        'player_consume_challenge',
        {
          p_challenge_id: input.challengeId,
          p_wallet_address: input.walletAddress,
          p_message_hash: input.messageHash,
          p_correlation_id: input.correlationId,
        },
        consumeChallengeSchema,
      );
    },

    async recordWalletEvent(input: {
      challengeId: string | null;
      walletAddress: string;
      eventKey: string;
      result: 'success' | 'denied' | 'error';
      reasonCode: string | null;
      correlationId: string;
    }): Promise<void> {
      const result = await service.rpc('player_record_wallet_event', {
        p_challenge_id: input.challengeId,
        p_wallet_address: input.walletAddress,
        p_event_key: input.eventKey,
        p_result: input.result,
        p_reason_code: input.reasonCode,
        p_correlation_id: input.correlationId,
      });
      if (result.error) throw new PlayerGatewayError('player_record_wallet_event');
    },

    findByWallet(walletAddress: string): Promise<FindByWalletResult> {
      return callRpc(
        service,
        'player_find_by_wallet',
        { p_wallet_address: walletAddress },
        findByWalletSchema,
      );
    },

    register(input: {
      userId: string;
      walletAddress: string;
      network: SolanaNetwork;
      displayLabel: string;
      correlationId: string;
    }): Promise<RegisterResult> {
      return callRpc(
        service,
        'player_register',
        {
          p_user_id: input.userId,
          p_wallet_address: input.walletAddress,
          p_network: input.network,
          p_display_label: input.displayLabel,
          p_correlation_id: input.correlationId,
        },
        registerSchema,
      );
    },

    recordSignIn(input: {
      userId: string;
      walletAddress: string;
      correlationId: string;
    }): Promise<SignInResult> {
      return callRpc(
        service,
        'player_record_sign_in',
        {
          p_user_id: input.userId,
          p_wallet_address: input.walletAddress,
          p_correlation_id: input.correlationId,
        },
        signInSchema,
      );
    },

    replaceWallet(input: {
      userId: string;
      newWalletAddress: string;
      network: SolanaNetwork;
      correlationId: string;
    }): Promise<ReplaceWalletResult> {
      return callRpc(
        service,
        'player_replace_wallet',
        {
          p_user_id: input.userId,
          p_new_wallet_address: input.newWalletAddress,
          p_network: input.network,
          p_correlation_id: input.correlationId,
        },
        replaceWalletSchema,
      );
    },

    recordAccessEvaluation(input: {
      userId: string;
      result: string;
      walletId: string | null;
      walletAddress: string | null;
      network: SolanaNetwork;
      tokenMint: string | null;
      tokenDecimals: number | null;
      requiredBaseUnits: string | null;
      observedBaseUnits: string | null;
      observedDisplay: string | null;
      tokenAccountCount: number | null;
      rpcSlot: number | null;
      sessionTtlSeconds: number | null;
      correlationId: string;
    }): Promise<RecordEvaluationResult> {
      return callRpc(
        service,
        'player_record_access_evaluation',
        {
          p_user_id: input.userId,
          p_result: input.result,
          p_wallet_id: input.walletId,
          p_wallet_address: input.walletAddress,
          p_network: input.network,
          p_token_mint: input.tokenMint,
          p_token_decimals: input.tokenDecimals,
          p_required_base_units: input.requiredBaseUnits,
          p_observed_base_units: input.observedBaseUnits,
          p_observed_display: input.observedDisplay,
          p_token_account_count: input.tokenAccountCount,
          p_rpc_slot: input.rpcSlot,
          p_session_ttl_seconds: input.sessionTtlSeconds,
          p_correlation_id: input.correlationId,
        },
        recordEvaluationSchema,
      );
    },

    async invalidateAccessSessions(input: {
      userId: string;
      reason: string;
      correlationId: string;
    }): Promise<void> {
      const result = await service.rpc('player_invalidate_access_sessions', {
        p_user_id: input.userId,
        p_reason: input.reason,
        p_correlation_id: input.correlationId,
      });
      if (result.error) throw new PlayerGatewayError('player_invalidate_access_sessions');
    },

    async recordSecurityEvent(input: {
      userId: string | null;
      walletAddress: string | null;
      eventKey: string;
      result: 'success' | 'denied' | 'error';
      reasonCode: string | null;
      correlationId: string;
    }): Promise<void> {
      const result = await service.rpc('player_record_security_event', {
        p_user_id: input.userId,
        p_wallet_address: input.walletAddress,
        p_event_key: input.eventKey,
        p_result: input.result,
        p_reason_code: input.reasonCode,
        p_correlation_id: input.correlationId,
      });
      if (result.error) throw new PlayerGatewayError('player_record_security_event');
    },
  };
}

export type PlayerGateway = ReturnType<typeof createPlayerGateway>;
