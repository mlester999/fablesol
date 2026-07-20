/**
 * Wallet access and token requirements.
 * Source of truth for /docs/access and how-to-play entry steps.
 */
export const ACCESS = {
  chain: 'Solana',
  tokenSymbol: '$FABLE',
  tokenName: 'FABLE',
  minimumHoldings: 10_000,
  copperName: 'COPPER',
  copperNature: 'off-chain in-game currency',
  fableNature: 'on-chain Solana token',
  accessSteps: [
    {
      id: 'wallet',
      title: 'Connect a Solana wallet',
      text: 'Connect a compatible Solana wallet. Never share your seed phrase; Fablesol will never ask for it.',
    },
    {
      id: 'sign',
      title: 'Sign a free verification message',
      text: 'Sign a short message to prove the wallet is yours. Signing is free, never sends a transaction, and never moves tokens.',
    },
    {
      id: 'holdings',
      title: 'Meet the access requirement',
      text: 'Hold at least 10,000 $FABLE in the connected wallet. The balance is checked whenever you enter protected player areas, and dropping below the requirement can stop a later renewal.',
    },
    {
      id: 'enter',
      title: 'Enter Fablesol',
      text: 'When access is confirmed, your player profile is ready. The playable world itself is still in development.',
    },
    {
      id: 'play',
      title: 'Play through in-game systems',
      text: 'Activities, COPPER, animals, materials, Cat Dice, Cat Battle, and tournaments all run in the game itself.',
    },
  ],
  securityPromises: [
    'Fablesol will never ask for your seed phrase or private key.',
    'Always check that the site address is correct before signing anything.',
    'A balance check reads public chain data and never moves your tokens.',
    'Connecting a wallet does not give Fablesol custody of your funds.',
    'The guides and documentation always stay open without a wallet or any tokens.',
  ],
  disclaimer:
    'Digital asset values can change. Holding $FABLE or playing Fablesol is not a guarantee of income, profits, or token appreciation. This documentation is educational, not financial advice.',
} as const;
