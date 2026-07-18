import { NextResponse, type NextRequest } from 'next/server';

import { hasAuthenticationMethod } from '@/lib/auth/recovery';
import { getAdminPublicEnv } from '@/lib/env';
import { createAdminServerClient } from '@/lib/supabase/server';

function noStoreRedirect(destination: URL): NextResponse {
  const response = NextResponse.redirect(destination, 303);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { adminUrl } = getAdminPublicEnv();
  const expiredDestination = new URL('/session-expired', adminUrl);
  const code = request.nextUrl.searchParams.get('code');
  const flow = request.nextUrl.searchParams.get('flow');

  if (flow !== 'recovery' || code === null || code.length < 8 || code.length > 2048) {
    return noStoreRedirect(expiredDestination);
  }

  const supabase = await createAdminServerClient();
  const exchangeResult = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeResult.error) {
    return noStoreRedirect(expiredDestination);
  }

  const claimsResult = await supabase.auth.getClaims();
  const userResult = await supabase.auth.getUser();

  if (
    claimsResult.error ||
    !claimsResult.data?.claims.sub ||
    !hasAuthenticationMethod(claimsResult.data.claims.amr, 'recovery') ||
    userResult.error ||
    userResult.data.user.id !== claimsResult.data.claims.sub
  ) {
    await supabase.auth.signOut({ scope: 'local' });
    return noStoreRedirect(expiredDestination);
  }

  return noStoreRedirect(new URL('/reset-password', adminUrl));
}
