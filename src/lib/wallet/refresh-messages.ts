import { networkDisplayName, type AccessResult, type SolanaNetwork } from './config';
import { WalletClientError } from './client';

/**
 * The one shared player-facing outcome copy for a manual Refresh balance.
 * Used by the wallet modal and the account page so both surfaces always say
 * the same thing for the same fresh server result. Safe by construction:
 * only stable reason codes are mapped, never raw errors.
 */

export function refreshOutcomeMessage(
  result: AccessResult,
  requiredDisplay: string,
  network: SolanaNetwork | null,
): string {
  switch (result) {
    case 'eligible':
      return 'Balance updated. Access is now available.';
    case 'balance_below_requirement':
      return `Balance updated. This wallet still holds less than ${requiredDisplay} $FABLE.`;
    case 'rpc_unavailable':
      return 'Balance verification is temporarily unavailable. Please try again shortly.';
    case 'token_configuration_missing':
      return 'Balance verification is not available right now.';
    case 'wrong_network':
      return network !== null
        ? `Switch to ${networkDisplayName(network)}.`
        : 'Switch your wallet to the supported network.';
    case 'session_expired':
    case 'reverification_required':
    case 'wallet_not_verified':
      return 'Your wallet session needs verification again.';
    case 'wallet_not_linked':
      return 'Connect and verify a wallet to check its balance.';
    default:
      return 'Balance check finished.';
  }
}

/** Safe message for a refresh request that failed before returning a result. */
export function refreshFailureMessage(error: unknown): string {
  if (error instanceof WalletClientError) {
    if (error.code === 'rate_limited') return 'Please wait before checking again.';
    if (error.code === 'unauthenticated') return 'Your wallet session needs verification again.';
    return error.message;
  }
  return 'Balance verification is temporarily unavailable. Please try again shortly.';
}
