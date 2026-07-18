import 'server-only';

import { createAdminServerClient } from '../supabase/server';

function readAuthenticationMethods(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.flatMap((entry) => {
        if (typeof entry === 'string') return [entry];
        if (typeof entry !== 'object' || entry === null) return [];
        const method = Reflect.get(entry, 'method');
        return typeof method === 'string' ? [method] : [];
      }),
    ),
  ];
}

export function hasAuthenticationMethod(value: unknown, expectedMethod: string): boolean {
  return readAuthenticationMethods(value).includes(expectedMethod);
}

/**
 * True only when the current session was established through the Supabase
 * password-recovery flow (`amr` contains `recovery`) and the verified user
 * matches the token subject. Ordinary sign-ins can never reach the
 * reset-password form through this gate.
 */
export async function hasVerifiedRecoverySession(): Promise<boolean> {
  const supabase = await createAdminServerClient();
  const claimsResult = await supabase.auth.getClaims();

  if (
    claimsResult.error ||
    !claimsResult.data?.claims.sub ||
    !hasAuthenticationMethod(claimsResult.data.claims.amr, 'recovery')
  ) {
    return false;
  }

  const userResult = await supabase.auth.getUser();
  return !userResult.error && userResult.data.user.id === claimsResult.data.claims.sub;
}
