/** Settlement copy follows authoritative backend evidence only. */

export function settlementLabel(record) {
  if (!record || typeof record !== 'object') return 'unconfirmed';
  const authoritative = record.evidence?.authoritative === true
    || record.source === 'Nova Online Bank / Ledger Bridge';
  if (record.settled === true && authoritative && record.success === true) return 'settled';
  if (record.settled === true) return 'unconfirmed';
  if (record.status === 'pending' || record.settlementStatus === 'pending') return 'pending';
  return 'unconfirmed';
}

export function visibleHistory(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.id && item.source)
    .map((item) => ({
      id: String(item.id),
      source: item.source,
      kind: item.kind || item.type || 'activity',
      settlement: settlementLabel(item),
    }));
}
