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
      title: 'Meet the $FABLE holding requirement',
      text: 'Hold at least 10,000 $FABLE in the connected wallet to satisfy the game access requirement.',
    },
    {
      id: 'enter',
      title: 'Enter Fablesol',
      text: 'Once the access requirement is met, you can enter the world and create or continue your in-game player profile.',
    },
    {
      id: 'play',
      title: 'Play in the off-chain economy',
      text: 'Cozy activities, COPPER balances, animals, materials, Cat Dice, Cat Battle, and tournaments run as in-game systems. They are separate from on-chain $FABLE ownership.',
    },
  ],
  disclaimer:
    'Digital asset values can change. Holding $FABLE or playing Fablesol is not a guarantee of income, profits, or token appreciation. This documentation is educational, not financial advice.',
} as const;
