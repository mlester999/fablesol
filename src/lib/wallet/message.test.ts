import { describe, expect, it } from 'vitest';
import { createWalletMessage, parseWalletMessage, AUTHENTICATION_STATEMENT } from './message';

const FIELDS = {
  domain: 'localhost:3600',
  uri: 'http://localhost:3600',
  walletAddress: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  network: 'solana:devnet',
  nonce: 'A'.repeat(43),
  issuedAt: '2026-07-19T10:00:00.000Z',
  expiresAt: '2026-07-19T10:05:00.000Z',
  challengeId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
} as const;

describe('wallet message', () => {
  it('round-trips through create and parse', () => {
    const message = createWalletMessage(FIELDS);
    expect(parseWalletMessage(message)).toEqual(FIELDS);
  });

  it('states the safety promise in the signed statement', () => {
    expect(AUTHENTICATION_STATEMENT).toContain('does not move any tokens');
    expect(AUTHENTICATION_STATEMENT).toContain('never ask for your seed phrase');
    expect(createWalletMessage(FIELDS)).toContain(AUTHENTICATION_STATEMENT);
  });

  it('rejects a structurally invalid wallet address', () => {
    // '0' is not a base58 character, so the address line no longer parses.
    const message = createWalletMessage(FIELDS).replace(
      FIELDS.walletAddress,
      'FAKE0CBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21h',
    );
    expect(() => parseWalletMessage(message)).toThrow();
  });

  it('rejects a structurally invalid nonce', () => {
    const message = createWalletMessage(FIELDS).replace(/Nonce: A+/u, `Nonce: ${'B'.repeat(8)}`);
    expect(() => parseWalletMessage(message)).toThrow();
  });

  it('surfaces valid-shaped tampering for the hash binding layer to reject', () => {
    // A tampered but well-formed message parses, so structural checks alone
    // are not the defense; the server compares the stored nonce and message
    // hashes and the bound wallet, which can never match a tampered message.
    // wallet-auth.test.ts proves that rejection end to end.
    const tampered = createWalletMessage(FIELDS).replace(/Nonce: A+/u, `Nonce: ${'B'.repeat(43)}`);
    const parsed = parseWalletMessage(tampered);
    expect(parsed.nonce).not.toBe(FIELDS.nonce);
  });

  it('rejects non-canonical extra lines', () => {
    const message = `${createWalletMessage(FIELDS)}\nResources:`;
    expect(() => parseWalletMessage(message)).toThrow();
  });

  it('rejects oversized messages', () => {
    expect(() => parseWalletMessage('a'.repeat(3000))).toThrow();
  });

  it('rejects a domain that does not match the URI host', () => {
    expect(() => createWalletMessage({ ...FIELDS, domain: 'evil.example' })).toThrow();
  });

  it('rejects an expiration before issuance', () => {
    expect(() =>
      createWalletMessage({ ...FIELDS, expiresAt: '2026-07-19T09:59:00.000Z' }),
    ).toThrow();
  });

  it('rejects unsupported networks', () => {
    expect(() => createWalletMessage({ ...FIELDS, network: 'solana:testnet' as never })).toThrow();
  });
});
