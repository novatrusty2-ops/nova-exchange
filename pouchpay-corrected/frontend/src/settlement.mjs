/** Settlement copy follows authoritative backend evidence only. */

export function settlementLabel(record) {
  if (!record || typeof record !== 'object') return 'unconfirmed';
  if (record.reorg === true || record.reorganized === true || record.status === 'reorg' || record.settlementStatus === 'reorganization') {
    return 'reorganization';
  }
  if (record.status === 'failed' || record.settlementStatus === 'failed') return 'failed';
  const authoritative = record.evidence?.authoritative === true
    || record.source === 'Nova Online Bank / Ledger Bridge';
  if (record.settled === true && authoritative && record.success === true) return 'confirmed';
  if (record.settled === true) return 'unconfirmed';
  if (record.status === 'pending' || record.settlementStatus === 'pending') return 'pending';
  return 'unconfirmed';
}

export const STATUS_TERMS = ['submitted', 'pending', 'confirmed', 'failed', 'unconfirmed', 'reorganization', 'expired', 'unavailable'];

/** A submitted request is not a completed settlement. */
export function confirmationState(record) {
  if (!record || typeof record !== 'object') {
    return { request: 'not_submitted', settlement: 'unavailable', completed: false };
  }
  const submitted = record.submitted === true || record.requestStatus === 'submitted';
  const settlement = settlementLabel(record);
  return {
    request: submitted ? 'submitted' : 'not_submitted',
    settlement,
    completed: settlement === 'confirmed',
  };
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
