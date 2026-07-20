import 'server-only';

import { z } from 'zod';

import { createAdminServerClient } from './supabase/server';

/**
 * Phase 2B player directory data access. Every loader calls a
 * security-definer database function that re-checks the caller's admin
 * permissions server-side. No signature material, session tokens, or
 * challenge secrets ever appear in these payloads.
 */

const isoTimestamp = z.string().min(1);

export const playerDirectoryEntrySchema = z
  .object({
    userId: z.uuid(),
    profileId: z.uuid(),
    displayLabel: z.string(),
    status: z.enum(['active', 'suspended']),
    onboardingState: z.enum(['profile_created', 'wallet_verified', 'access_checked']),
    accessState: z.enum(['unverified', 'eligible', 'ineligible', 'stale']),
    walletMasked: z.string().nullable(),
    walletVerificationState: z.enum(['verified', 'unlinked']),
    lastAccessVerificationAt: isoTimestamp.nullable(),
    lastSignInAt: isoTimestamp.nullable(),
    createdAt: isoTimestamp,
  })
  .strict();

export type PlayerDirectoryEntry = z.infer<typeof playerDirectoryEntrySchema>;

export const playerWalletHistoryEntrySchema = z
  .object({
    walletId: z.uuid(),
    wallet: z.string(),
    network: z.string(),
    status: z.enum(['active', 'replaced', 'removed']),
    firstVerifiedAt: isoTimestamp,
    lastVerifiedAt: isoTimestamp,
    replacedAt: isoTimestamp.nullable(),
    createdAt: isoTimestamp,
  })
  .strict();

export const playerAccessEvaluationEntrySchema = z
  .object({
    evaluationId: z.uuid(),
    result: z.string(),
    network: z.string(),
    tokenMintMasked: z.string().nullable(),
    requiredBaseUnits: z.string().nullable(),
    observedBaseUnits: z.string().nullable(),
    observedDisplay: z.string().nullable(),
    tokenAccountCount: z.number().int().nullable(),
    walletMasked: z.string().nullable(),
    correlationId: z.string().nullable(),
    evaluatedAt: isoTimestamp,
  })
  .strict();

export const playerAccessSessionEntrySchema = z
  .object({
    sessionId: z.uuid(),
    walletMasked: z.string().nullable(),
    network: z.string(),
    expiresAt: isoTimestamp,
    invalidatedAt: isoTimestamp.nullable(),
    invalidationReason: z.string().nullable(),
    createdAt: isoTimestamp,
  })
  .strict();

export const playerSecurityEventEntrySchema = z
  .object({
    eventId: z.uuid(),
    eventKey: z.string(),
    result: z.enum(['success', 'denied', 'error']),
    reasonCode: z.string().nullable(),
    walletMasked: z.string().nullable(),
    correlationId: z.string().nullable(),
    createdAt: isoTimestamp,
  })
  .strict();

export const playerDetailSchema = z
  .object({
    found: z.literal(true),
    profile: z
      .object({
        userId: z.uuid(),
        profileId: z.uuid(),
        displayLabel: z.string(),
        status: z.enum(['active', 'suspended']),
        onboardingState: z.enum(['profile_created', 'wallet_verified', 'access_checked']),
        accessState: z.enum(['unverified', 'eligible', 'ineligible', 'stale']),
        suspendedAt: isoTimestamp.nullable(),
        suspensionReason: z.string().nullable(),
        createdAt: isoTimestamp,
        updatedAt: isoTimestamp,
        lastSignInAt: isoTimestamp.nullable(),
        lastWalletVerificationAt: isoTimestamp.nullable(),
        lastAccessVerificationAt: isoTimestamp.nullable(),
      })
      .strict(),
    wallets: z.array(playerWalletHistoryEntrySchema),
    accessEvaluations: z.array(playerAccessEvaluationEntrySchema).nullable(),
    accessSessions: z.array(playerAccessSessionEntrySchema).nullable(),
    securityEvents: z.array(playerSecurityEventEntrySchema).nullable(),
    permissions: z
      .object({
        supportView: z.boolean(),
        accessHistory: z.boolean(),
        securityEvents: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type PlayerDetail = z.infer<typeof playerDetailSchema>;

const playerDetailResponseSchema = z.union([
  playerDetailSchema,
  z.object({ found: z.literal(false) }).loose(),
]);

export async function loadPlayerDirectory(): Promise<readonly PlayerDirectoryEntry[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('get_player_directory');
  if (result.error) {
    throw new Error('The player directory is temporarily unavailable.');
  }
  return z.array(playerDirectoryEntrySchema).parse(result.data ?? []);
}

export async function loadPlayerDetail(userId: string): Promise<PlayerDetail | undefined> {
  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('get_player_detail', { p_user_id: userId });
  if (result.error) {
    throw new Error('Player detail is temporarily unavailable.');
  }
  const parsed = playerDetailResponseSchema.parse(result.data);
  return parsed.found ? parsed : undefined;
}
