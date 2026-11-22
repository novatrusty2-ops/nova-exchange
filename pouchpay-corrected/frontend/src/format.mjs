export function formatAmount(amount, maximumFractionDigits = 8) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '—';
  return amount.toLocaleString('en-US', { maximumFractionDigits, useGrouping: true });
}
