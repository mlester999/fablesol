import 'server-only';

import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { z } from 'zod';

import type { SolanaNetwork } from '@/lib/wallet/config';

/**
 * Server-authoritative Solana verification. Talks JSON-RPC directly so every
 * response is schema-validated, the network genesis hash is asserted, and
 * balances are summed in integer base units across all of the wallet's token
 * accounts for the exact configured mint and token program.
 *
 * Adapted for Fablesol from the proven Starville verifier design.
 */

const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
const NETWORK_GENESIS_HASHES: Readonly<Record<SolanaNetwork, string>> = {
  'solana:devnet': DEVNET_GENESIS_HASH,
  'solana:mainnet-beta': MAINNET_GENESIS_HASH,
};

const TOKEN_PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ADDRESS = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const SUPPORTED_TOKEN_PROGRAMS = new Set([TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS]);

export type SolanaVerificationErrorCode =
  | 'INVALID_ADDRESS'
  | 'RPC_UNAVAILABLE'
  | 'NETWORK_MISMATCH'
  | 'MINT_NOT_FOUND'
  | 'UNSUPPORTED_TOKEN_PROGRAM'
  | 'MALFORMED_RPC_RESPONSE';

export class SolanaVerificationError extends Error {
  readonly code: SolanaVerificationErrorCode;

  constructor(code: SolanaVerificationErrorCode) {
    super('Solana token verification could not be completed.');
    this.name = 'SolanaVerificationError';
    this.code = code;
  }
}

export interface VerifiedMint {
  readonly mintAddress: string;
  readonly tokenProgramAddress: string;
  readonly decimals: number;
  readonly slot: number;
}

export interface VerifiedTokenBalance extends VerifiedMint {
  readonly walletAddress: string;
  readonly baseUnits: bigint;
  readonly tokenAccountCount: number;
}

const rpcEnvelopeSchema = z
  .object({
    jsonrpc: z.literal('2.0'),
    id: z.number(),
    result: z.unknown().optional(),
    error: z.object({ code: z.number(), message: z.string() }).loose().optional(),
  })
  .loose();

const contextSchema = z.object({ slot: z.number().int().nonnegative() }).loose();

const mintResultSchema = z
  .object({
    context: contextSchema,
    value: z
      .object({
        executable: z.boolean(),
        owner: z.string(),
        data: z
          .object({
            parsed: z
              .object({
                type: z.literal('mint'),
                info: z
                  .object({
                    decimals: z.number().int().min(0).max(18),
                    isInitialized: z.boolean().optional(),
                  })
                  .loose(),
              })
              .loose(),
          })
          .loose(),
      })
      .loose()
      .nullable(),
  })
  .loose();

const tokenAccountResultSchema = z
  .object({
    context: contextSchema,
    value: z.array(
      z
        .object({
          pubkey: z.string(),
          account: z
            .object({
              lamports: z.number().int().nonnegative(),
              owner: z.string(),
              data: z
                .object({
                  parsed: z
                    .object({
                      type: z.literal('account'),
                      info: z
                        .object({
                          mint: z.string(),
                          owner: z.string(),
                          state: z.string(),
                          tokenAmount: z
                            .object({
                              amount: z.string().regex(/^\d+$/u),
                              decimals: z.number().int().min(0).max(18),
                            })
                            .loose(),
                        })
                        .loose(),
                    })
                    .loose(),
                })
                .loose(),
            })
            .loose(),
        })
        .loose(),
    ),
  })
  .loose();

function parseAddress(address: string): PublicKey {
  try {
    const key = new PublicKey(address);
    if (key.toBase58() !== address) {
      throw new Error('Address is not canonical');
    }
    return key;
  } catch {
    throw new SolanaVerificationError('INVALID_ADDRESS');
  }
}

/** Deterministic canonical form of a Solana address; throws on invalid input. */
export function normalizeSolanaAddress(address: string): string {
  return parseAddress(address).toBase58();
}

/** Server-side ed25519 verification of a signed wallet message. */
export function verifyWalletSignature(input: {
  readonly walletAddress: string;
  readonly message: string;
  readonly signatureBase64: string;
}): boolean {
  let publicKeyBytes: Uint8Array;
  try {
    publicKeyBytes = parseAddress(input.walletAddress).toBytes();
  } catch {
    return false;
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(input.signatureBase64, 'base64');
  } catch {
    return false;
  }

  if (
    signature.length !== nacl.sign.signatureLength ||
    signature.toString('base64') !== input.signatureBase64
  ) {
    return false;
  }

  return nacl.sign.detached.verify(
    new TextEncoder().encode(input.message),
    signature,
    publicKeyBytes,
  );
}

export interface SolanaRpcOptions {
  readonly rpcUrl: string;
  readonly network: SolanaNetwork;
  readonly timeoutMs?: number;
  readonly maximumAttempts?: number;
  readonly fetch?: typeof globalThis.fetch;
}

class SolanaRpcClient {
  readonly #rpcUrl: string;
  readonly #network: SolanaNetwork;
  readonly #timeoutMs: number;
  readonly #maximumAttempts: number;
  readonly #fetch: typeof globalThis.fetch;
  #requestId = 0;

  constructor(options: SolanaRpcOptions) {
    const url = new URL(options.rpcUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new SolanaVerificationError('RPC_UNAVAILABLE');
    }

    this.#rpcUrl = url.toString();
    this.#network = options.network;
    this.#timeoutMs = options.timeoutMs ?? 5_000;
    this.#maximumAttempts = options.maximumAttempts ?? 2;
    this.#fetch = options.fetch ?? globalThis.fetch;

    if (this.#maximumAttempts < 1 || this.#maximumAttempts > 3 || this.#timeoutMs < 100) {
      throw new Error('Solana RPC retry and timeout configuration is outside safe bounds');
    }
  }

  async request(method: string, params: readonly unknown[]): Promise<unknown> {
    let attempt = 0;

    while (attempt < this.#maximumAttempts) {
      attempt += 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

      try {
        const response = await this.#fetch(this.#rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++this.#requestId, method, params }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (
            (response.status === 429 || response.status >= 500) &&
            attempt < this.#maximumAttempts
          ) {
            continue;
          }
          throw new SolanaVerificationError('RPC_UNAVAILABLE');
        }

        const envelope = rpcEnvelopeSchema.safeParse(await response.json());
        if (!envelope.success) {
          throw new SolanaVerificationError('MALFORMED_RPC_RESPONSE');
        }
        if (envelope.data.error !== undefined) {
          throw new SolanaVerificationError('RPC_UNAVAILABLE');
        }
        return envelope.data.result;
      } catch (error) {
        if (error instanceof SolanaVerificationError) {
          throw error;
        }
        if (attempt >= this.#maximumAttempts) {
          throw new SolanaVerificationError('RPC_UNAVAILABLE');
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new SolanaVerificationError('RPC_UNAVAILABLE');
  }

  async assertNetwork(): Promise<void> {
    const expectedHash = NETWORK_GENESIS_HASHES[this.#network];
    const result = await this.request('getGenesisHash', []);
    if (result !== expectedHash) {
      throw new SolanaVerificationError('NETWORK_MISMATCH');
    }
  }

  async validateMint(mintAddress: string): Promise<VerifiedMint> {
    await this.assertNetwork();
    const canonicalMint = normalizeSolanaAddress(mintAddress);
    const result = mintResultSchema.safeParse(
      await this.request('getAccountInfo', [
        canonicalMint,
        { commitment: 'confirmed', encoding: 'jsonParsed' },
      ]),
    );

    if (!result.success) {
      throw new SolanaVerificationError('MALFORMED_RPC_RESPONSE');
    }
    if (result.data.value === null) {
      throw new SolanaVerificationError('MINT_NOT_FOUND');
    }

    const account = result.data.value;
    if (!SUPPORTED_TOKEN_PROGRAMS.has(account.owner)) {
      throw new SolanaVerificationError('UNSUPPORTED_TOKEN_PROGRAM');
    }
    if (account.executable || account.data.parsed.info.isInitialized === false) {
      throw new SolanaVerificationError('MALFORMED_RPC_RESPONSE');
    }

    return {
      mintAddress: canonicalMint,
      tokenProgramAddress: account.owner,
      decimals: account.data.parsed.info.decimals,
      slot: result.data.context.slot,
    };
  }

  async verifyBalance(walletAddress: string, mintAddress: string): Promise<VerifiedTokenBalance> {
    const canonicalWallet = normalizeSolanaAddress(walletAddress);
    const mint = await this.validateMint(mintAddress);
    const result = tokenAccountResultSchema.safeParse(
      await this.request('getTokenAccountsByOwner', [
        canonicalWallet,
        { mint: mint.mintAddress },
        { commitment: 'confirmed', encoding: 'jsonParsed', minContextSlot: mint.slot },
      ]),
    );

    if (!result.success) {
      throw new SolanaVerificationError('MALFORMED_RPC_RESPONSE');
    }
    if (result.data.context.slot < mint.slot) {
      throw new SolanaVerificationError('MALFORMED_RPC_RESPONSE');
    }

    const seen = new Set<string>();
    let baseUnits = 0n;
    let tokenAccountCount = 0;

    for (const item of result.data.value) {
      if (seen.has(item.pubkey)) {
        continue;
      }
      seen.add(item.pubkey);

      const info = item.account.data.parsed.info;
      const stateIsCountable = info.state === 'initialized' || info.state === 'frozen';
      const belongsToWallet = info.owner === canonicalWallet;
      const isExactMint = info.mint === mint.mintAddress;
      const isExpectedProgram = item.account.owner === mint.tokenProgramAddress;
      const decimalsMatch = info.tokenAmount.decimals === mint.decimals;

      if (
        item.account.lamports === 0 ||
        !stateIsCountable ||
        !belongsToWallet ||
        !isExactMint ||
        !isExpectedProgram ||
        !decimalsMatch
      ) {
        continue;
      }

      baseUnits += BigInt(info.tokenAmount.amount);
      tokenAccountCount += 1;
    }

    return {
      ...mint,
      walletAddress: canonicalWallet,
      baseUnits,
      tokenAccountCount,
      slot: result.data.context.slot,
    };
  }
}

export interface SolanaTokenVerifier {
  validateMint(mintAddress: string): Promise<VerifiedMint>;
  verifyBalance(walletAddress: string, mintAddress: string): Promise<VerifiedTokenBalance>;
}

export function createSolanaTokenVerifier(options: SolanaRpcOptions): SolanaTokenVerifier {
  const client = new SolanaRpcClient(options);
  return {
    validateMint: (mintAddress) => client.validateMint(mintAddress),
    verifyBalance: (walletAddress, mintAddress) => client.verifyBalance(walletAddress, mintAddress),
  };
}
