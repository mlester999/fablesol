import { describe, expect, it } from 'vitest';

import { WalletClientError } from './client';
import { refreshFailureMessage, refreshOutcomeMessage } from './refresh-messages';

describe('refresh outcome messages', () => {
  it('maps every fresh server result to safe player-facing copy', () => {
    expect(refreshOutcomeMessage('eligible', '10,000', 'solana:mainnet-beta')).toBe(
      'Balance updated. Access is now available.',
    );
    expect(
      refreshOutcomeMessage('balance_below_requirement', '10,000', 'solana:mainnet-beta'),
    ).toBe('Balance updated. This wallet still holds less than 10,000 $FABLE.');
    expect(refreshOutcomeMessage('rpc_unavailable', '10,000', 'solana:mainnet-beta')).toMatch(
      /temporarily unavailable/,
    );
    expect(refreshOutcomeMessage('wrong_network', '10,000', 'solana:mainnet-beta')).toBe(
      'Switch to Solana Mainnet.',
    );
    expect(refreshOutcomeMessage('session_expired', '10,000', 'solana:mainnet-beta')).toBe(
      'Your wallet session needs verification again.',
    );
  });

  it('never leaks internals and handles rate limiting distinctly', () => {
    expect(refreshFailureMessage(new WalletClientError('rate_limited', 'raw'))).toBe(
      'Please wait before checking again.',
    );
    expect(refreshFailureMessage(new Error('ECONNREFUSED postgres://secret'))).toBe(
      'Balance verification is temporarily unavailable. Please try again shortly.',
    );
  });
});
