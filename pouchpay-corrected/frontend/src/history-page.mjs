/** Page history that already belongs to the signed-in account. */

export function pageHistory(items, { accountId = null, offset = 0, limit = 20 } = {}) {
  const source = Array.isArray(items) ? items : [];
  const owned = source.filter((item) => item && (accountId == null || item.accountId === accountId));
  const start = Math.max(0, offset);
  const size = Math.max(0, limit);
  return {
    items: owned.slice(start, start + size),
    total: owned.length,
    offset: start,
    limit: size,
    droppedForeign: source.length - owned.length,
    reconciliation: source.length === 0 ? 'unavailable' : 'listed',
  };
}
