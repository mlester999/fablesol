import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AccessViewPayload, PlayerStatusPayload } from '@/lib/wallet/client';

/**
 * Access-panel behavior of the one shared wallet flow: ineligible players
 * never see a way into protected gameplay, Refresh balance always performs a
 * fresh server evaluation, and play intent navigates only when the server
 * says eligible.
 */

const pushMock = vi.fn();
const refreshMock = vi.fn();
const routerMock = { push: pushMock, refresh: refreshMock, prefetch: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

vi.mock('@reown/appkit/react', () => ({
  useAppKit: () => ({ open: vi.fn() }),
  useAppKitAccount: () => ({ address: undefined, isConnected: false }),
  useAppKitNetwork: () => ({ caipNetwork: undefined }),
  useAppKitProvider: () => ({ walletProvider: undefined }),
  useAppKitState: () => ({ open: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

vi.mock('@/lib/wallet/appkit', () => ({
  initializeFablesolAppKit: vi.fn(),
  appKitNetworkFor: () => ({ id: 'solana:mainnet-beta' }),
}));

const fetchAccessStatusMock = vi.fn();
const renewAccessMock = vi.fn();
const logoutPlayerMock = vi.fn();

vi.mock('@/lib/wallet/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/wallet/client')>();
  return {
    ...original,
    fetchAccessStatus: (...args: unknown[]) => fetchAccessStatusMock(...args),
    renewAccess: (...args: unknown[]) => renewAccessMock(...args),
    logoutPlayer: (...args: unknown[]) => logoutPlayerMock(...args),
  };
});

import { WalletFlow } from './wallet-flow';
import { WalletClientError } from '@/lib/wallet/client';

function accessView(overrides: Partial<AccessViewPayload> = {}): AccessViewPayload {
  return {
    result: 'balance_below_requirement',
    network: 'solana:mainnet-beta',
    requiredTokensDisplay: '10,000',
    observedTokensDisplay: '1,002',
    sessionExpiresAt: null,
    evaluatedAt: '2026-07-19T15:00:00.000Z',
    configured: true,
    ...overrides,
  };
}

function playerStatus(): PlayerStatusPayload {
  return {
    displayLabel: 'Farmer D8YTQrv7',
    profileStatus: 'active',
    walletMasked: 'D8YT…Qrv7',
    network: 'solana:mainnet-beta',
    lastAccessVerificationAt: '2026-07-19T15:00:00.000Z',
  };
}

function renderFlow(input: { intent?: 'connect' | 'play'; onClose?: () => void } = {}) {
  return render(
    <WalletFlow
      projectId="test-project"
      siteUrl="http://localhost:3600"
      network="solana:mainnet-beta"
      intent={input.intent ?? 'connect'}
      onClose={input.onClose ?? vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe('insufficient-balance state', () => {
  beforeEach(() => {
    fetchAccessStatusMock.mockResolvedValue({ access: accessView(), player: playerStatus() });
  });

  it('never offers a way into protected gameplay', async () => {
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    expect(screen.queryByText('Go to Play')).toBeNull();
    expect(screen.queryByText('Enter Fablesol')).toBeNull();
    expect(screen.queryByText('Check access now')).toBeNull();
  });

  it('offers Refresh balance, Account, and Log out with no bottom Close button', async () => {
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    expect(screen.getByRole('button', { name: 'Refresh balance' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Account' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    // Dismissal now lives only on the dialog's corner X; no redundant
    // Close action is announced inside the flow.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    // The real verified balance and requirement are shown; nothing fabricated.
    expect(screen.getByText('1,002 $FABLE')).toBeTruthy();
    expect(screen.getByText(/Hold at least 10,000 \$FABLE/)).toBeTruthy();
  });

  it('never calls logout or wallet disconnection when the flow is merely dismissed', async () => {
    const onClose = vi.fn();
    renderFlow({ onClose });
    await screen.findByText(/Not enough \$FABLE yet/);

    // Dismissal is triggered by the host dialog, not by any flow action.
    // Only the explicit Log out button may end the player session.
    expect(logoutPlayerMock).not.toHaveBeenCalled();
  });
});

describe('manual Refresh balance', () => {
  beforeEach(() => {
    fetchAccessStatusMock.mockResolvedValue({ access: accessView(), player: playerStatus() });
  });

  it('performs a fresh server evaluation, blocks duplicates, and updates the balance', async () => {
    let resolveRenew: (value: unknown) => void = () => undefined;
    renewAccessMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRenew = resolve;
        }),
    );
    const user = userEvent.setup();
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    const refresh = screen.getByRole('button', { name: 'Refresh balance' });
    await user.click(refresh);

    // Visible, announced loading state; the trigger is disabled against
    // duplicate submissions and the request went to the server exactly once.
    expect(renewAccessMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Refreshing balance…' })).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Refreshing balance…' }) as HTMLButtonElement).disabled,
    ).toBe(true);

    resolveRenew({
      access: accessView({
        observedTokensDisplay: '1,502',
        evaluatedAt: '2026-07-19T16:00:00.000Z',
      }),
    });

    await screen.findByText('1,502 $FABLE');
    expect(
      screen.getByText('Balance updated. This wallet still holds less than 10,000 $FABLE.'),
    ).toBeTruthy();
    expect(screen.queryByText('Enter Fablesol')).toBeNull();
  });

  it('reveals Enter Fablesol once the fresh balance meets the requirement', async () => {
    renewAccessMock.mockResolvedValue({
      access: accessView({
        result: 'eligible',
        observedTokensDisplay: '10,000',
        sessionExpiresAt: '2026-07-19T16:05:00.000Z',
        evaluatedAt: '2026-07-19T16:00:00.000Z',
      }),
    });
    const user = userEvent.setup();
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    await user.click(screen.getByRole('button', { name: 'Refresh balance' }));

    await screen.findByText('Balance updated. Access is now available.');
    expect(screen.getByRole('button', { name: 'Enter Fablesol' })).toBeTruthy();
    expect(screen.getByText('10,000 $FABLE')).toBeTruthy();
  });

  it('reports rate limiting without pretending a check happened', async () => {
    renewAccessMock.mockRejectedValue(
      new WalletClientError('rate_limited', 'Too many attempts right now.'),
    );
    const user = userEvent.setup();
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    await user.click(screen.getByRole('button', { name: 'Refresh balance' }));

    await screen.findByText('Please wait before checking again.');
    expect(screen.getByText('1,002 $FABLE')).toBeTruthy();
  });

  it('keeps the previous balance only as a labeled previous check when the chain is unreachable', async () => {
    renewAccessMock.mockResolvedValue({
      access: accessView({
        result: 'rpc_unavailable',
        observedTokensDisplay: null,
        evaluatedAt: null,
      }),
    });
    const user = userEvent.setup();
    renderFlow();
    await screen.findByText(/Not enough \$FABLE yet/);

    await user.click(screen.getByRole('button', { name: 'Refresh balance' }));

    await screen.findByText(/Balance verification is temporarily unavailable/);
    expect(screen.getByText('Last verified balance')).toBeTruthy();
    expect(screen.getByText(/1,002 \$FABLE/)).toBeTruthy();
    // The stale value never unlocks anything.
    expect(screen.queryByText('Enter Fablesol')).toBeNull();
  });
});

describe('eligible state', () => {
  it('shows Enter Fablesol and navigates to /play', async () => {
    fetchAccessStatusMock.mockResolvedValue({
      access: accessView({
        result: 'eligible',
        observedTokensDisplay: '12,500',
        sessionExpiresAt: '2026-07-19T16:05:00.000Z',
      }),
      player: playerStatus(),
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderFlow({ onClose });

    const enter = await screen.findByRole('button', { name: 'Enter Fablesol' });
    await user.click(enter);

    expect(onClose).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/play');
  });
});

describe('play intent (landing Play Now)', () => {
  it('navigates directly to /play when a valid access session exists', async () => {
    fetchAccessStatusMock.mockResolvedValue({
      access: accessView({
        result: 'eligible',
        observedTokensDisplay: '12,500',
        sessionExpiresAt: '2026-07-19T16:05:00.000Z',
      }),
      player: playerStatus(),
    });
    const onClose = vi.fn();
    renderFlow({ intent: 'play', onClose });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/play');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the same shared insufficient-balance panel instead of navigating', async () => {
    fetchAccessStatusMock.mockResolvedValue({ access: accessView(), player: playerStatus() });
    renderFlow({ intent: 'play' });

    await screen.findByText(/Not enough \$FABLE yet/);
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Refresh balance' })).toBeTruthy();
    expect(screen.queryByText('Enter Fablesol')).toBeNull();
  });
});
