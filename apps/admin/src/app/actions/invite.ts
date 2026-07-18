'use server';

import { redirect } from 'next/navigation';

import { hashInvitationToken, isWellFormedInvitationToken } from '@/lib/auth/invitation-token';
import { validateNewPassword } from '@/lib/auth/password';
import { readFormString, readTrimmedFormString } from '@/lib/forms';
import { createAdminServerClient } from '@/lib/supabase/server';
import { createAdminServiceRoleClient } from '@/lib/supabase/service';

function invitePath(token: string, notice?: string): string {
  return notice === undefined ? `/invite/${token}` : `/invite/${token}?notice=${notice}`;
}

async function acceptWithCurrentSession(tokenHash: string, token: string): Promise<never> {
  const supabase = await createAdminServerClient();
  const acceptResult = await supabase.rpc('accept_admin_invitation', { p_token_hash: tokenHash });

  if (acceptResult.error) {
    redirect(invitePath(token, 'unavailable'));
  }

  const status =
    typeof acceptResult.data === 'object' && acceptResult.data !== null
      ? String(Reflect.get(acceptResult.data, 'status'))
      : 'invalid';

  switch (status) {
    case 'accepted':
    case 'already_member':
      redirect('/dashboard');
      break;
    case 'email_mismatch':
      redirect(invitePath(token, 'email-mismatch'));
      break;
    case 'expired':
      redirect(invitePath(token, 'expired'));
      break;
    case 'revoked':
      redirect(invitePath(token, 'revoked'));
      break;
    case 'already_accepted':
      redirect(invitePath(token, 'already-accepted'));
      break;
    default:
      redirect(invitePath(token, 'invalid'));
  }
  throw new Error('unreachable');
}

/**
 * Accepts an invitation. The single-use token is the credential; the database
 * function re-verifies status, expiry, and email match. For invitees without
 * an auth account, the account is provisioned server-side with the password
 * they chose, then the invitation is accepted as that authenticated user.
 */
export async function acceptInvitationAction(formData: FormData): Promise<never> {
  const token = readTrimmedFormString(formData, 'token', 64) ?? '';

  if (!isWellFormedInvitationToken(token)) {
    redirect('/session-expired');
  }

  const tokenHash = await hashInvitationToken(token);
  const supabase = await createAdminServerClient();
  const userResult = await supabase.auth.getUser();

  if (!userResult.error && userResult.data.user !== null) {
    return acceptWithCurrentSession(tokenHash, token);
  }

  // No session: provision the auth account with the chosen password.
  const password = readFormString(formData, 'password', 128) ?? '';
  const confirmation = readFormString(formData, 'passwordConfirmation', 128) ?? '';
  const validation = validateNewPassword(password, confirmation);

  if (!validation.valid) {
    redirect(invitePath(token, validation.reason));
  }

  const openResult = await supabase.rpc('open_admin_invitation', { p_token_hash: tokenHash });
  const openState =
    !openResult.error && typeof openResult.data === 'object' && openResult.data !== null
      ? openResult.data
      : undefined;
  const openStatus = openState === undefined ? 'invalid' : String(Reflect.get(openState, 'status'));

  if (openStatus !== 'open') {
    redirect(invitePath(token, openStatus === 'invalid' ? 'invalid' : openStatus));
  }

  const email = String(Reflect.get(openState as object, 'email'));
  const fullName = String(Reflect.get(openState as object, 'fullName'));
  const serviceClient = createAdminServiceRoleClient();

  if (serviceClient === undefined) {
    redirect(invitePath(token, 'service-unconfigured'));
  }

  const createResult = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createResult.error) {
    // The address already has an auth account; its owner must sign in first.
    redirect(invitePath(token, 'existing-account'));
  }

  const signInResult = await supabase.auth.signInWithPassword({ email, password });

  if (signInResult.error) {
    redirect(invitePath(token, 'unavailable'));
  }

  return acceptWithCurrentSession(tokenHash, token);
}
