import { describe, expect, it } from 'vitest';

import {
  generateInvitationToken,
  hashInvitationToken,
  invitationAcceptancePath,
  isWellFormedInvitationToken,
} from './invitation-token';

describe('invitation tokens', () => {
  it('generates 64 lowercase hex characters', () => {
    const token = generateInvitationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(isWellFormedInvitationToken(token)).toBe(true);
  });

  it('rejects malformed tokens', () => {
    expect(isWellFormedInvitationToken('')).toBe(false);
    expect(isWellFormedInvitationToken('F'.repeat(64))).toBe(false);
    expect(isWellFormedInvitationToken('a'.repeat(63))).toBe(false);
    expect(isWellFormedInvitationToken(`${'a'.repeat(64)}b`)).toBe(false);
  });

  it('hashes with SHA-256 to the database token_hash format', async () => {
    // Known vector: sha256("abc")
    await expect(hashInvitationToken('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    const hash = await hashInvitationToken(generateInvitationToken());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('builds the acceptance path from the plaintext token', () => {
    expect(invitationAcceptancePath('a'.repeat(64))).toBe(`/invite/${'a'.repeat(64)}`);
  });
});
