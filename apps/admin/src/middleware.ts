import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getAdminPublicEnv } from '@/lib/env';
import { adminAuthCookieOptions } from '@/lib/supabase/cookie-options';

/**
 * Keeps the administrator's Supabase session fresh across the operations
 * console. Refreshed auth cookies are written onto the response here because
 * Server Components cannot persist cookie changes themselves.
 *
 * This file also pins middleware resolution to the admin app: the public
 * site lives at the repository root, and without an admin middleware the
 * build adopts the public src/middleware.ts through the shared workspace
 * root.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { supabaseUrl, supabaseAnonKey, adminUrl } = getAdminPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
    cookieOptions: adminAuthCookieOptions(adminUrl),
  });

  // Revalidates the session server-side and rotates tokens when needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
