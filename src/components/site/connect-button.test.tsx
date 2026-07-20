import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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

// jsdom does not implement the native dialog modal API. The polyfill mirrors
// the browser behavior our code relies on: showModal records the previously
// focused element and close restores focus to it.
beforeAll(() => {
  const previousFocus = new WeakMap<HTMLDialogElement, Element | null>();
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    previousFocus.set(this, document.activeElement);
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    const restore = previousFocus.get(this);
    if (restore instanceof HTMLElement) restore.focus();
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
    // Even the unconfigured state relies on the corner X, not a bottom Close.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Close wallet connection' })).toBeTruthy();
  });
});

describe('corner close control', () => {
  it('shows one accessible X with a hidden icon and no bottom Close button', async () => {
    stubWalletEnv();
    const user = userEvent.setup();
    render(<ConnectButton />);
    await user.click(screen.getByRole('button', { name: 'Connect wallet' }));
    await screen.findByTestId('shared-wallet-flow');

    const closeButton = screen.getByRole('button', { name: 'Close wallet connection' });
    expect(closeButton.getAttribute('type')).toBe('button');
    expect(closeButton.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('clicking X closes the modal, unmounts the flow, and restores trigger focus', async () => {
    stubWalletEnv();
    const user = userEvent.setup();
    render(<ConnectButton />);

    const trigger = screen.getByRole('button', { name: 'Connect wallet' });
    trigger.focus();
    await user.click(trigger);
    await screen.findByTestId('shared-wallet-flow');

    await user.click(screen.getByRole('button', { name: 'Close wallet connection' }));

    expect(document.querySelector('dialog[open]')).toBeNull();
    // The flow unmounts entirely so a reopen can never show stale state.
    expect(screen.queryByTestId('shared-wallet-flow')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('a native dialog close (Escape path) resets state and reopening starts fresh', async () => {
    stubWalletEnv();
    const user = userEvent.setup();
    render(<PlayNowButton />);

    const trigger = screen.getByRole('button', { name: 'Play Now' });
    await user.click(trigger);
    await screen.findByTestId('shared-wallet-flow');

    // The browser fires 'close' on the dialog when Escape cancels it.
    const dialog = document.querySelector('dialog') as HTMLDialogElement;
    act(() => {
      dialog.close();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('shared-wallet-flow')).toBeNull();
    });

    // Reopen: a fresh flow mounts with play intent again, nothing stale.
    await user.click(trigger);
    const reopened = await screen.findByTestId('shared-wallet-flow');
    expect(reopened.getAttribute('data-intent')).toBe('play');
  });
});
