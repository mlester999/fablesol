/** Bounded, type-safe FormData reads shared by every server action. */
export function readFormString(
  formData: FormData,
  field: string,
  maximumLength: number,
): string | undefined {
  const value = formData.get(field);

  if (typeof value !== 'string' || value.length > maximumLength) {
    return undefined;
  }

  return value;
}

export function readTrimmedFormString(
  formData: FormData,
  field: string,
  maximumLength: number,
): string | undefined {
  const value = readFormString(formData, field, maximumLength)?.trim();
  return value ? value : undefined;
}
