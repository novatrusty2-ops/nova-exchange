/**
 * Read-only API client. Posts that would move funds are refused in the browser.
 * The backend remains the authority for KYC, balances, and settlement.
 */

export const FINANCIAL_POSTS = [
  '/vault/swap',
  '/api/v1/ledger-bridge/settle',
  '/ledger-bridge/settle',
  '/trading/swap',
  '/api/v1/swap/build-tx',
  '/api/v1/amm/quote',
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
};

export function createClient({ fetchImpl = globalThis.fetch, baseUrl = '', timeoutMs = 8000 } = {}) {
  const inflight = new Map();

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && FINANCIAL_POSTS.some((prefix) => path === prefix || path.startsWith(prefix))) {
      return { ok: false, state: 'blocked', status: 0, data: null, error: 'financial_execution_disabled' };
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
          headers: { accept: 'application/json', ...(options.headers || {}) },
          body: options.body == null ? undefined : JSON.stringify(options.body),
          signal: options.signal || controller.signal,
        });
        const data = await response.json().catch(() => null);
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
    if (!previous || (previous.state !== 'timeout' && previous.state !== 'failure')) {
      return { ...previous, state: previous?.state || 'failure', recovered: false };
    }
    const next = await request(path);
    return { ...next, recovered: next.ok === true };
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
    rpc: (productGateway, body) => request(productGateway, { method: 'POST', body, idempotencyKey: `rpc:${body?.id}:${body?.method}` }),
  };
}
