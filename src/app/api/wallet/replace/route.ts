import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { getSupabaseServerClient, getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { evaluateAccess } from '@/lib/server/access';
import {
  errorResponse,
  jsonResponse,
  newCorrelationId,
  requestOrigin,
  walletAuthErrorResponse,
} from '@/lib/server/http';
import { createPlayerGateway, PlayerGatewayError } from '@/lib/server/player-gateway';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';
import { verifySignedChallenge, WalletAuthError } from '@/lib/server/wallet-auth';
import { maskWalletAddress, SOLANA_NETWORKS, WALLET_ADDRESS_PATTERN } from '@/lib/wallet/config';

export const dynamic = 'force-dynamic';

const requestSchema = z
  .object({
    challengeId: z.uuid(),
    walletAddress: z.string().regex(WALLET_ADDRESS_PATTERN),
    network: z.enum(SOLANA_NETWORKS),
    message: z.string().min(1).max(2_048),
    signature: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/u),
    /** Explicit player confirmation is required for a replacement. */
    confirmReplacement: z.literal(true),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const service = getSupabaseServiceRoleClient();
  const cookieClient = await getSupabaseServerClient();
  if (service === undefined || cookieClient === undefined) {
    return errorResponse('service_unavailable', 503, correlationId);
  }

  // Replacement always requires a live authenticated player session.
  const user = await cookieClient.auth.getUser();
  if (user.error || !user.data.user) {
    return errorResponse('unauthenticated', 401, correlationId);
  }
  const userId = user.data.user.id;

  let parsed;
  try {
    parsed = requestSchema.safeParse(await request.json());
  } catch {
    return errorResponse('invalid_request', 400, correlationId);
  }
  if (!parsed.success) {
    return errorResponse('invalid_request', 400, correlationId);
  }

  const gateway = createPlayerGateway(service);

  try {
    const verified = await verifySignedChallenge({
      gateway,
      challengeId: parsed.data.challengeId,
      walletAddress: parsed.data.walletAddress,
      network: parsed.data.network,
      message: parsed.data.message,
      signatureBase64: parsed.data.signature,
      requestOrigin: requestOrigin(request),
      correlationId,
    });

    // The challenge must be a replacement challenge issued to this account.
    if (verified.purpose !== 'wallet_replacement' || verified.requestedByUserId !== userId) {
      return errorResponse('invalid_request', 400, correlationId);
    }

    const replaced = await gateway.replaceWallet({
      userId,
      newWalletAddress: verified.walletAddress,
      network: verified.network,
      correlationId,
    });

    if (replaced.status === 'conflict') {
      return errorResponse('wallet_conflict', 409, correlationId);
    }
    if (replaced.status === 'denied') {
      return errorResponse('unauthenticated', 403, correlationId);
    }
    if (replaced.status !== 'replaced' && replaced.status !== 'unchanged') {
      return errorResponse('invalid_request', 400, correlationId);
    }

    // Replacement invalidated every access session; verify fresh holdings.
    const access = await evaluateAccess({
      userClient: cookieClient,
      gateway,
      userId,
      correlationId,
    });

    return jsonResponse({
      wallet: { walletMasked: maskWalletAddress(verified.walletAddress) },
      replaced: replaced.status === 'replaced',
      access: access.view,
      correlationId,
    });
  } catch (error) {
    if (error instanceof WalletAuthError) {
      return walletAuthErrorResponse(error, correlationId);
    }
    if (error instanceof PlayerGatewayError || error instanceof PlayerMeUnavailableError) {
      return errorResponse('service_unavailable', 503, correlationId);
    }
    return errorResponse('service_unavailable', 503, correlationId);
  }
}
