/**
 * Integer base-unit token arithmetic. Eligibility is always decided with
 * BigInt comparisons; floating point never touches an access decision.
 */

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error('Token decimals must be an integer between 0 and 18');
  }
}

/** "10000" or "10000.5" with the given decimals to exact integer base units. */
export function decimalAmountToBaseUnits(amount: string, decimals: number): bigint {
  assertDecimals(decimals);

  const match = /^(?<whole>\d+)(?:\.(?<fraction>\d+))?$/u.exec(amount.trim());
  const whole = match?.groups?.['whole'];
  const fraction = match?.groups?.['fraction'] ?? '';

  if (whole === undefined || fraction.length > decimals) {
    throw new Error('Token amount cannot be represented exactly with the configured decimals');
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, '0')}`);
}

/** Integer base units to an exact human-readable decimal string. */
export function baseUnitsToDecimalString(baseUnits: bigint | string, decimals: number): string {
  assertDecimals(decimals);

  const raw = typeof baseUnits === 'string' ? BigInt(baseUnits) : baseUnits;

  if (raw < 0n) {
    throw new Error('Base-unit amounts cannot be negative');
  }

  if (decimals === 0) {
    return raw.toString();
  }

  const digits = raw.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, -decimals);
  const fraction = digits.slice(-decimals).replace(/0+$/u, '');
  return fraction === '' ? whole : `${whole}.${fraction}`;
}

/** Grouped display form ("12,345.6") for an exact decimal string. */
export function formatDecimalString(value: string): string {
  const [whole = '0', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
