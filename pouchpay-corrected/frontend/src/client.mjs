/**
 * Read-only API client. Posts that would move funds are refused in the browser.
 * The backend remains the authority for KYC, balances, and settlement.
 */

import { customerRead, isBlockedWalletPath } from './bank-contracts.mjs';

export const FINANCIAL_POSTS = [
  '/vault/swap',
  '/api/v1/ledger-bridge/settle',
  '/ledger-bridge/settle',
  '/trading/swap',
  '/api/v1/swap/build-tx',
  '/api/v1/amm/quote',
  '/api/v1/chains/super-bridge/transfer',
  '/chains/super-bridge/transfer',
];

const READS = {
  health: '/health',
  reserves: '/api/v1/reserves/status',
  ledgerBridge: '/api/v1/ledger-bridge/status',
  vaultReserves: '/vault/reserves',
  liquidity: '/api/v1/liquidity',
  pools: '/api/v1/pools/tvl',
  kyc: '/api/v1/kyc/sumsub/status',
  history: '/api/v1/activity',
  fiatRails: '/api/v1/nova-x/fiat-rails',
  superBridge: '/api/v1/chains/super-bridge',
};

export function createClient({ fetchImpl = globalThis.fetch, baseUrl = '', timeoutMs = 8000, session = null } = {}) {
  const inflight = new Map();

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    if (isBlockedWalletPath(path) || (method !== 'GET' && FINANCIAL_POSTS.some((prefix) => path === prefix || path.startsWith(prefix)))) {
      return { ok: false, state: 'blocked', status: 0, data: null, error: 'financial_execution_disabled', retrySendsFunds: false };
    }
    const key = options.idempotencyKey || null;
    if (key && inflight.has(key)) {
      return { ok: false, state: 'duplicate', status: 0, data: null, error: 'duplicate_request' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const work = (async () => {
      try {
        const response = await fetchImpl(`${baseUrl}${path}`, {
          method,
          headers: {
            accept: 'application/json',
            ...(session?.token ? { authorization: `Bearer ${session.token}` } : {}),
            ...(options.headers || {}),
          },
          body: options.body == null ? undefined : JSON.stringify(options.body),
          signal: options.signal || controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          return { ok: false, state: 'expired', status: 401, data, error: 'session_expired' };
        }
        if (response.status === 503) {
          const maintenance = data?.code === 'maintenance';
          return { ok: false, state: maintenance ? 'maintenance' : 'unavailable', status: 503, data, error: maintenance ? 'maintenance' : 'unavailable' };
        }
        if (!response.ok) {
          return { ok: false, state: 'failure', status: response.status, data, error: `http_${response.status}` };
        }
        return { ok: true, state: 'ready', status: response.status, data, error: null };
      } catch (error) {
        const timedOut = error?.name === 'AbortError' || error?.name === 'TimeoutError';
        return {
          ok: false,
          state: timedOut ? 'timeout' : 'failure',
          status: 0,
          data: null,
          error: timedOut ? 'timeout' : (error?.message || 'network'),
        };
      } finally {
        clearTimeout(timer);
        if (key) inflight.delete(key);
      }
    })();

    if (key) inflight.set(key, work);
    return work;
  }

  async function recover(path, previous) {
    if (FINANCIAL_POSTS.some((prefix) => path === prefix || path.startsWith(prefix))) {
      return { ok: false, state: 'blocked', status: 0, data: null, error: 'financial_execution_disabled', recovered: false, retrySendsFunds: false };
    }
    if (!previous || (previous.state !== 'timeout' && previous.state !== 'failure')) {
      return { ...previous, state: previous?.state || 'failure', recovered: false, retrySendsFunds: false };
    }
    const next = await request(path);
    return { ...next, recovered: next.ok === true, retrySendsFunds: false };
  }

  return {
    request,
    recover,
    reads: READS,
    health: () => request(READS.health),
    reserves: () => request(READS.reserves),
    ledgerBridge: () => request(READS.ledgerBridge),
    vaultReserves: () => request(READS.vaultReserves),
    liquidity: () => request(READS.liquidity),
    pools: () => request(READS.pools),
    kyc: () => request(READS.kyc),
    history: () => request(READS.history),
    fiatRails: () => request(READS.fiatRails),
    superBridge: () => request(READS.superBridge),
    /** Transfer remains blocked; ambiguous outcomes must not be retried. */
    superBridgeTransfer: () => request(READS.superBridge.replace(/\/$/, '') + '/transfer', {
      method: 'POST',
      body: {},
    }),
    customerKycMe: () => customerRead(),
    customerHistory: () => customerRead(),
    rpc: (productGateway, body) => request(productGateway, { method: 'POST', body, idempotencyKey: `rpc:${body?.id}:${body?.method}` }),
  };
}
