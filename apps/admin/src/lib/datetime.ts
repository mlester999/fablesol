/**
 * datetime-local form helpers. Values are interpreted in the server's
 * timezone when parsed; both the entry forms and this module state that
 * plainly rather than pretending to be timezone-aware.
 */

export function toDatetimeLocal(value: string | null): string {
  if (value === null) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
