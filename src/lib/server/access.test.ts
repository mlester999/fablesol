// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { evaluateAccess, loadAccessStatus } from './access';
import type { PlayerGateway } from './player-gateway';
import type { SolanaTokenVerifier } from './solana';
import { SolanaVerificationError } from './solana';

const WALLET = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
const MINT = 'So11111111111111111111111111111111111111112';
const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const WALLET_ID = '8d9e6679-7425-40de-944b-e07fc1f90ae8';
const PROFILE_ID = '9a9e6679-7425-40de-944b-e07fc1f90ae9';

function stubWalletEnv(): void {
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', 'solana:devnet');
  vi.stubEnv('SOLANA_RPC_URL', 'https://rpc.example.test');
  vi.stubEnv('FABLE_TOKEN_MINT', MINT);
  vi.stubEnv('FABLE_ACCESS_REQUIRED_TOKENS', '10000');
}

interface MeOverrides {
  readonly status?: 'active' | 'suspended';
  readonly wallet?: null | { readonly network?: string };
  readonly accessSession?: null | { readonly expiresAt: string };
  readonly latestEvaluation?: null | Record<string, unknown>;
}

function fakeUserClient(overrides: MeOverrides = {}): SupabaseClient {
  const me = {
    found: true,
    profileId: PROFILE_ID,
    displayLabel: 'Farmer DRpb21hy',
    status: overrides.status ?? 'active',
    onboardingState: 'wallet_verified',
    accessState: 'unverified',
    createdAt: '2026-07-19T10:00:00.000Z',
    lastSuccessfulSignInAt: '2026-07-19T10:00:00.000Z',
    lastWalletVerificationAt: '2026-07-19T10:00:00.000Z',
    lastAccessVerificationAt: null,
    wallet:
      overrides.wallet === null
        ? null
        : {
            walletId: WALLET_ID,
            walletAddress: WALLET,
            network: overrides.wallet?.network ?? 'solana:devnet',
            firstVerifiedAt: '2026-07-19T10:00:00.000Z',
            lastVerifiedAt: '2026-07-19T10:00:00.000Z',
          },
    accessSession:
      overrides.accessSession === undefined
        ? null
        : overrides.accessSession === null
          ? null
          : {
              sessionId: '1a9e6679-7425-40de-944b-e07fc1f90ae1',
              expiresAt: overrides.accessSession.expiresAt,
              requiredBaseUnits: '10000000000',
              observedBaseUnits: '10000000000',
              tokenMint: MINT,
              network: 'solana:devnet',
            },
    latestEvaluation: overrides.latestEvaluation ?? null,
  };

  return {
    rpc: vi.fn().mockResolvedValue({ data: me, error: null }),
  } as unknown as SupabaseClient;
}

interface RecordedEvaluation {
  result: string;
  observedBaseUnits: string | null;
  requiredBaseUnits: string | null;
  sessionTtlSeconds: number | null;
}

function fakeGateway(): { gateway: PlayerGateway; recorded: RecordedEvaluation[] } {
  const recorded: RecordedEvaluation[] = [];
  const gateway = {
    recordAccessEvaluation: vi.fn(async (input: RecordedEvaluation) => {
      recorded.push(input);
      return {
        status: 'recorded' as const,
        evaluationId: '2b9e6679-7425-40de-944b-e07fc1f90ae2',
        sessionId: input.result === 'eligible' ? '3c9e6679-7425-40de-944b-e07fc1f90ae3' : null,
        sessionExpiresAt:
          input.result === 'eligible' ? new Date(Date.now() + 300_000).toISOString() : null,
      };
    }),
  } as unknown as PlayerGateway;
  return { gateway, recorded };
}

function fakeVerifier(baseUnits: bigint, decimals = 6): SolanaTokenVerifier {
  return {
    validateMint: vi.fn(),
    verifyBalance: vi.fn(async () => ({
      mintAddress: MINT,
      tokenProgramAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      decimals,
      slot: 123,
      walletAddress: WALLET,
      baseUnits,
      tokenAccountCount: 2,
    })),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('evaluateAccess', () => {
  it('grants access at exactly 10,000 $FABLE and creates an access session', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: fakeVerifier(10_000_000_000n),
    });

    expect(outcome.view.result).toBe('eligible');
    expect(outcome.view.sessionExpiresAt).not.toBeNull();
    expect(outcome.view.observedTokensDisplay).toBe('10,000');
    expect(recorded[0]?.result).toBe('eligible');
    expect(recorded[0]?.observedBaseUnits).toBe('10000000000');
    expect(recorded[0]?.requiredBaseUnits).toBe('10000000000');
    expect(recorded[0]?.sessionTtlSeconds).toBe(300);
  });

  it('grants access above the threshold', async () => {
    stubWalletEnv();
    const { gateway } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: fakeVerifier(10_000_000_001n),
    });
    expect(outcome.view.result).toBe('eligible');
  });

  it('denies access one base unit below the threshold', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: fakeVerifier(9_999_999_999n),
    });

    expect(outcome.view.result).toBe('balance_below_requirement');
    expect(outcome.view.sessionExpiresAt).toBeNull();
    expect(recorded[0]?.sessionTtlSeconds).toBeNull();
  });

  it('denies access at 1,002 $FABLE (9,999.999999 equivalent covered above)', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: fakeVerifier(1_002_000_000n),
    });

    expect(outcome.view.result).toBe('balance_below_requirement');
    expect(outcome.view.observedTokensDisplay).toBe('1,002');
    expect(recorded[0]?.sessionTtlSeconds).toBeNull();
  });

  it('queries the chain freshly on every evaluation and persists each one', async () => {
    // A manual Refresh balance must never reuse the previous application
    // evaluation: two calls mean two chain queries and two stored records.
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const verifier = fakeVerifier(1_002_000_000n);
    const input = {
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier,
    };

    await evaluateAccess(input);
    await evaluateAccess(input);

    expect(verifier.verifyBalance).toHaveBeenCalledTimes(2);
    expect(recorded).toHaveLength(2);
  });

  it('fails safe with no fabricated balance when configuration is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', 'solana:devnet');
    const { gateway, recorded } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
    });

    expect(outcome.view.result).toBe('token_configuration_missing');
    expect(outcome.view.observedTokensDisplay).toBeNull();
    expect(outcome.view.configured).toBe(false);
    expect(recorded[0]?.result).toBe('token_configuration_missing');
  });

  it('fails safe when the RPC endpoint is unavailable', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const failing: SolanaTokenVerifier = {
      validateMint: vi.fn(),
      verifyBalance: vi.fn(async () => {
        throw new SolanaVerificationError('RPC_UNAVAILABLE');
      }),
    };
    const outcome = await evaluateAccess({
      userClient: fakeUserClient(),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: failing,
    });

    expect(outcome.view.result).toBe('rpc_unavailable');
    expect(outcome.view.observedTokensDisplay).toBeNull();
    expect(recorded[0]?.result).toBe('rpc_unavailable');
  });

  it('reports wrong network without calling the RPC', async () => {
    stubWalletEnv();
    const { gateway } = fakeGateway();
    const verifier = fakeVerifier(99_999_000_000n);
    const outcome = await evaluateAccess({
      userClient: fakeUserClient({ wallet: { network: 'solana:mainnet-beta' } }),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier,
    });

    expect(outcome.view.result).toBe('wrong_network');
    expect(verifier.verifyBalance).not.toHaveBeenCalled();
  });

  it('denies a suspended profile before any balance check', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const verifier = fakeVerifier(99_999_000_000n);
    const outcome = await evaluateAccess({
      userClient: fakeUserClient({ status: 'suspended' }),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier,
    });

    expect(outcome.view.result).toBe('profile_suspended');
    expect(verifier.verifyBalance).not.toHaveBeenCalled();
    expect(recorded[0]?.result).toBe('profile_suspended');
  });

  it('requires a linked wallet', async () => {
    stubWalletEnv();
    const { gateway, recorded } = fakeGateway();
    const outcome = await evaluateAccess({
      userClient: fakeUserClient({ wallet: null }),
      gateway,
      userId: USER_ID,
      correlationId: 'test',
      verifier: fakeVerifier(99_999_000_000n),
    });

    expect(outcome.view.result).toBe('wallet_not_linked');
    expect(recorded).toHaveLength(0);
  });
});

describe('loadAccessStatus', () => {
  it('honors an unexpired access session until its own expiration', async () => {
    stubWalletEnv();
    const outcome = await loadAccessStatus(
      fakeUserClient({
        accessSession: { expiresAt: new Date(Date.now() + 60_000).toISOString() },
      }),
    );
    expect(outcome.view.result).toBe('eligible');
    expect(outcome.view.sessionExpiresAt).not.toBeNull();
  });

  it('requires renewal once the access session has expired', async () => {
    stubWalletEnv();
    const outcome = await loadAccessStatus(
      fakeUserClient({
        accessSession: { expiresAt: new Date(Date.now() - 1_000).toISOString() },
        latestEvaluation: {
          result: 'eligible',
          observedDisplay: '10000',
          requiredBaseUnits: '10000000000',
          observedBaseUnits: '10000000000',
          evaluatedAt: '2026-07-19T10:00:00.000Z',
        },
      }),
    );
    expect(outcome.view.result).toBe('session_expired');
  });

  it('asks for verification when nothing has been evaluated yet', async () => {
    stubWalletEnv();
    const outcome = await loadAccessStatus(fakeUserClient());
    expect(outcome.view.result).toBe('reverification_required');
  });
});
