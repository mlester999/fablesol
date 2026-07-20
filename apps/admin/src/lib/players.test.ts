import { describe, expect, it } from 'vitest';

import {
  playerAccessEvaluationEntrySchema,
  playerAccessSessionEntrySchema,
  playerDetailSchema,
  playerDirectoryEntrySchema,
  playerSecurityEventEntrySchema,
  playerWalletHistoryEntrySchema,
} from './players';

/**
 * The admin player payload contracts are strict: any unexpected field is
 * rejected at the boundary, so signature material, session tokens, or
 * challenge secrets can never ride along into the admin UI even if a
 * database function ever regressed.
 */

const directoryEntry = {
  userId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  profileId: '8d9e6679-7425-40de-944b-e07fc1f90ae8',
  displayLabel: 'Farmer DRpb21hy',
  status: 'active',
  onboardingState: 'access_checked',
  accessState: 'eligible',
  walletMasked: 'DRpb…21hy',
  walletVerificationState: 'verified',
  lastAccessVerificationAt: '2026-07-19T10:00:00+00:00',
  lastSignInAt: '2026-07-19T10:00:00+00:00',
  createdAt: '2026-07-19T09:00:00+00:00',
} as const;

describe('admin player payload contracts', () => {
  it('accepts a well-formed directory entry', () => {
    expect(playerDirectoryEntrySchema.safeParse(directoryEntry).success).toBe(true);
  });

  it('rejects directory entries carrying unexpected fields', () => {
    const smuggled = { ...directoryEntry, rawSignature: 'c2lnbmF0dXJl' };
    expect(playerDirectoryEntrySchema.safeParse(smuggled).success).toBe(false);
  });

  it('rejects sensitive-looking extras on every history schema', () => {
    const strictSchemas = [
      playerWalletHistoryEntrySchema,
      playerAccessEvaluationEntrySchema,
      playerAccessSessionEntrySchema,
      playerSecurityEventEntrySchema,
      playerDetailSchema,
    ];
    for (const schema of strictSchemas) {
      const parsed = schema.safeParse({ nonce: 'A'.repeat(43), sessionToken: 'jwt' });
      expect(parsed.success).toBe(false);
    }
  });

  it('never declares a field that could carry secret material', () => {
    const declaredKeys = [
      ...Object.keys(playerDirectoryEntrySchema.shape),
      ...Object.keys(playerWalletHistoryEntrySchema.shape),
      ...Object.keys(playerAccessEvaluationEntrySchema.shape),
      ...Object.keys(playerAccessSessionEntrySchema.shape),
      ...Object.keys(playerSecurityEventEntrySchema.shape),
    ];
    for (const key of declaredKeys) {
      expect(key).not.toMatch(/nonce|signature|secret|token_hash|sessionToken|seed|private/i);
    }
  });
});
