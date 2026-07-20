import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getPublicEnv } from '@/lib/env';

/**
 * Keeps the Supabase player session fresh on protected player surfaces.
 * Refreshed auth cookies are written onto the response here because Server
 * Components cannot persist cookie changes themselves. Public pages are
 * intentionally outside the matcher and never touch auth.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
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
  });

  // Revalidates the session server-side and rotates tokens when needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/play', '/account', '/api/wallet/:path*', '/api/access/:path*', '/api/player/:path*'],
};
