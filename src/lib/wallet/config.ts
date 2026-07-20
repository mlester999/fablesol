/**
 * Shared wallet-access constants and types. Isomorphic: safe in the browser
 * bundle and on the server. Never put secrets here.
 */

export const SOLANA_NETWORKS = ['solana:mainnet-beta', 'solana:devnet'] as const;
export type SolanaNetwork = (typeof SOLANA_NETWORKS)[number];

export function isSolanaNetwork(value: unknown): value is SolanaNetwork {
  return typeof value === 'string' && (SOLANA_NETWORKS as readonly string[]).includes(value);
}

export function networkDisplayName(network: SolanaNetwork): string {
  return network === 'solana:mainnet-beta' ? 'Solana Mainnet' : 'Solana Devnet';
}

export const WALLET_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/u;

export function isWalletAddressShaped(value: unknown): value is string {
  return typeof value === 'string' && WALLET_ADDRESS_PATTERN.test(value);
}

/** Public-safe short form of a wallet address: first 4 and last 4 characters. */
export function maskWalletAddress(address: string): string {
  if (!isWalletAddressShaped(address)) return 'unknown';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/** Safe temporary display label that never exposes the full wallet address. */
export function deriveDisplayLabel(address: string): string {
  if (!isWalletAddressShaped(address)) return 'Farmer';
  return `Farmer ${address.slice(0, 4)}${address.slice(-4)}`;
}

export const CHALLENGE_PURPOSES = ['sign_in', 'wallet_replacement'] as const;
export type ChallengePurpose = (typeof CHALLENGE_PURPOSES)[number];

/** Stable reason codes produced by the canonical server-side access evaluator. */
export const ACCESS_RESULTS = [
  'eligible',
  'wallet_not_linked',
  'wallet_not_verified',
  'wrong_network',
  'token_configuration_missing',
  'rpc_unavailable',
  'balance_below_requirement',
  'profile_suspended',
  'session_expired',
  'reverification_required',
] as const;
export type AccessResult = (typeof ACCESS_RESULTS)[number];
