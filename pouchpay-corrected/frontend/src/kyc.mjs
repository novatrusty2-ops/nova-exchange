/**
 * Read an existing Sumsub review. Missing, pending, or RED never unlocks
 * sensitive actions. This does not create applicants or replace login.
 */

const SENSITIVE = new Set(['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge']);

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

export function gateAction(action, kyc) {
  if (!SENSITIVE.has(action)) {
    return { allowed: true, reason: null };
  }
  if (kyc?.allowsSensitive === true && kyc.state === 'approved') {
    return { allowed: true, reason: null };
  }
  return { allowed: false, reason: kyc?.state === 'unavailable' ? 'kyc_unavailable' : 'kyc_required' };
}
