/**
 * Environment validation — the single place that reads process.env.
 *
 * Public (NEXT_PUBLIC_*) values are safe for the browser bundle. Server-only
 * values must never be imported into client components; `getServerEnv`
 * throws if called in a browser context to make leaks loud.
 *
 * Phase 1 public pages must keep working with no Supabase configuration at
 * all, so every getter degrades gracefully instead of crashing the build.
 */

export interface PublicEnv {
  readonly supabaseUrl: string | undefined;
  readonly supabaseAnonKey: string | undefined;
  readonly siteUrl: string | undefined;
  readonly discordUrl: string | undefined;
  readonly xUrl: string | undefined;
  /** Reown AppKit public project identifier (safe for the browser bundle). */
  readonly reownProjectId: string | undefined;
  /** Configured Solana network label (public, non-secret). */
  readonly solanaNetwork: 'solana:mainnet-beta' | 'solana:devnet' | undefined;
}

export interface ServerEnv {
  /** Privileged key — server only, never expose or log. */
  readonly supabaseServiceRoleKey: string | undefined;
}

export interface WalletServerEnv {
  /** Server-only RPC endpoint; may embed credentials, never expose or log. */
  readonly solanaRpcUrl: string | undefined;
  /** $FABLE mint address; server-authoritative for access decisions. */
  readonly fableTokenMint: string | undefined;
  /** Whole-token access threshold; defaults to the approved 10,000. */
  readonly fableAccessRequiredTokens: string;
  /** Signature challenge lifetime in seconds (default 300). */
  readonly walletChallengeTtlSeconds: number;
  /** Protected access-session lifetime in seconds (default 300). */
  readonly playerAccessSessionTtlSeconds: number;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validUrl(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('protocol');
    return value;
  } catch {
    console.warn(`[env] ${label} is set but is not a valid URL; ignoring it.`);
    return undefined;
  }
}

function validNetwork(
  value: string | undefined,
): 'solana:mainnet-beta' | 'solana:devnet' | undefined {
  if (value === 'solana:mainnet-beta' || value === 'solana:devnet') return value;
  if (value !== undefined) {
    console.warn('[env] NEXT_PUBLIC_SOLANA_NETWORK is set but not a supported network; ignoring.');
  }
  return undefined;
}

function boundedInteger(
  value: string | undefined,
  label: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    console.warn(
      `[env] ${label} must be an integer between ${minimum} and ${maximum}; using ${fallback}.`,
    );
    return fallback;
  }
  return parsed;
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: validUrl(clean(process.env.NEXT_PUBLIC_SUPABASE_URL), 'NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    siteUrl: validUrl(clean(process.env.NEXT_PUBLIC_SITE_URL), 'NEXT_PUBLIC_SITE_URL'),
    discordUrl: validUrl(clean(process.env.NEXT_PUBLIC_DISCORD_URL), 'NEXT_PUBLIC_DISCORD_URL'),
    xUrl: validUrl(clean(process.env.NEXT_PUBLIC_X_URL), 'NEXT_PUBLIC_X_URL'),
    reownProjectId: clean(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID),
    solanaNetwork: validNetwork(clean(process.env.NEXT_PUBLIC_SOLANA_NETWORK)),
  };
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must never run in the browser.');
  }
  return {
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

/**
 * Server-only wallet and $FABLE access configuration. Public pages keep
 * working when these are unset; protected access fails safe instead.
 */
export function getWalletServerEnv(): WalletServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getWalletServerEnv() must never run in the browser.');
  }
  return {
    solanaRpcUrl: validUrl(clean(process.env.SOLANA_RPC_URL), 'SOLANA_RPC_URL'),
    fableTokenMint: clean(process.env.FABLE_TOKEN_MINT),
    fableAccessRequiredTokens: clean(process.env.FABLE_ACCESS_REQUIRED_TOKENS) ?? '10000',
    walletChallengeTtlSeconds: boundedInteger(
      clean(process.env.WALLET_CHALLENGE_TTL_SECONDS),
      'WALLET_CHALLENGE_TTL_SECONDS',
      300,
      60,
      900,
    ),
    playerAccessSessionTtlSeconds: boundedInteger(
      clean(process.env.PLAYER_ACCESS_SESSION_TTL_SECONDS),
      'PLAYER_ACCESS_SESSION_TTL_SECONDS',
      300,
      60,
      3600,
    ),
  };
}

/** True when the public Supabase client can be created. */
export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv();
  return env.supabaseUrl !== undefined && env.supabaseAnonKey !== undefined;
}
