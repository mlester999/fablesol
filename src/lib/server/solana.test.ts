// @vitest-environment node
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';

import {
  createSolanaTokenVerifier,
  normalizeSolanaAddress,
  SolanaVerificationError,
  verifyWalletSignature,
} from './solana';

const keypair = nacl.sign.keyPair();
const WALLET = new PublicKey(keypair.publicKey).toBase58();
const OTHER_WALLET = new PublicKey(nacl.sign.keyPair().publicKey).toBase58();
const MINT = new PublicKey(nacl.sign.keyPair().publicKey).toBase58();
const OTHER_MINT = new PublicKey(nacl.sign.keyPair().publicKey).toBase58();
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1';

function sign(message: string): string {
  const signature = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
  return Buffer.from(signature).toString('base64');
}

describe('verifyWalletSignature', () => {
  const message = 'localhost wants you to sign in with your Solana account:\nabc';

  it('accepts a valid ed25519 signature from the wallet key', () => {
    expect(
      verifyWalletSignature({ walletAddress: WALLET, message, signatureBase64: sign(message) }),
    ).toBe(true);
  });

  it('rejects a signature from a different wallet', () => {
    expect(
      verifyWalletSignature({
        walletAddress: OTHER_WALLET,
        message,
        signatureBase64: sign(message),
      }),
    ).toBe(false);
  });

  it('rejects a signature over a different message', () => {
    expect(
      verifyWalletSignature({
        walletAddress: WALLET,
        message: `${message}!`,
        signatureBase64: sign(message),
      }),
    ).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    expect(
      verifyWalletSignature({ walletAddress: WALLET, message, signatureBase64: 'not-base64!!' }),
    ).toBe(false);
    expect(verifyWalletSignature({ walletAddress: WALLET, message, signatureBase64: 'eA==' })).toBe(
      false,
    );
  });

  it('rejects invalid wallet addresses without throwing', () => {
    expect(
      verifyWalletSignature({ walletAddress: 'garbage', message, signatureBase64: sign(message) }),
    ).toBe(false);
  });
});

describe('normalizeSolanaAddress', () => {
  it('accepts canonical addresses and rejects junk', () => {
    expect(normalizeSolanaAddress(WALLET)).toBe(WALLET);
    expect(() => normalizeSolanaAddress('not-an-address')).toThrow(SolanaVerificationError);
  });
});

interface FakeRpcHandlers {
  readonly getGenesisHash?: () => unknown;
  readonly getAccountInfo?: () => unknown;
  readonly getTokenAccountsByOwner?: () => unknown;
}

function fakeFetch(handlers: FakeRpcHandlers): typeof globalThis.fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { id: number; method: string };
    const handler = handlers[body.method as keyof FakeRpcHandlers];
    const result = handler ? handler() : null;
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof globalThis.fetch;
}

function mintAccount(decimals: number) {
  return {
    context: { slot: 100 },
    value: {
      executable: false,
      owner: TOKEN_PROGRAM,
      data: { parsed: { type: 'mint', info: { decimals, isInitialized: true } } },
    },
  };
}

function tokenAccount(input: {
  pubkey: string;
  amount: string;
  owner?: string;
  mint?: string;
  program?: string;
  state?: string;
  decimals?: number;
  lamports?: number;
}) {
  return {
    pubkey: input.pubkey,
    account: {
      lamports: input.lamports ?? 2_039_280,
      owner: input.program ?? TOKEN_PROGRAM,
      data: {
        parsed: {
          type: 'account',
          info: {
            mint: input.mint ?? MINT,
            owner: input.owner ?? WALLET,
            state: input.state ?? 'initialized',
            tokenAmount: { amount: input.amount, decimals: input.decimals ?? 6 },
          },
        },
      },
    },
  };
}

function verifier(handlers: FakeRpcHandlers) {
  return createSolanaTokenVerifier({
    rpcUrl: 'https://rpc.example.test',
    network: 'solana:devnet',
    fetch: fakeFetch({
      getGenesisHash: () => DEVNET_GENESIS,
      getAccountInfo: () => mintAccount(6),
      ...handlers,
    }),
  });
}

describe('verifyBalance', () => {
  it('sums every valid token account for the exact mint in base units', async () => {
    const balance = await verifier({
      getTokenAccountsByOwner: () => ({
        context: { slot: 101 },
        value: [
          tokenAccount({ pubkey: 'acc1', amount: '4000000000' }),
          tokenAccount({ pubkey: 'acc2', amount: '6000000001' }),
        ],
      }),
    }).verifyBalance(WALLET, MINT);

    expect(balance.baseUnits).toBe(10_000_000_001n);
    expect(balance.tokenAccountCount).toBe(2);
    expect(balance.decimals).toBe(6);
  });

  it('ignores wrong-mint, wrong-owner, wrong-program, closed, and duplicate accounts', async () => {
    const balance = await verifier({
      getTokenAccountsByOwner: () => ({
        context: { slot: 101 },
        value: [
          tokenAccount({ pubkey: 'good', amount: '1000000' }),
          tokenAccount({ pubkey: 'good', amount: '1000000' }),
          tokenAccount({ pubkey: 'wrong-mint', amount: '5000000', mint: OTHER_MINT }),
          tokenAccount({ pubkey: 'wrong-owner', amount: '5000000', owner: OTHER_WALLET }),
          tokenAccount({ pubkey: 'wrong-program', amount: '5000000', program: OTHER_MINT }),
          tokenAccount({ pubkey: 'closed', amount: '5000000', lamports: 0 }),
          tokenAccount({ pubkey: 'uninitialized', amount: '5000000', state: 'uninitialized' }),
          tokenAccount({ pubkey: 'wrong-decimals', amount: '5000000', decimals: 9 }),
        ],
      }),
    }).verifyBalance(WALLET, MINT);

    expect(balance.baseUnits).toBe(1_000_000n);
    expect(balance.tokenAccountCount).toBe(1);
  });

  it('reports zero for a wallet with no token accounts', async () => {
    const balance = await verifier({
      getTokenAccountsByOwner: () => ({ context: { slot: 101 }, value: [] }),
    }).verifyBalance(WALLET, MINT);
    expect(balance.baseUnits).toBe(0n);
    expect(balance.tokenAccountCount).toBe(0);
  });

  it('fails closed on a genesis-hash network mismatch', async () => {
    await expect(
      verifier({ getGenesisHash: () => 'WrongGenesisHash1111111111111111' }).verifyBalance(
        WALLET,
        MINT,
      ),
    ).rejects.toMatchObject({ code: 'NETWORK_MISMATCH' });
  });

  it('fails closed when the mint does not exist', async () => {
    await expect(
      verifier({ getAccountInfo: () => ({ context: { slot: 100 }, value: null }) }).verifyBalance(
        WALLET,
        MINT,
      ),
    ).rejects.toMatchObject({ code: 'MINT_NOT_FOUND' });
  });

  it('fails closed when the mint is owned by an unsupported program', async () => {
    await expect(
      verifier({
        getAccountInfo: () => ({
          context: { slot: 100 },
          value: {
            executable: false,
            owner: OTHER_MINT,
            data: { parsed: { type: 'mint', info: { decimals: 6 } } },
          },
        }),
      }).verifyBalance(WALLET, MINT),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TOKEN_PROGRAM' });
  });

  it('fails closed on malformed RPC responses', async () => {
    await expect(
      verifier({ getTokenAccountsByOwner: () => ({ nonsense: true }) }).verifyBalance(WALLET, MINT),
    ).rejects.toMatchObject({ code: 'MALFORMED_RPC_RESPONSE' });
  });

  it('fails closed when the RPC endpoint keeps erroring', async () => {
    const failingFetch = (async () =>
      new Response('server error', { status: 500 })) as typeof globalThis.fetch;
    const client = createSolanaTokenVerifier({
      rpcUrl: 'https://rpc.example.test',
      network: 'solana:devnet',
      fetch: failingFetch,
    });
    await expect(client.verifyBalance(WALLET, MINT)).rejects.toMatchObject({
      code: 'RPC_UNAVAILABLE',
    });
  });
});
