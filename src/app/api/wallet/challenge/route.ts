import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { createPlayerGateway, PlayerGatewayError } from '@/lib/server/player-gateway';
import {
  clientKeyHashFromRequest,
  errorResponse,
  jsonResponse,
  newCorrelationId,
  requestOrigin,
  walletAuthErrorResponse,
} from '@/lib/server/http';
import { issueChallenge, WalletAuthError } from '@/lib/server/wallet-auth';
import { SOLANA_NETWORKS, WALLET_ADDRESS_PATTERN } from '@/lib/wallet/config';

export const dynamic = 'force-dynamic';

const requestSchema = z
  .object({
    walletAddress: z.string().regex(WALLET_ADDRESS_PATTERN),
    network: z.enum(SOLANA_NETWORKS),
    purpose: z.enum(['sign_in', 'wallet_replacement']).default('sign_in'),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const service = getSupabaseServiceRoleClient();
  if (service === undefined) {
    return errorResponse('service_unavailable', 503, correlationId);
  }

  let parsed;
  try {
    parsed = requestSchema.safeParse(await request.json());
  } catch {
    return errorResponse('invalid_request', 400, correlationId);
  }
  if (!parsed.success) {
    return errorResponse('invalid_request', 400, correlationId);
  }

  // Replacement challenges are bound to the signed-in player; sign-in
  // challenges must not carry an account binding.
  let requestedByUserId: string | null = null;
  if (parsed.data.purpose === 'wallet_replacement') {
    const cookieClient = await getSupabaseServerClient();
    const user = cookieClient ? await cookieClient.auth.getUser() : undefined;
    if (!user || user.error || !user.data.user) {
      return errorResponse('unauthenticated', 401, correlationId);
    }
    requestedByUserId = user.data.user.id;
  }

  try {
    const challenge = await issueChallenge({
      gateway: createPlayerGateway(service),
      walletAddress: parsed.data.walletAddress,
      network: parsed.data.network,
      requestOrigin: requestOrigin(request),
      purpose: parsed.data.purpose,
      requestedByUserId,
      clientKeyHash: clientKeyHashFromRequest(request),
      correlationId,
    });

    return jsonResponse({ ...challenge, correlationId });
  } catch (error) {
    if (error instanceof WalletAuthError) {
      return walletAuthErrorResponse(error, correlationId);
    }
    if (error instanceof PlayerGatewayError) {
      return errorResponse('service_unavailable', 503, correlationId);
    }
    return errorResponse('service_unavailable', 503, correlationId);
  }
}
