/**
 * Source observations from novabank apps/api. Customer calls stay off until
 * Codex confirms auth, authorization, schemas, and route registration.
 * Shapes below are the fields read in that source, not a promise they are stable.
 */

export const ROUTE_MATRIX = [
  { id: 'compliance-kyc-me', method: 'GET', path: '/compliance/kyc/me', auth: 'CurrentUser', status: 'source-only', customerCall: false, note: 'Observed fields: ok, kycStatus, kycTier, accountKind, kybStatus, limits, applicantId, reviewStatus, sanctionsStatus, sumsubConfigured' },
  { id: 'compliance-aml', method: 'GET', path: '/compliance/aml', auth: 'CurrentUser', status: 'source-only', customerCall: false },
  { id: 'compliance-kyb-me', method: 'GET', path: '/compliance/kyb/me', auth: 'CurrentUser', status: 'source-only', customerCall: false },
  { id: 'compliance-status', method: 'GET', path: '/compliance/status', auth: 'Public', status: 'source-only', customerCall: false, note: 'Public operational snapshot. Not a KYC decision.' },
  { id: 'compliance-tier', method: 'GET', path: '/compliance/tier', auth: 'OptionalJwt', status: 'source-only', customerCall: false },
  { id: 'compliance-tier-me', method: 'GET', path: '/compliance/tier/me', auth: 'OptionalJwt', status: 'source-only', customerCall: false },
  { id: 'compliance-cases', method: 'GET', path: '/compliance/cases', auth: 'OptionalJwt', status: 'blocked', customerCall: false, note: 'Admin case list. Unauthenticated callers receive an empty list in source. Not a wallet call.' },
  { id: 'transactions-list', method: 'GET', path: '/transactions', auth: 'CurrentUser', status: 'source-only', customerCall: false },
  { id: 'transactions-cards', method: 'GET', path: '/transactions/cards', auth: 'CurrentUser', status: 'source-only', customerCall: false },
  { id: 'fiat-tx-get', method: 'GET', path: '/fiat/transactions/:referenceNo', auth: 'unverified', status: 'blocked', customerCall: false, note: 'Read by reference. Auth not confirmed. Do not call from the wallet.' },
  { id: 'fiat-tx-settlements-get', method: 'GET', path: '/fiat/transactions/:referenceNo/crypto-settlements', auth: 'unverified', status: 'blocked', customerCall: false },
  { id: 'fiat-tx-create', method: 'POST', path: '/fiat/transactions', auth: 'unverified', status: 'blocked', customerCall: false },
  { id: 'fiat-tx-verify', method: 'POST', path: '/fiat/transactions/:referenceNo/verify', auth: 'unverified', status: 'blocked', customerCall: false },
  { id: 'fiat-tx-credit', method: 'POST', path: '/fiat/transactions/:referenceNo/credit', auth: 'unverified', status: 'blocked', customerCall: false },
  { id: 'fiat-tx-crypto-post', method: 'POST', path: '/fiat/transactions/:referenceNo/crypto-settlements', auth: 'unverified', status: 'blocked', customerCall: false },
  { id: 'kyc-start', method: 'POST', path: '/compliance/kyc/start', auth: 'CurrentUser', status: 'blocked', customerCall: false },
  { id: 'kyb-start', method: 'POST', path: '/compliance/kyb/start', auth: 'CurrentUser', status: 'blocked', customerCall: false },
  { id: 'sumsub-webhook', method: 'POST', path: '/webhooks/compliance/sumsub', auth: 'webhook-digest', status: 'blocked', customerCall: false, note: 'Inbound webhook. Not a frontend API.' },
  { id: 'local-kyc', method: 'GET', path: '/api/v1/kyc/sumsub/status', auth: 'unknown', status: 'missing-on-pouchpay-backend', customerCall: false },
  { id: 'local-activity', method: 'GET', path: '/api/v1/activity', auth: 'unknown', status: 'missing-on-pouchpay-backend', customerCall: false },
  { id: 'local-fiat-rails', method: 'GET', path: '/api/v1/nova-x/fiat-rails', auth: 'public-in-novabank-pr-997', status: 'missing-on-pouchpay-backend', customerCall: false },
];

const INACTIVE = ROUTE_MATRIX
  .filter((row) => row.status === 'blocked' || row.status === 'source-only')
  .map((row) => row.path.replace('/:referenceNo', ''));

export function isBlockedWalletPath(path) {
  return INACTIVE.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function customerRead() {
  return {
    ok: false,
    state: 'blocked',
    status: 0,
    data: null,
    error: 'codex_verification_required',
    retrySendsFunds: false,
  };
}
