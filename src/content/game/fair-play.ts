export const FAIR_PLAY = {
  multiAccountPrinciple:
    'Multiple accounts or wallets are not automatically prohibited. Using them to exploit the game is prohibited.',
  prohibited: [
    'Automation or bots that violate game rules',
    'Match manipulation',
    'Coordinated self-dealing intended to exploit rewards',
    'Artificial tournament participation',
    'Repeated refund abuse',
    'Multi-account reward farming that bypasses intended restrictions',
    'Exploiting defects',
    'Unauthorized client manipulation',
    'Attempting to duplicate assets or balances',
    'Manipulating Copper Exchange orders',
    'Manipulating Auction House transactions',
    'Harassment or abusive social behavior',
    'Circumventing suspensions or enforcement',
  ],
  enforcementNote:
    'Enforcement should rely on authoritative records and review. No anti-cheat system is claimed to be impossible to bypass.',
} as const;

export const SECURITY = {
  topics: [
    {
      title: 'Wallet connection safety',
      text: 'Only connect through the official Fablesol experience. Review connection prompts carefully.',
    },
    {
      title: 'Verify the official domain',
      text: 'Bookmark and double-check the official game domain before connecting a wallet.',
    },
    {
      title: 'Never share seed phrases',
      text: 'Fablesol will never ask for your seed phrase or private key. Anyone who does is not official.',
    },
    {
      title: 'Confirm transaction details',
      text: 'On-chain wallet transactions are distinct from in-game COPPER actions. Read every wallet prompt before approving.',
    },
    {
      title: 'COPPER vs on-chain actions',
      text: 'Spending COPPER inside the game does not automatically create a blockchain transfer. Wallet popups are for on-chain actions.',
    },
    {
      title: 'Game-validated Cat Battle',
      text: 'Battle outcomes are validated by the game for fairness and consistency.',
    },
    {
      title: 'Confirm-before-charge tournaments',
      text: 'Tournament registration always requires an explicit confirmation dialog before COPPER is charged.',
    },
    {
      title: 'UTC audit consistency',
      text: 'Official schedules and audit-relevant timestamps use UTC for a shared source of truth.',
    },
    {
      title: 'Report issues',
      text: 'Report bugs or suspicious behavior through official support channels rather than attempting self-exploits.',
    },
  ],
  never: [
    'Never share your seed phrase or private keys with anyone — Fablesol will never ask for them.',
    'Never approve a wallet request you do not understand.',
    'Never trust game links or “support staff” outside the official Discord and X channels.',
  ],
} as const;
