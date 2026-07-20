import { NextResponse } from 'next/server';

import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { errorResponse, jsonResponse, newCorrelationId } from '@/lib/server/http';
import { createPlayerGateway } from '@/lib/server/player-gateway';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const cookieClient = await getSupabaseServerClient();
  if (cookieClient === undefined) {
    return errorResponse('service_unavailable', 503, correlationId);
  }

  const user = await cookieClient.auth.getUser();
  if (user.error || !user.data.user) {
    // Already signed out; treat as success so logout is always safe.
    return jsonResponse({ loggedOut: true, correlationId });
  }

  // Best effort: protected access ends even if event recording fails.
  const service = getSupabaseServiceRoleClient();
  if (service !== undefined) {
    await createPlayerGateway(service)
      .invalidateAccessSessions({
        userId: user.data.user.id,
        reason: 'logout',
        correlationId,
      })
      .catch(() => undefined);
  }

  await cookieClient.auth.signOut({ scope: 'local' });

  return jsonResponse({ loggedOut: true, correlationId });
}
