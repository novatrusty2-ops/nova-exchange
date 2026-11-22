/** Truncate toward zero so a display never rounds a balance or quote upward. */
export function truncateAmount(amount, places = 8) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || places < 0) return null;
  const text = amount.toFixed(Math.min(places + 8, 20));
  const [whole, frac = ''] = text.split('.');
  const cut = frac.slice(0, places).replace(/0+$/, '');
  return cut ? Number(`${whole}.${cut}`) : Number(whole);
}

export function formatAmount(amount, maximumFractionDigits = 8) {
  const truncated = truncateAmount(amount, maximumFractionDigits);
  if (truncated == null) return '—';
  return truncated.toLocaleString('en-US', { maximumFractionDigits, useGrouping: true });
}
