import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Shared-architecture guarantee: header Connect wallet and landing Play Now
 * are the same WalletAccessButton opening the same dialog and mounting the
 * same WalletFlow; only the label and intent differ. No duplicate wallet
 * modal or flow implementation exists.
 */

vi.mock('@/components/wallet/wallet-flow', () => ({
  WalletFlow: (props: { intent?: string }) => (
    <div data-testid="shared-wallet-flow" data-intent={props.intent ?? 'connect'} />
  ),
}));

import { ConnectButton, PlayNowButton } from './connect-button';

// jsdom does not implement the native dialog modal API.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

function stubWalletEnv(): void {
  vi.stubEnv('NEXT_PUBLIC_REOWN_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', 'solana:mainnet-beta');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3600');
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('shared wallet access button', () => {
  it('header Connect wallet opens the shared flow with connect intent', async () => {
    stubWalletEnv();
    const user = userEvent.setup();
    render(<ConnectButton />);

    await user.click(screen.getByRole('button', { name: 'Connect wallet' }));

    const flow = await screen.findByTestId('shared-wallet-flow');
    expect(flow.getAttribute('data-intent')).toBe('connect');
    expect(screen.getByRole('heading', { name: 'Connect a Solana wallet' })).toBeTruthy();
  });

  it('landing Play Now opens the same shared flow with play intent, not a bare link', async () => {
    stubWalletEnv();
    const user = userEvent.setup();
    render(<PlayNowButton />);

    // A button that opens the shared flow; never a direct navigation.
    expect(screen.queryByRole('link', { name: 'Play Now' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Play Now' }));

    const flow = await screen.findByTestId('shared-wallet-flow');
    expect(flow.getAttribute('data-intent')).toBe('play');
    expect(screen.getByRole('heading', { name: 'Connect a Solana wallet' })).toBeTruthy();
  });

  it('stays honest when wallet connection is not configured', async () => {
    const user = userEvent.setup();
    render(<PlayNowButton />);

    await user.click(screen.getByRole('button', { name: 'Play Now' }));

    expect(await screen.findByText(/Wallet connection is not available right now/)).toBeTruthy();
    expect(screen.queryByTestId('shared-wallet-flow')).toBeNull();
  });
});
