import assert from 'node:assert/strict';
import test from 'node:test';
import { PRODUCTS, assertRpcIsolation, READ_ONLY_RPC_METHODS } from '../src/networks.mjs';
import { listTokens, tokensByKind, rapidTokens, TOKEN_KINDS } from '../src/catalog.mjs';
import { priceLabel, holdingValue, UNPRICED } from '../src/pricing.mjs';
import { interpretSumsub, gateAction } from '../src/kyc.mjs';
import { settlementLabel, visibleHistory } from '../src/settlement.mjs';
import { mergeAccount } from '../src/accounts.mjs';
import { evaluateRoute, quoteSwap } from '../src/routes.mjs';
import { createClient } from '../src/client.mjs';
import { checkReservesStatus, checkLedgerBridge, checkVaultReserves, checkKyc } from '../src/contract.mjs';
import { loadProductScreen, renderProduct } from '../src/screens.mjs';
import { assessAndroid } from '../src/android-readiness.mjs';

const all = listTokens('pouchpay').find((token) => token.id === 'ALL');
const wbtc = listTokens('pouchpay').find((token) => token.id === 'WBTC');
const usdc = listTokens('pouchpay').find((token) => token.id === 'USDC');

test('products keep separate chain ids and reject the lab chain', () => {
  assert.equal(PRODUCTS.pouchpay.chainId, 651940);
  assert.equal(PRODUCTS['nova-plus'].chainId, 33001);
  assert.equal(PRODUCTS['nova-x'].chainId, 22016);
  assert.equal(PRODUCTS.pouchpay.rpcGateway, null);
  assert.notEqual(PRODUCTS['nova-plus'].rpcGateway, PRODUCTS['nova-x'].rpcGateway);
  assert.equal(assertRpcIsolation('nova-x', 922016).ok, false);
  assert.equal(assertRpcIsolation('nova-x', 33001).reason, 'chain_mismatch');
  assert.equal(assertRpcIsolation('pouchpay', 651940).ok, true);
  assert.equal(READ_ONLY_RPC_METHODS.has('eth_sendTransaction'), false);
});

test('catalog covers every kind that is actually supported and leaves rapid empty', () => {
  for (const kind of TOKEN_KINDS) tokensByKind('pouchpay', kind);
  assert.ok(tokensByKind('pouchpay', 'catalog').length >= 2);
  assert.equal(tokensByKind('pouchpay', 'native').length, 2);
  assert.deepEqual(tokensByKind('pouchpay', 'smart').map((token) => token.id), ['ALL']);
  assert.equal(tokensByKind('pouchpay', 'stable').length, 2);
  assert.ok(tokensByKind('pouchpay', 'wrapped').some((token) => token.id === 'WALL'));
  assert.equal(tokensByKind('pouchpay', 'rapid').length, 0);
  assert.equal(rapidTokens().length, 0);
  assert.equal(tokensByKind('nova-plus', 'smart').length, 0);
  const custom = listTokens('pouchpay', [{ address: '0x1111111111111111111111111111111111111111', symbol: 'MY' }]);
  assert.equal(custom.at(-1).kind, 'custom');
  assert.equal(custom.at(-1).supported, false);
  assert.equal(listTokens('nova-x').find((token) => token.kind === 'native').symbol, null);
});

test('unverified, hardcoded, and wrapped-alias prices render as Unpriced', () => {
  assert.equal(priceLabel(wbtc, { verified: true, source: 'hardcoded', priceUsd: 65000, chainId: 651940, assetId: 'WBTC' }).label, UNPRICED);
  assert.equal(priceLabel(wbtc, { verified: true, source: 'backend-oracle', priceUsd: 65000, chainId: 651940, assetId: 'WBTC', canonicalSymbol: 'BTC', mapsCanonicalAsset: true }).reason, 'wrapped_alias_rejected');
  assert.equal(priceLabel(usdc, { verified: true, source: 'assumed-peg', priceUsd: 1, chainId: 651940, assetId: 'USDC' }).label, UNPRICED);
  assert.equal(priceLabel(all, null).label, UNPRICED);
  const verified = { verified: true, source: 'backend-oracle', priceUsd: 0.02, chainId: 651940, assetId: 'ALL', address: all.address };
  assert.equal(holdingValue(all, 2, verified).usd, 0.04);
  assert.equal(holdingValue(usdc, 10, null).valueLabel, UNPRICED);
});

test('Sumsub gating blocks sensitive actions unless the backend verified GREEN', () => {
  assert.equal(interpretSumsub(null, 404).allowsSensitive, false);
  assert.equal(interpretSumsub({ provider: 'sumsub', reviewStatus: 'completed', reviewAnswer: 'GREEN', verified: false }).state, 'blocked');
  const approved = interpretSumsub({ provider: 'sumsub', reviewStatus: 'completed', reviewAnswer: 'GREEN', verified: true });
  assert.equal(approved.allowsSensitive, true);
  assert.equal(gateAction('withdraw', interpretSumsub({ success: false })).reason, 'kyc_unavailable');
  assert.equal(gateAction('swap', approved).allowed, true);
});

test('settlement and history ignore unaudited settled flags', () => {
  assert.equal(settlementLabel({ settled: true, success: true }), 'unconfirmed');
  assert.equal(settlementLabel({
    settled: true,
    success: true,
    source: 'Nova Online Bank / Ledger Bridge',
    evidence: { authoritative: true },
  }), 'confirmed');
  assert.equal(settlementLabel({ status: 'pending', settled: false }), 'pending');
  const rows = visibleHistory([{ id: 'a', source: 'bank', settled: true }, { settled: true }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].settlement, 'unconfirmed');
});

test('verified accounts are preserved when a later payload is only declared', () => {
  const kept = mergeAccount(
    { account: '6572', verified: true, balances: { ALL: 3 }, status: 'verified by bank API' },
    { account: '6572', verified: false, balances: { ALL: 999 }, status: 'declared, not verified' },
  );
  assert.equal(kept.balances.ALL, 3);
  assert.equal(kept.preserved, true);
  assert.equal(kept.declared.balances.ALL, 999);
});

test('routes stay off when unfunded, unsupported, or missing a fee', () => {
  const kyc = { state: 'approved', allowsSensitive: true };
  const token = { ...usdc, balance: 0 };
  assert.equal(evaluateRoute({ action: 'bridge', token, kyc, bridge: { routes: [], alltraCrossChainBridgeConfigured: false } }).reason, 'unsupported');
  assert.equal(evaluateRoute({ action: 'withdraw', token, kyc }).reason, 'unfunded');
  assert.equal(evaluateRoute({
    action: 'swap',
    token: { ...usdc, supported: true },
    kyc,
    pool: { status: 'LIVE', tokenReserve: 0, allReserve: 10 },
    feeBps: 30,
    slippageBps: 50,
  }).reason, 'unfunded');
  const live = { status: 'LIVE', tokenReserve: 100, allReserve: 50 };
  assert.equal(evaluateRoute({ action: 'swap', token: usdc, kyc, pool: live, feeBps: null, slippageBps: 50 }).reason, 'fee_unavailable');
  const quote = quoteSwap({ amountIn: 10, pool: live, feeBps: 30, slippageBps: 50 });
  assert.equal(quote.enabled, true);
  assert.ok(quote.minOut < quote.amountOut);
  assert.equal(evaluateRoute({ action: 'swap', token: listTokens('pouchpay', [{ address: '0x2222222222222222222222222222222222222222' }]).at(-1), kyc }).reason, 'unsupported');
});

test('client blocks financial posts, duplicates, and timeouts', async () => {
  let calls = 0;
  const fetchImpl = (_url, init) => {
    calls += 1;
    if (init.signal?.aborted) {
      const error = new Error('aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({ ok: true }) }), 30);
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };
  const client = createClient({ fetchImpl, timeoutMs: 1000 });
  const blocked = await client.request('/vault/swap', { method: 'POST', body: { amount: 1 } });
  assert.equal(blocked.error, 'financial_execution_disabled');
  assert.equal(calls, 0);

  const first = client.request('/health', { idempotencyKey: 'same' });
  const duplicate = await client.request('/health', { idempotencyKey: 'same' });
  assert.equal(duplicate.state, 'duplicate');
  assert.equal((await first).ok, true);

  const slow = createClient({
    timeoutMs: 5,
    fetchImpl: (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    }),
  });
  const timed = await slow.health();
  assert.equal(timed.state, 'timeout');
  const recovered = await slow.recover('/health', timed);
  assert.equal(recovered.state, 'timeout');
  assert.equal(recovered.recovered, false);
});

test('API contract fixtures match the backend bodies the screens read', () => {
  assert.equal(checkReservesStatus({
    success: true,
    account: '6572',
    verified: false,
    status: 'declared, not verified',
  }), true);
  assert.equal(checkLedgerBridge({ success: false, settled: false, ready: false }), true);
  assert.equal(checkVaultReserves({ status: 'LIVE', chainId: 651940, pools: [] }), true);
  assert.equal(checkVaultReserves({ status: 'LIVE', chainId: 1, pools: [] }), false);
  assert.deepEqual(checkKyc(null, 404), { present: false, usable: false });
  assert.deepEqual(checkKyc({ provider: 'sumsub', verified: false }, 200), { present: true, usable: true });
});

test('screens keep declared reserves unpriced and disable every money route', async () => {
  const client = {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: { status: 'ok' } }),
    reserves: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: { success: true, account: '6572', verified: false, status: 'declared, not verified', balances: { ALL: 1e12 } },
    }),
    ledgerBridge: async () => ({ ok: true, state: 'ready', status: 200, data: { success: false, ready: false, settled: false } }),
    vaultReserves: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: { status: 'LIVE', chainId: 651940, pools: [{ token: 'USDC', tokenReserve: 20, allReserve: 100 }], warnings: [] },
    }),
    kyc: async () => ({ ok: false, state: 'failure', status: 404, data: null }),
    history: async () => ({ ok: true, state: 'ready', status: 200, data: { items: [{ id: 'tx1', source: 'bank', status: 'pending', settled: false }] } }),
  };
  const screen = await loadProductScreen('pouchpay', client, { previousAccount: { account: '6572', verified: true, balances: { ALL: 4 }, status: 'verified by bank API' } });
  assert.equal(screen.account.balances.ALL, 4);
  assert.equal(screen.tokens.find((token) => token.id === 'ALL').value.valueLabel, UNPRICED);
  assert.equal(screen.settlement, 'unconfirmed');
  assert.equal(screen.history[0].settlement, 'pending');
  assert.equal(screen.feeLabel, 'Fee unavailable');
  for (const token of screen.tokens) {
    for (const route of Object.values(token.routes)) assert.equal(route.enabled, false);
  }
  const html = renderProduct(screen);
  assert.equal(html.includes('100,000,000,000'), false);
  assert.equal(html.includes('FULLY ROUTED'), false);
  assert.equal(html.includes('Unpriced'), true);
  assert.equal(html.includes('data-kyc="unavailable"'), true);
  assert.equal(screen.kinds.wrapped > 0, true);
  assert.equal(screen.rapidSupported, 0);
});

test('a timeout on KYC is surfaced and can be distinguished from a ready screen', async () => {
  const client = {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: {} }),
    reserves: async () => ({ ok: false, state: 'timeout', status: 0, error: 'timeout', data: null }),
    ledgerBridge: async () => ({ ok: false, state: 'timeout', status: 0, error: 'timeout', data: null }),
    vaultReserves: async () => ({ ok: false, state: 'timeout', data: null }),
    kyc: async () => ({ ok: false, state: 'timeout', status: 0, error: 'timeout', data: null }),
    history: async () => ({ ok: false, state: 'timeout', status: 0, error: 'timeout', data: null }),
  };
  const screen = await loadProductScreen('nova-x', client);
  assert.equal(screen.phase, 'timeout');
  assert.equal(screen.product.chainId, 22016);
  assert.match(renderProduct(screen), /data-phase="timeout"/);
});

test('android readiness flags missing PouchPay wrapper and unpublished version codes', () => {
  const report = assessAndroid({
    files: [
      'android-wrappers/nova-x/app/build.gradle',
      'android-wrappers/nova-x/app/src/main/AndroidManifest.xml',
      'android-wrappers/nova-x/app/src/main/res/xml/network_security_config.xml',
      'android-wrappers/nova-plus/app/build.gradle',
      'android-wrappers/nova-plus/app/src/main/AndroidManifest.xml',
      'android-wrappers/nova-plus/app/src/main/res/xml/network_security_config.xml',
    ],
    keystorePropertyNames: {
      'nova-x': ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'],
      'nova-plus': ['storeFile', 'storePassword', 'keyAlias', 'keyPassword'],
    },
    cleartextDenied: { 'nova-x': true, 'nova-plus': true },
    versionCodes: { 'nova-x': 1, 'nova-plus': 1 },
    targetSdks: { 'nova-x': 35, 'nova-plus': 35 },
    androidWrappersGitignored: true,
  });
  assert.equal(report.reports.find((item) => item.app === 'pouchpay').present, false);
  assert.equal(report.reports.find((item) => item.app === 'nova-x').playReady, true);
  assert.ok(report.blockers.some((item) => item.includes('gitignored')));
  assert.ok(report.blockers.some((item) => item.includes('pouchpay')));
});
