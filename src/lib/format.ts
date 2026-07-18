export function formatCopper(value: number): string {
  return `${value.toLocaleString('en-US')} COPPER`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value * 100 >= 1 ? 0 : 1)}%`;
}
