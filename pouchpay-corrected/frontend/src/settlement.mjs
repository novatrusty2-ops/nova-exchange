/** Settlement copy follows authoritative backend evidence only. */

import { interpretSuperBridgeTransfer, SUPER_BRIDGE_STATES } from './super-bridge.mjs';

export function settlementLabel(record) {
  if (!record || typeof record !== 'object') return 'unconfirmed';
  if (record.reorg === true || record.reorganized === true || record.status === 'reorg' || record.settlementStatus === 'reorganization') {
    return 'reorganization';
  }
  if (record.status === 'failed' || record.settlementStatus === 'failed') return 'failed';
  if (record.bridgeKind === 'super-bridge' || record.source === 'Nova Super Bridge') {
    const bridge = interpretSuperBridgeTransfer(record, { httpStatus: record.httpStatus ?? 200 });
    if (bridge.state === 'confirmed') return 'confirmed';
    if (bridge.state === 'failed') return 'failed';
    if (bridge.state === 'requires_reconciliation') return 'unconfirmed';
    if (bridge.state === 'confirming' || bridge.state === 'submitted') return 'pending';
    if (bridge.state === 'route_unavailable' || bridge.state === 'unsupported_route') return 'unavailable';
    if (bridge.state === 'awaiting_user_authorization') return 'pending';
    if (bridge.state === 'quote_available') return 'unconfirmed';
  }
  const authoritative = record.evidence?.authoritative === true
    || record.source === 'Nova Online Bank / Ledger Bridge';
  if (record.settled === true && authoritative && record.success === true) return 'confirmed';
  if (record.settled === true) return 'unconfirmed';
  if (record.status === 'pending' || record.settlementStatus === 'pending') return 'pending';
  return 'unconfirmed';
}

export const STATUS_TERMS = [
  'submitted',
  'pending',
  'confirmed',
  'failed',
  'unconfirmed',
  'reorganization',
  'expired',
  'unavailable',
  ...SUPER_BRIDGE_STATES,
];

/** A submitted request is not a completed settlement. */
export function confirmationState(record) {
  if (!record || typeof record !== 'object') {
    return { request: 'not_submitted', settlement: 'unavailable', completed: false };
  }
  if (record.bridgeKind === 'super-bridge' || record.source === 'Nova Super Bridge') {
    const bridge = interpretSuperBridgeTransfer(record, {
      httpStatus: record.httpStatus ?? 200,
      clientState: record.clientState ?? null,
    });
    const submitted = bridge.state === 'submitted'
      || bridge.state === 'confirming'
      || bridge.state === 'confirmed'
      || bridge.state === 'requires_reconciliation'
      || record.submitted === true;
    return {
      request: submitted ? 'submitted' : 'not_submitted',
      settlement: settlementLabel(record),
      bridgeState: bridge.state,
      completed: bridge.completed === true,
      autoRetry: false,
    };
  }
  const submitted = record.submitted === true || record.requestStatus === 'submitted';
  const settlement = settlementLabel(record);
  return {
    request: submitted ? 'submitted' : 'not_submitted',
    settlement,
    completed: settlement === 'confirmed',
    autoRetry: false,
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
