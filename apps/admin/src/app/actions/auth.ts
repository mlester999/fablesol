'use server';

import { redirect } from 'next/navigation';

import { getCurrentAdminAuthorization } from '@/lib/auth/authorization';
import { validateNewPassword } from '@/lib/auth/password';
import { hasVerifiedRecoverySession } from '@/lib/auth/recovery';
import { ADMIN_ROUTES, destinationForAuthorization } from '@/lib/auth/redirects';
import { getAdminPublicEnv } from '@/lib/env';
import { readFormString } from '@/lib/forms';
import { createAdminServerClient } from '@/lib/supabase/server';

async function routeAfterSessionMutation(): Promise<never> {
  const authorization = await getCurrentAdminAuthorization();
  return redirect(destinationForAuthorization(authorization));
}

export async function loginAction(formData: FormData): Promise<never> {
  const email = readFormString(formData, 'email', 254)?.trim();
  const password = readFormString(formData, 'password', 1024);

  if (!email || !password) {
    redirect('/login?notice=invalid');
  }

  const supabase = await createAdminServerClient();
  const signInResult = await supabase.auth.signInWithPassword({ email, password });

  if (signInResult.error) {
    redirect('/login?notice=invalid');
  }

  return routeAfterSessionMutation();
}

export async function forgotPasswordAction(formData: FormData): Promise<never> {
  const email = readFormString(formData, 'email', 254)?.trim();

  if (email && email.includes('@')) {
    const supabase = await createAdminServerClient();
    const callbackUrl = new URL('/auth/callback', getAdminPublicEnv().adminUrl);
    callbackUrl.searchParams.set('flow', 'recovery');

    // The outcome is intentionally ignored so this response cannot enumerate accounts.
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl.toString() });
  }

  redirect('/forgot-password?sent=1');
}

export async function resetPasswordAction(formData: FormData): Promise<never> {
  if (!(await hasVerifiedRecoverySession())) {
    redirect(ADMIN_ROUTES.sessionExpired);
  }

  const password = readFormString(formData, 'password', 128) ?? '';
  const confirmation = readFormString(formData, 'passwordConfirmation', 128) ?? '';
  const validation = validateNewPassword(password, confirmation);

  if (!validation.valid) {
    redirect(`/reset-password?notice=${validation.reason}`);
  }

  const supabase = await createAdminServerClient();
  const updateResult = await supabase.auth.updateUser({ password });

  if (updateResult.error) {
    redirect('/reset-password?notice=invalid');
  }

  await supabase.auth.signOut({ scope: 'local' });
  redirect('/login?notice=password-updated');
}

export async function logoutAction(): Promise<never> {
  const supabase = await createAdminServerClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect(`${ADMIN_ROUTES.login}?notice=signed-out`);
}
