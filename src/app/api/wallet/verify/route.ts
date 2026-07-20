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
import { SessionBridgeError } from '@/lib/server/session-bridge';
import {
  signInVerifiedWallet,
  verifySignedChallenge,
  WalletAuthError,
} from '@/lib/server/wallet-auth';
import { PlayerMeUnavailableError } from '@/lib/server/player-me';
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
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = newCorrelationId();

  const service = getSupabaseServiceRoleClient();
  const cookieClient = await getSupabaseServerClient();
  if (service === undefined || cookieClient === undefined) {
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

    if (verified.purpose !== 'sign_in') {
      // Replacement challenges must go through the replace endpoint, where
      // the signed-in account is checked against the challenge binding.
      return errorResponse('invalid_request', 400, correlationId);
    }

    const signedIn = await signInVerifiedWallet({
      gateway,
      service,
      cookieClient,
      walletAddress: verified.walletAddress,
      network: verified.network,
      correlationId,
    });

    // Initial protected-entry evaluation. The response never fabricates a
    // balance: when verification cannot run, the result says so.
    const access = await evaluateAccess({
      userClient: cookieClient,
      gateway,
      userId: signedIn.userId,
      correlationId,
    });

    return jsonResponse({
      player: {
        walletMasked: maskWalletAddress(verified.walletAddress),
        profileStatus: signedIn.profileStatus,
        isNewPlayer: signedIn.isNewPlayer,
      },
      access: access.view,
      correlationId,
    });
  } catch (error) {
    if (error instanceof WalletAuthError) {
      return walletAuthErrorResponse(error, correlationId);
    }
    if (
      error instanceof PlayerGatewayError ||
      error instanceof SessionBridgeError ||
      error instanceof PlayerMeUnavailableError
    ) {
      return errorResponse('service_unavailable', 503, correlationId);
    }
    return errorResponse('service_unavailable', 503, correlationId);
  }
}
