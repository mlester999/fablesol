/** Formats an ISO timestamp as an explicit UTC string for player surfaces. */
export function formatUtc(value: string | null | undefined): string {
  if (value == null) return 'Not yet';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Not yet';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())} UTC`;
}
