// @vitest-environment node
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it, vi } from 'vitest';

import { createWalletMessage } from '@/lib/wallet/message';
import { sha256Hex, type PlayerGateway } from './player-gateway';
import { issueChallenge, verifySignedChallenge, WalletAuthError } from './wallet-auth';

/**
 * Challenge-flow security tests: issuance, signature acceptance, tamper
 * rejection through hash binding, invalid signatures, replay denial,
 * expiration, attempt exhaustion, and rate limiting. The gateway is mocked;
 * the ed25519 verification is real.
 */

const keypair = nacl.sign.keyPair();
const WALLET = new PublicKey(keypair.publicKey).toBase58();
const OTHER_KEYPAIR = nacl.sign.keyPair();
const CHALLENGE_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ORIGIN = 'http://localhost:3600';

function signBase64(message: string, secretKey: Uint8Array = keypair.secretKey): string {
  return Buffer.from(nacl.sign.detached(new TextEncoder().encode(message), secretKey)).toString(
    'base64',
  );
}

interface ChallengeFixture {
  readonly message: string;
  readonly nonceHash: string;
  readonly messageHash: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

function buildChallenge(overrides: { expiresInMs?: number } = {}): ChallengeFixture {
  const ttlMs = overrides.expiresInMs ?? 300_000;
  // The message schema requires expiration after issue time, so an
  // already-expired fixture backdates the whole window into the past.
  const expires = new Date(Date.now() + ttlMs);
  const issued = new Date(ttlMs > 0 ? Date.now() : expires.getTime() - 300_000);
  const nonce = 'A'.repeat(43);
  const message = createWalletMessage({
    domain: 'localhost:3600',
    uri: ORIGIN,
    walletAddress: WALLET,
    network: 'solana:devnet',
    nonce,
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
    challengeId: CHALLENGE_ID,
  });
  return {
    message,
    nonceHash: sha256Hex(nonce),
    messageHash: sha256Hex(message),
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

function mockGateway(
  fixture: ChallengeFixture,
  overrides: Partial<Record<keyof PlayerGateway, unknown>> = {},
): PlayerGateway {
  return {
    // Faithful to the fixed database function: the stored row id is exactly
    // the id the server generated and embedded in the signed message.
    issueChallenge: vi.fn(async (input: { challengeId: string }) => ({
      status: 'created',
      challengeId: input.challengeId,
      issuedAt: fixture.issuedAt,
      expiresAt: fixture.expiresAt,
    })),
    beginVerification: vi.fn(async () => ({
      status: 'pending',
      challengeId: CHALLENGE_ID,
      walletAddress: WALLET,
      network: 'solana:devnet',
      domain: 'localhost:3600',
      uri: ORIGIN,
      purpose: 'sign_in',
      requestedByUserId: null,
      nonceHash: fixture.nonceHash,
      messageHash: fixture.messageHash,
      issuedAt: fixture.issuedAt,
      expiresAt: fixture.expiresAt,
    })),
    consumeChallenge: vi.fn(async () => ({
      status: 'consumed',
      challengeId: CHALLENGE_ID,
      purpose: 'sign_in',
      network: 'solana:devnet',
      requestedByUserId: null,
    })),
    recordWalletEvent: vi.fn(async () => undefined),
    findByWallet: vi.fn(),
    register: vi.fn(),
    recordSignIn: vi.fn(),
    replaceWallet: vi.fn(),
    recordAccessEvaluation: vi.fn(),
    invalidateAccessSessions: vi.fn(),
    recordSecurityEvent: vi.fn(),
    ...overrides,
  } as unknown as PlayerGateway;
}

function verifyInput(fixture: ChallengeFixture, gateway: PlayerGateway) {
  return {
    gateway,
    challengeId: CHALLENGE_ID,
    walletAddress: WALLET,
    network: 'solana:devnet' as const,
    message: fixture.message,
    signatureBase64: signBase64(fixture.message),
    requestOrigin: ORIGIN,
    correlationId: 'test-correlation',
  };
}

async function expectWalletAuthError(
  promise: Promise<unknown>,
  code: string,
): Promise<WalletAuthError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(WalletAuthError);
    expect((error as WalletAuthError).code).toBe(code);
    return error as WalletAuthError;
  }
  throw new Error(`Expected WalletAuthError ${code}, but the call succeeded`);
}

describe('issueChallenge', () => {
  it('issues a signed-message challenge bound to the request origin', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    const issued = await issueChallenge({
      gateway,
      walletAddress: WALLET,
      network: 'solana:devnet',
      requestOrigin: ORIGIN,
      purpose: 'sign_in',
      requestedByUserId: null,
      clientKeyHash: null,
      correlationId: 'test-correlation',
    });

    expect(issued.message).toContain('localhost:3600 wants you to sign in');
    expect(issued.message).toContain(WALLET);
    expect(issued.message).toContain('never ask for your seed phrase');
    // The gateway receives only hashes, never the plaintext nonce.
    const call = vi.mocked(gateway.issueChallenge).mock.calls[0]?.[0];
    expect(call?.nonceHash).toMatch(/^[0-9a-f]{64}$/);
    expect(call?.messageHash).toBe(sha256Hex(issued.message));
  });

  it('stores the challenge under the exact id embedded in the signed message', async () => {
    // Regression: the persisted row id, the returned challenge id, and the
    // Challenge ID line inside the message must all be the same value, or
    // verification can never satisfy the challenge binding.
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    const issued = await issueChallenge({
      gateway,
      walletAddress: WALLET,
      network: 'solana:devnet',
      requestOrigin: ORIGIN,
      purpose: 'sign_in',
      requestedByUserId: null,
      clientKeyHash: null,
      correlationId: 'test-correlation',
    });

    const messageChallengeId = issued.message
      .split('\n')
      .find((line) => line.startsWith('Challenge ID: '))
      ?.slice('Challenge ID: '.length);
    const storedChallengeId = vi.mocked(gateway.issueChallenge).mock.calls[0]?.[0]?.challengeId;

    expect(messageChallengeId).toBe(issued.challengeId);
    expect(storedChallengeId).toBe(issued.challengeId);
  });

  it('fails closed when persistence stores a different challenge id', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      issueChallenge: vi.fn(async () => ({
        status: 'created',
        challengeId: CHALLENGE_ID,
        issuedAt: fixture.issuedAt,
        expiresAt: fixture.expiresAt,
      })),
    });

    const error = await expectWalletAuthError(
      issueChallenge({
        gateway,
        walletAddress: WALLET,
        network: 'solana:devnet',
        requestOrigin: ORIGIN,
        purpose: 'sign_in',
        requestedByUserId: null,
        clientKeyHash: null,
        correlationId: 'test-correlation',
      }),
      'service_unavailable',
    );
    expect(error.httpStatus).toBe(503);
  });

  it('propagates server-side rate limiting', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      issueChallenge: vi.fn(async () => ({
        status: 'rate_limited',
        reasonCode: 'wallet_rate_limited',
      })),
    });

    const error = await expectWalletAuthError(
      issueChallenge({
        gateway,
        walletAddress: WALLET,
        network: 'solana:devnet',
        requestOrigin: ORIGIN,
        purpose: 'sign_in',
        requestedByUserId: null,
        clientKeyHash: null,
        correlationId: 'test-correlation',
      }),
      'rate_limited',
    );
    expect(error.httpStatus).toBe(429);
  });

  it('rejects an invalid wallet address before any persistence', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    await expectWalletAuthError(
      issueChallenge({
        gateway,
        walletAddress: 'not-a-wallet',
        network: 'solana:devnet',
        requestOrigin: ORIGIN,
        purpose: 'sign_in',
        requestedByUserId: null,
        clientKeyHash: null,
        correlationId: 'test-correlation',
      }),
      'invalid_request',
    );
    expect(gateway.issueChallenge).not.toHaveBeenCalled();
  });
});

describe('verifySignedChallenge', () => {
  it('accepts a valid signature and consumes the challenge exactly once', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    const verified = await verifySignedChallenge(verifyInput(fixture, gateway));

    expect(verified.walletAddress).toBe(WALLET);
    expect(verified.purpose).toBe('sign_in');
    expect(gateway.consumeChallenge).toHaveBeenCalledTimes(1);
  });

  it('rejects a tampered message through hash binding even when well formed', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);
    const tampered = fixture.message.replace(/Nonce: A+/u, `Nonce: ${'B'.repeat(43)}`);

    await expectWalletAuthError(
      verifySignedChallenge({
        ...verifyInput(fixture, gateway),
        message: tampered,
        signatureBase64: signBase64(tampered),
      }),
      'invalid_request',
    );
    expect(gateway.consumeChallenge).not.toHaveBeenCalled();
    expect(gateway.recordWalletEvent).toHaveBeenCalledWith(
      expect.objectContaining({ reasonCode: 'binding_mismatch' }),
    );
  });

  it('rejects a signature from a different wallet key', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    await expectWalletAuthError(
      verifySignedChallenge({
        ...verifyInput(fixture, gateway),
        signatureBase64: signBase64(fixture.message, OTHER_KEYPAIR.secretKey),
      }),
      'signature_invalid',
    );
    expect(gateway.consumeChallenge).not.toHaveBeenCalled();
    expect(gateway.recordWalletEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: 'wallet.signature.denied' }),
    );
  });

  it('denies a replayed challenge', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      beginVerification: vi.fn(async () => ({ status: 'replayed' })),
    });

    const error = await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'challenge_replayed',
    );
    expect(error.httpStatus).toBe(409);
  });

  it('denies an expired challenge', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      beginVerification: vi.fn(async () => ({ status: 'expired' })),
    });

    await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'challenge_expired',
    );
  });

  it('rejects a message whose own expiration has passed', async () => {
    const fixture = buildChallenge({ expiresInMs: -1_000 });
    const gateway = mockGateway(fixture);

    await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'invalid_request',
    );
    expect(gateway.consumeChallenge).not.toHaveBeenCalled();
  });

  it('denies a challenge that exhausted its verification attempts', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      beginVerification: vi.fn(async () => ({ status: 'rejected' })),
    });

    const error = await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'challenge_rejected',
    );
    expect(error.httpStatus).toBe(429);
  });

  it('verifies a challenge issued by issueChallenge end to end (id binding holds)', async () => {
    // Full round trip through the real orchestration with a faithful gateway:
    // issue, sign the exact message, verify. Guards the challenge-id binding
    // that a mismatched persistence id silently broke.
    const fixture = buildChallenge();
    const stored: Record<string, unknown> = {};
    const gateway = mockGateway(fixture, {
      issueChallenge: vi.fn(async (input: Record<string, unknown>) => {
        Object.assign(stored, input);
        return {
          status: 'created',
          challengeId: input['challengeId'],
          issuedAt: fixture.issuedAt,
          expiresAt: fixture.expiresAt,
        };
      }),
      beginVerification: vi.fn(async () => ({
        status: 'pending',
        challengeId: stored['challengeId'],
        walletAddress: stored['walletAddress'],
        network: stored['network'],
        domain: stored['domain'],
        uri: stored['uri'],
        purpose: 'sign_in',
        requestedByUserId: null,
        nonceHash: stored['nonceHash'],
        messageHash: stored['messageHash'],
        issuedAt: fixture.issuedAt,
        expiresAt: fixture.expiresAt,
      })),
      consumeChallenge: vi.fn(async () => ({
        status: 'consumed',
        challengeId: stored['challengeId'],
        purpose: 'sign_in',
        network: stored['network'],
        requestedByUserId: null,
      })),
    });

    const issued = await issueChallenge({
      gateway,
      walletAddress: WALLET,
      network: 'solana:devnet',
      requestOrigin: ORIGIN,
      purpose: 'sign_in',
      requestedByUserId: null,
      clientKeyHash: null,
      correlationId: 'test-correlation',
    });

    const verified = await verifySignedChallenge({
      gateway,
      challengeId: issued.challengeId,
      walletAddress: WALLET,
      network: 'solana:devnet',
      message: issued.message,
      signatureBase64: signBase64(issued.message),
      requestOrigin: ORIGIN,
      correlationId: 'test-correlation',
    });

    expect(verified.walletAddress).toBe(WALLET);
    expect(verified.challengeId).toBe(issued.challengeId);
  });

  it('rejects a challenge bound to a different wallet', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      beginVerification: vi.fn(async () => ({ status: 'wallet_mismatch' })),
    });

    // Enumeration-safe: a wallet mismatch is indistinguishable from a
    // missing challenge.
    await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'challenge_not_found',
    );
    expect(gateway.consumeChallenge).not.toHaveBeenCalled();
  });

  it('rejects a network that differs from the challenge binding', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture);

    await expectWalletAuthError(
      verifySignedChallenge({
        ...verifyInput(fixture, gateway),
        network: 'solana:mainnet-beta' as const,
      }),
      'invalid_request',
    );
    expect(gateway.consumeChallenge).not.toHaveBeenCalled();
    expect(gateway.recordWalletEvent).toHaveBeenCalledWith(
      expect.objectContaining({ reasonCode: 'binding_mismatch' }),
    );
  });

  it('rejects malformed signature transports without consuming the challenge', async () => {
    const fixture = buildChallenge();
    const malformed = [
      'not base64!!!',
      Buffer.from('too short').toString('base64'),
      Buffer.alloc(80, 7).toString('base64'),
      '',
    ];

    for (const signatureBase64 of malformed) {
      const gateway = mockGateway(fixture);
      await expectWalletAuthError(
        verifySignedChallenge({ ...verifyInput(fixture, gateway), signatureBase64 }),
        'signature_invalid',
      );
      expect(gateway.consumeChallenge).not.toHaveBeenCalled();
    }
  });

  it('treats a lost consume race as a replay', async () => {
    const fixture = buildChallenge();
    const gateway = mockGateway(fixture, {
      consumeChallenge: vi.fn(async () => ({ status: 'not_consumable' })),
    });

    await expectWalletAuthError(
      verifySignedChallenge(verifyInput(fixture, gateway)),
      'challenge_replayed',
    );
  });
});
