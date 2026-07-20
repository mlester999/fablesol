'use client';

import { createAppKit } from '@reown/appkit/react';
import type { CreateAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solana, solanaDevnet } from '@reown/appkit/networks';

import type { SolanaNetwork } from './config';

export interface FablesolAppKitConfig {
  readonly projectId: string;
  readonly siteUrl: string;
  readonly network: SolanaNetwork;
}

let initializedKey: string | undefined;

export function appKitNetworkFor(network: SolanaNetwork) {
  return network === 'solana:mainnet-beta' ? solana : solanaDevnet;
}

/**
 * Initializes the wallet selector once, in the browser, restricted to the
 * single configured Solana network. Idempotent under React Strict Mode.
 * Extra provider features (email login, socials, onramp, swaps) stay off:
 * Fablesol only ever asks a wallet to connect and sign a free message.
 */
export function initializeFablesolAppKit(config: FablesolAppKitConfig): void {
  if (typeof window === 'undefined') {
    return;
  }

  const key = `${config.projectId}:${config.siteUrl}:${config.network}`;
  if (initializedKey === key) {
    return;
  }
  if (initializedKey !== undefined) {
    throw new Error('The wallet selector was already initialized with different metadata.');
  }

  const configuredNetwork = appKitNetworkFor(config.network);
  // AppKit 1.8.x adapter/network types can resolve to parallel copies of the
  // same controller types; these are the documented runtime values.
  const adapters = [new SolanaAdapter()] as unknown as NonNullable<CreateAppKit['adapters']>;
  const networks = [configuredNetwork] as unknown as CreateAppKit['networks'];
  const defaultNetwork = configuredNetwork as unknown as NonNullable<
    CreateAppKit['defaultNetwork']
  >;

  createAppKit({
    adapters,
    networks,
    defaultNetwork,
    projectId: config.projectId,
    metadata: {
      name: 'Fablesol',
      description: 'A cozy multiplayer farming world with a fair player-first economy.',
      url: config.siteUrl,
      icons: [new URL('/logo-no-bg.png', config.siteUrl).toString()],
    },
    allowUnsupportedChain: false,
    themeMode: 'light',
    themeVariables: {
      '--w3m-font-family':
        "var(--fb-font-body, 'Nunito', ui-rounded, 'Segoe UI', system-ui, sans-serif)",
      '--w3m-accent': '#2f7d4f',
      '--w3m-border-radius-master': '3px',
      '--w3m-z-index': 4000,
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
      onramp: false,
      swaps: false,
      send: false,
      receive: false,
    },
  });

  initializedKey = key;
}
