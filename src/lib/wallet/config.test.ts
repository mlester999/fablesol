import { describe, expect, it } from 'vitest';
import {
  deriveDisplayLabel,
  isSolanaNetwork,
  isWalletAddressShaped,
  maskWalletAddress,
  networkDisplayName,
} from './config';

const ADDRESS = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';

describe('wallet address helpers', () => {
  it('masks to first and last four characters only', () => {
    expect(maskWalletAddress(ADDRESS)).toBe('DRpb…21hy');
    expect(maskWalletAddress(ADDRESS)).not.toContain(ADDRESS.slice(4, -4));
  });

  it('derives a display label without exposing the full address', () => {
    const label = deriveDisplayLabel(ADDRESS);
    expect(label).toBe('Farmer DRpb21hy');
    expect(label).not.toContain(ADDRESS);
  });

  it('never echoes malformed input back out', () => {
    expect(maskWalletAddress('<script>alert(1)</script>')).toBe('unknown');
    expect(deriveDisplayLabel('short')).toBe('Farmer');
  });

  it('validates base58 shape', () => {
    expect(isWalletAddressShaped(ADDRESS)).toBe(true);
    expect(isWalletAddressShaped('0OIl' + 'a'.repeat(30))).toBe(false);
    expect(isWalletAddressShaped('tooshort')).toBe(false);
  });
});

describe('network helpers', () => {
  it('accepts only the two supported networks', () => {
    expect(isSolanaNetwork('solana:mainnet-beta')).toBe(true);
    expect(isSolanaNetwork('solana:devnet')).toBe(true);
    expect(isSolanaNetwork('solana:testnet')).toBe(false);
    expect(isSolanaNetwork('ethereum:mainnet')).toBe(false);
  });

  it('shows player-friendly network names', () => {
    expect(networkDisplayName('solana:mainnet-beta')).toBe('Solana Mainnet');
    expect(networkDisplayName('solana:devnet')).toBe('Solana Devnet');
  });
});
