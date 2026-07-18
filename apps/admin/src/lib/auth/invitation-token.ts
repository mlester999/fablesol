/**
 * Invitation tokens. The plaintext token travels only inside the acceptance
 * link; the database stores nothing but its SHA-256 hash
 * (`admin_invitations.token_hash`). Knowledge of the token is the credential.
 */

const TOKEN_BYTES = 32;

export const INVITATION_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const INVITATION_DEFAULT_EXPIRY_HOURS = 72;
export const INVITATION_MAX_EXPIRY_HOURS = 336;

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 64 hex characters of CSPRNG output. */
export function generateInvitationToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function isWellFormedInvitationToken(token: string): boolean {
  return INVITATION_TOKEN_PATTERN.test(token);
}

/** SHA-256 hex digest, matching the database's `^[0-9a-f]{64}$` constraint. */
export async function hashInvitationToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

export function invitationAcceptancePath(token: string): string {
  return `/invite/${token}`;
}
