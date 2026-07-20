import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loadAccessStatus } from '@/lib/server/access';
import { errorResponse, jsonResponse, newCorrelationId } from '@/lib/server/http';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';
import { maskWalletAddress } from '@/lib/wallet/config';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const cookieClient = await getSupabaseServerClient();
  if (cookieClient === undefined) {
    return errorResponse('service_unavailable', 503, correlationId);
  }

  const user = await cookieClient.auth.getUser();
  if (user.error || !user.data.user) {
    return errorResponse('unauthenticated', 401, correlationId);
  }

  try {
    const status = await loadAccessStatus(cookieClient);
    return jsonResponse({
      access: status.view,
      player:
        status.me === null
          ? null
          : {
              displayLabel: status.me.displayLabel,
              profileStatus: status.me.status,
              walletMasked:
                status.me.wallet === null
                  ? null
                  : maskWalletAddress(status.me.wallet.walletAddress),
              network: status.me.wallet?.network ?? null,
              lastAccessVerificationAt: status.me.lastAccessVerificationAt,
            },
      correlationId,
    });
  } catch (error) {
    if (error instanceof PlayerMeUnavailableError) {
      return errorResponse('service_unavailable', 503, correlationId);
    }
    return errorResponse('service_unavailable', 503, correlationId);
  }
}
