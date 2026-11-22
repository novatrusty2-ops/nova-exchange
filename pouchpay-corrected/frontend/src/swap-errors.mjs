/** Backend swap and liquidity errors. The client does not retry a send. */

const MESSAGES = {
  kyc_decision_unavailable: { http: 503, message: 'Swaps are unavailable while identity checks are offline' },
  regional_swap_limit_unpriced: { http: 403, message: 'Swaps are paused: no verified price' },
  regional_swap_limit: { http: 403, message: 'Swap limit reached' },
  settlement_tx_already_used: { http: 409, message: 'Transaction already used' },
};

export function swapErrorMessage(code, httpStatus) {
  const known = MESSAGES[code];
  if (!known) return { code: code || null, message: 'This action is unavailable', retrySendsFunds: false };
  if (httpStatus != null && httpStatus !== known.http) {
    return { code, message: 'This action is unavailable', retrySendsFunds: false };
  }
  return { code, message: known.message, http: known.http, retrySendsFunds: false };
}
