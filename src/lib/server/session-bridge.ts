import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Bridges a server-verified wallet signature to a first-class Supabase auth
 * session, which remains the primary application-session authority.
 *
 * Player auth users are keyed by synthetic, permanently undeliverable
 * addresses under the reserved .invalid TLD. The wallet link itself lives in
 * player_wallets; the email is only an internal identity handle. The
 * generated one-time token hash is exchanged immediately and never logged,
 * stored, or returned to the browser.
 */

export const PLAYER_EMAIL_DOMAIN = 'players.fablesol.invalid';

export function createPlayerEmail(): string {
  return `player-${randomUUID()}@${PLAYER_EMAIL_DOMAIN}`;
}

export class SessionBridgeError extends Error {
  constructor() {
    super('Player session could not be established.');
    this.name = 'SessionBridgeError';
  }
}

export async function createPlayerAuthUser(
  service: SupabaseClient,
  displayLabel: string,
): Promise<User> {
  const created = await service.auth.admin.createUser({
    email: createPlayerEmail(),
    email_confirm: true,
    app_metadata: { fablesol_player: true },
    user_metadata: { display_label: displayLabel },
  });
  if (created.error || !created.data.user) {
    throw new SessionBridgeError();
  }
  return created.data.user;
}

export async function deletePlayerAuthUser(service: SupabaseClient, userId: string): Promise<void> {
  await service.auth.admin.deleteUser(userId).catch(() => undefined);
}

/**
 * Mints a Supabase session for the given auth user into the cookie-bound
 * client. Uses Supabase's own single-use magic-link token exchange; no
 * custom JWT is ever created.
 */
export async function establishPlayerSession(
  service: SupabaseClient,
  cookieClient: SupabaseClient,
  email: string,
): Promise<User> {
  const link = await service.auth.admin.generateLink({ type: 'magiclink', email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) {
    throw new SessionBridgeError();
  }

  const verified = await cookieClient.auth.verifyOtp({ type: 'email', token_hash: tokenHash });
  if (verified.error || !verified.data.user) {
    throw new SessionBridgeError();
  }
  return verified.data.user;
}
