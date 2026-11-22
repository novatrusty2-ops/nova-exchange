/**
 * Read an existing Sumsub review. Missing, pending, or RED never unlocks
 * sensitive actions. This does not create applicants or replace login.
 */

const SENSITIVE = new Set(['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge', 'liquidity']);

export function interpretSumsub(body, httpStatus = 200) {
  if (httpStatus === 404 || body == null || body.success === false) {
    return { state: 'unavailable', allowsSensitive: false, provider: 'sumsub' };
  }
  const reviewStatus = body.reviewStatus ?? body.review?.reviewStatus ?? null;
  const reviewAnswer = body.reviewAnswer ?? body.reviewResult?.reviewAnswer ?? body.review?.reviewResult?.reviewAnswer ?? null;
  const approved = body.provider === 'sumsub'
    && body.verified === true
    && reviewStatus === 'completed'
    && reviewAnswer === 'GREEN';
  return {
    state: approved ? 'approved' : 'blocked',
    allowsSensitive: approved,
    provider: 'sumsub',
    reviewStatus,
    reviewAnswer,
  };
}

export function presentKyc(session, body, httpStatus, now = Date.now()) {
  if (!session?.token || typeof session.token !== 'string' || session.token.length === 0) {
    return {
      state: 'unavailable',
      allowsSensitive: false,
      provider: 'sumsub',
      display: 'Sign in to view KYC status',
    };
  }
  const expiresAt = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
  if (httpStatus === 401 || (Number.isFinite(expiresAt) && expiresAt <= now)) {
    return { state: 'expired', allowsSensitive: false, provider: 'sumsub', display: 'Session expired' };
  }
  if (httpStatus === 503 || httpStatus === 0) {
    return { state: 'unavailable', allowsSensitive: false, provider: 'sumsub', display: 'KYC status unavailable' };
  }
  const parsed = interpretSumsub(body, httpStatus);
  const jurisdiction = body?.jurisdiction;
  if (jurisdiction?.restricted === true || (jurisdiction && (jurisdiction.verified !== true || jurisdiction.source !== 'sumsub'))) {
    return { ...parsed, state: 'restricted', allowsSensitive: false, display: 'Restricted jurisdiction' };
  }
  if (parsed.reviewAnswer === 'RED') {
    return { ...parsed, state: 'rejected', allowsSensitive: false, display: 'Verification rejected' };
  }
  if (parsed.reviewStatus === 'pending' || parsed.reviewAnswer === 'PENDING') {
    return { ...parsed, state: 'pending', allowsSensitive: false, display: 'Verification pending' };
  }
  if (parsed.state === 'approved') {
    if (jurisdiction?.verified !== true || jurisdiction?.source !== 'sumsub') {
      return { ...parsed, state: 'unavailable', allowsSensitive: false, display: 'Jurisdiction not confirmed' };
    }
    return { ...parsed, display: 'Verified' };
  }
  const display = parsed.state === 'blocked' ? 'Not verified' : 'KYC status unavailable';
  return { ...parsed, display };
}

export function gateAction(action, kyc) {
  if (!SENSITIVE.has(action)) {
    return { allowed: true, reason: null };
  }
  if (kyc?.allowsSensitive === true && kyc.state === 'approved') {
    return { allowed: true, reason: null };
  }
  const reason = {
    unavailable: 'kyc_unavailable',
    expired: 'session_expired',
    rejected: 'kyc_rejected',
    pending: 'kyc_required',
    restricted: 'jurisdiction_restricted',
  }[kyc?.state] || 'kyc_required';
  return { allowed: false, reason };
}
