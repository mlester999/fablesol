// @vitest-environment node
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';

import { verifyWalletSignature } from '@/lib/server/solana';
import { encodeSignatureBase64 } from './client';

/**
 * Signature transport contract: wallet providers hand back the signature as
 * a raw 64-byte Uint8Array, the browser encodes it as standard base64, and
 * the server decodes that exact format before ed25519 verification. These
 * tests pin every step of that single canonical path.
 */

const keypair = nacl.sign.keyPair();
const WALLET = new PublicKey(keypair.publicKey).toBase58();
const MESSAGE = 'localhost:3600 wants you to sign in with your Solana account:\ntest-message';

function sign(message: string): Uint8Array {
  return nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
}

describe('signature transport encoding', () => {
  it('encodes a Uint8Array wallet signature as canonical padded base64', () => {
    const signature = sign(MESSAGE);
    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);

    const encoded = encodeSignatureBase64(signature);
    expect(encoded).toBe(Buffer.from(signature).toString('base64'));
    expect(encoded).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(encoded.length).toBe(88);
  });

  it('round-trips: the server decoder accepts the client encoding', () => {
    const encoded = encodeSignatureBase64(sign(MESSAGE));
    expect(
      verifyWalletSignature({ walletAddress: WALLET, message: MESSAGE, signatureBase64: encoded }),
    ).toBe(true);
  });

  it('the server rejects non-canonical or malformed transports', () => {
    const signature = sign(MESSAGE);
    const rejected = [
      // base64url is not the canonical transport
      Buffer.from(signature).toString('base64url'),
      // truncated
      Buffer.from(signature).toString('base64').slice(0, 40),
      // wrong byte length
      Buffer.from(signature.slice(0, 32)).toString('base64'),
      // not base64 at all
      'zzzz not base64 %%%',
      '',
    ];
    for (const signatureBase64 of rejected) {
      expect(
        verifyWalletSignature({ walletAddress: WALLET, message: MESSAGE, signatureBase64 }),
      ).toBe(false);
    }
  });

  it('the server rejects a valid transport carrying the wrong signature', () => {
    const other = nacl.sign.keyPair();
    const wrongSigner = nacl.sign.detached(new TextEncoder().encode(MESSAGE), other.secretKey);
    expect(
      verifyWalletSignature({
        walletAddress: WALLET,
        message: MESSAGE,
        signatureBase64: encodeSignatureBase64(wrongSigner),
      }),
    ).toBe(false);

    const differentMessage = sign('a different message entirely');
    expect(
      verifyWalletSignature({
        walletAddress: WALLET,
        message: MESSAGE,
        signatureBase64: encodeSignatureBase64(differentMessage),
      }),
    ).toBe(false);
  });
});
