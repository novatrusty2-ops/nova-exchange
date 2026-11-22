/** Shape checks for the backend payloads this UI is allowed to trust. */

export function checkReservesStatus(body) {
  return has(body, ['success', 'account', 'verified', 'status'])
    && typeof body.verified === 'boolean'
    && body.success === true;
}

export function checkLedgerBridge(body) {
  return body && typeof body.success === 'boolean' && ('settled' in body || body.success === false || 'ready' in body);
}

export function checkVaultReserves(body) {
  return body
    && (body.status === 'LIVE' || body.status === 'STALE' || body.status === 'UNAVAILABLE')
    && Number(body.chainId) === 651940
    && Array.isArray(body.pools);
}

export function checkKyc(body, httpStatus) {
  if (httpStatus === 404) return { present: false, usable: false };
  if (!body) return { present: false, usable: false };
  const usable = body.provider === 'sumsub' && typeof body.verified === 'boolean';
  return { present: true, usable };
}

export function checkHistory(body) {
  if (body == null) return { present: false };
  return { present: Array.isArray(body.items) || Array.isArray(body) };
}

function has(body, keys) {
  return !!body && keys.every((key) => key in body);
}
