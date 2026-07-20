import { NextResponse } from 'next/server';

import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { evaluateAccess } from '@/lib/server/access';
import { errorResponse, jsonResponse, newCorrelationId } from '@/lib/server/http';
import { createPlayerGateway, PlayerGatewayError } from '@/lib/server/player-gateway';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';

export const dynamic = 'force-dynamic';

/** Renewal triggers a full fresh balance verification; keep it bounded. */
const MAXIMUM_EVALUATIONS_PER_MINUTE = 6;

export async function POST(): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const service = getSupabaseServiceRoleClient();
  const cookieClient = await getSupabaseServerClient();
  if (service === undefined || cookieClient === undefined) {
    return errorResponse('service_unavailable', 503, correlationId);
  }

  const user = await cookieClient.auth.getUser();
  if (user.error || !user.data.user) {
    return errorResponse('unauthenticated', 401, correlationId);
  }

  // Server-authoritative rate limit on fresh evaluations. RLS scopes the
  // count to the caller's own rows.
  const recent = await cookieClient
    .from('player_access_evaluations')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', new Date(Date.now() - 60_000).toISOString());

  if (recent.error) {
    return errorResponse('service_unavailable', 503, correlationId);
  }
  if ((recent.count ?? 0) >= MAXIMUM_EVALUATIONS_PER_MINUTE) {
    return errorResponse('rate_limited', 429, correlationId);
  }

  try {
    const outcome = await evaluateAccess({
      userClient: cookieClient,
      gateway: createPlayerGateway(service),
      userId: user.data.user.id,
      correlationId,
    });

    return jsonResponse({ access: outcome.view, correlationId });
  } catch (error) {
    if (error instanceof PlayerGatewayError || error instanceof PlayerMeUnavailableError) {
      return errorResponse('service_unavailable', 503, correlationId);
    }
    return errorResponse('service_unavailable', 503, correlationId);
  }
}
