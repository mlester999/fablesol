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
      text: 'Connect a compatible Solana wallet. Never share your seed phrase.',
    },
    {
      id: 'holdings',
      title: 'Meet the access requirement',
      text: 'Hold at least 10,000 $FABLE in the connected wallet.',
    },
    {
      id: 'enter',
      title: 'Enter Fablesol',
      text: 'When access is confirmed, enter the world and use your player profile.',
    },
    {
      id: 'play',
      title: 'Play through in-game systems',
      text: 'Activities, COPPER, animals, materials, Cat Dice, Cat Battle, and tournaments all run in the game itself.',
    },
  ],
  disclaimer:
    'Digital asset values can change. Holding $FABLE or playing Fablesol is not a guarantee of income, profits, or token appreciation. This documentation is educational, not financial advice.',
} as const;
