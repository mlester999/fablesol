import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * The player's own server-side view, loaded with the caller's cookie-bound
 * client so RLS and the security-definer self view stay authoritative.
 */

const isoTimestamp = z.string().min(1);

export const playerMeSchema = z.union([
  z
    .object({
      found: z.literal(true),
      profileId: z.uuid(),
      displayLabel: z.string(),
      status: z.enum(['active', 'suspended']),
      onboardingState: z.enum(['profile_created', 'wallet_verified', 'access_checked']),
      accessState: z.enum(['unverified', 'eligible', 'ineligible', 'stale']),
      createdAt: isoTimestamp,
      lastSuccessfulSignInAt: isoTimestamp.nullable(),
      lastWalletVerificationAt: isoTimestamp.nullable(),
      lastAccessVerificationAt: isoTimestamp.nullable(),
      wallet: z
        .object({
          walletId: z.uuid(),
          walletAddress: z.string(),
          network: z.string(),
          firstVerifiedAt: isoTimestamp,
          lastVerifiedAt: isoTimestamp,
        })
        .nullable(),
      accessSession: z
        .object({
          sessionId: z.uuid(),
          expiresAt: isoTimestamp,
          requiredBaseUnits: z.string(),
          observedBaseUnits: z.string(),
          tokenMint: z.string(),
          network: z.string(),
        })
        .nullable(),
      latestEvaluation: z
        .object({
          result: z.string(),
          observedDisplay: z.string().nullable(),
          requiredBaseUnits: z.string().nullable(),
          observedBaseUnits: z.string().nullable(),
          evaluatedAt: isoTimestamp,
        })
        .nullable(),
    })
    .loose(),
  z.object({ found: z.literal(false) }).loose(),
]);

export type PlayerMe = z.infer<typeof playerMeSchema>;
export type PlayerMeFound = Extract<PlayerMe, { found: true }>;

export class PlayerMeUnavailableError extends Error {
  constructor() {
    super('Player profile information is temporarily unavailable.');
    this.name = 'PlayerMeUnavailableError';
  }
}

export async function loadPlayerMe(userClient: SupabaseClient): Promise<PlayerMe> {
  const result = await userClient.rpc('get_player_me');
  if (result.error) {
    throw new PlayerMeUnavailableError();
  }
  const parsed = playerMeSchema.safeParse(result.data);
  if (!parsed.success) {
    throw new PlayerMeUnavailableError();
  }
  return parsed.data;
}
