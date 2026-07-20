import { z } from 'zod';
import { SOLANA_NETWORKS, WALLET_ADDRESS_PATTERN, type SolanaNetwork } from './config';

/**
 * Canonical Fablesol wallet sign-in message.
 *
 * The layout follows the Sign in with Solana convention (domain heading,
 * address, statement, then structured fields) so wallets render it as a
 * recognizable sign-in request. Signing this message proves control of the
 * wallet; it never authorizes a transaction and never moves tokens.
 *
 * The server accepts a message only when re-serializing the parsed fields
 * reproduces the exact signed bytes, so no field can be smuggled or altered.
 */

export const AUTHENTICATION_STATEMENT =
  'Sign in to Fablesol to verify that you own this wallet. Signing is free, does not send a transaction, and does not move any tokens. Fablesol will never ask for your seed phrase.';

const MESSAGE_VERSION = '1';
const MAXIMUM_MESSAGE_LENGTH = 2_048;

export interface WalletMessageFields {
  readonly domain: string;
  readonly uri: string;
  readonly walletAddress: string;
  readonly network: SolanaNetwork;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly challengeId: string;
}

const safeDomainSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9.:_-]+$/u, 'Domain contains unsupported characters');
const nonceSchema = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/u, 'Nonce format is invalid');
const httpUrlSchema = z
  .string()
  .max(200)
  .superRefine((value, context) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      context.addIssue({ code: 'custom', message: 'URI must be an absolute URL' });
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      context.addIssue({ code: 'custom', message: 'URI must be an HTTP URL without credentials' });
    }
  });

export const walletMessageFieldsSchema = z
  .object({
    domain: safeDomainSchema,
    uri: httpUrlSchema,
    walletAddress: z.string().regex(WALLET_ADDRESS_PATTERN, 'Wallet address is invalid'),
    network: z.enum(SOLANA_NETWORKS),
    nonce: nonceSchema,
    issuedAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }),
    challengeId: z.uuid(),
  })
  .strict()
  .superRefine((value, context) => {
    let host: string | undefined;
    try {
      host = new URL(value.uri).host;
    } catch {
      host = undefined;
    }
    if (host !== value.domain) {
      context.addIssue({ code: 'custom', path: ['domain'], message: 'Domain must match URI host' });
    }
    if (Date.parse(value.expiresAt) <= Date.parse(value.issuedAt)) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Expiration must be after issue time',
      });
    }
  });

export function createWalletMessage(fields: WalletMessageFields): string {
  const value = walletMessageFieldsSchema.parse(fields);

  return [
    `${value.domain} wants you to sign in with your Solana account:`,
    value.walletAddress,
    '',
    AUTHENTICATION_STATEMENT,
    '',
    `URI: ${value.uri}`,
    `Version: ${MESSAGE_VERSION}`,
    `Network: ${value.network}`,
    `Nonce: ${value.nonce}`,
    `Issued At: ${value.issuedAt}`,
    `Expiration Time: ${value.expiresAt}`,
    `Challenge ID: ${value.challengeId}`,
  ].join('\n');
}

export function parseWalletMessage(message: string): WalletMessageFields {
  if (message.length > MAXIMUM_MESSAGE_LENGTH) {
    throw new Error('Wallet message is too long');
  }

  const lines = message.split('\n');

  if (
    lines.length !== 12 ||
    lines[2] !== '' ||
    lines[3] !== AUTHENTICATION_STATEMENT ||
    lines[4] !== '' ||
    lines[6] !== `Version: ${MESSAGE_VERSION}`
  ) {
    throw new Error('Wallet message format is invalid');
  }

  const heading = /^(?<domain>.+) wants you to sign in with your Solana account:$/u.exec(
    lines[0] ?? '',
  );
  const field = (line: string | undefined, prefix: string): string => {
    if (line === undefined || !line.startsWith(prefix)) {
      throw new Error('Wallet message format is invalid');
    }
    return line.slice(prefix.length);
  };

  const parsed = walletMessageFieldsSchema.parse({
    domain: heading?.groups?.['domain'],
    walletAddress: lines[1],
    uri: field(lines[5], 'URI: '),
    network: field(lines[7], 'Network: '),
    nonce: field(lines[8], 'Nonce: '),
    issuedAt: field(lines[9], 'Issued At: '),
    expiresAt: field(lines[10], 'Expiration Time: '),
    challengeId: field(lines[11], 'Challenge ID: '),
  });

  if (createWalletMessage(parsed) !== message) {
    throw new Error('Wallet message is not canonical');
  }

  return parsed;
}
