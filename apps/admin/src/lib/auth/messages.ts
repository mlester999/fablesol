/**
 * Auth notices. Every message is enumeration-safe: nothing here reveals
 * whether an account, invitation, or email address exists.
 */
export const AUTH_MESSAGES = {
  invalidCredentials: 'Unable to sign in with those credentials.',
  serviceUnavailable: 'Sign-in is temporarily unavailable. Please try again.',
  resetRequested: 'If that address can receive a reset email, instructions will arrive shortly.',
  passwordUpdated: 'Your password has been updated. Sign in again to continue.',
  passwordMismatch: 'The passwords do not match.',
  passwordWeak: 'Use 12-128 characters with uppercase, lowercase, a number, and a symbol.',
  resetInvalid: 'This password-reset session is no longer valid. Request a new link.',
  signedOut: 'You have been signed out.',
} as const;

export type LoginNotice = 'invalid' | 'service-unavailable' | 'password-updated' | 'signed-out';
export type ResetNotice = 'mismatch' | 'weak' | 'invalid';

export function loginNoticeMessage(notice: string | undefined): string | undefined {
  switch (notice) {
    case 'invalid':
      return AUTH_MESSAGES.invalidCredentials;
    case 'service-unavailable':
      return AUTH_MESSAGES.serviceUnavailable;
    case 'password-updated':
      return AUTH_MESSAGES.passwordUpdated;
    case 'signed-out':
      return AUTH_MESSAGES.signedOut;
    default:
      return undefined;
  }
}

export function resetNoticeMessage(notice: string | undefined): string | undefined {
  switch (notice) {
    case 'mismatch':
      return AUTH_MESSAGES.passwordMismatch;
    case 'weak':
      return AUTH_MESSAGES.passwordWeak;
    case 'invalid':
      return AUTH_MESSAGES.resetInvalid;
    default:
      return undefined;
  }
}
