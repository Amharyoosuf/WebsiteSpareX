// Prices are stored as whole rupees (integers).
export function formatLKR(amount: number): string {
  return "Rs " + new Intl.NumberFormat("en-LK").format(Math.round(amount || 0));
}

export function toInt(value: unknown, fallback = 0): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
}
