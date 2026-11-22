import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPER_BRIDGE_EVM_ROUTES,
  availableSuperBridgeRoutes,
  evaluateSuperBridgeRoute,
  interpretSuperBridgeTransfer,
  shouldAutoRetrySuperBridge,
  buildSuperBridgeTransferBody,
  superBridgeRouteMatrix,
  SUPER_BRIDGE_TRANSFER_API,
} from '../src/super-bridge.mjs';
import {
  listPopularTokens,
  popularTokenBySymbol,
  requireExactTokenIdentity,
  POPULAR_TOKEN_SYMBOLS,
} from '../src/trading-tokens.mjs';
import {
  selectToken,
  visualizeRoute,
  presentQuote,
  presentSwapHistory,
  trackTransactionStatus,
  rejectEthWethConfusion,
  buildTradingPanel,
} from '../src/trading.mjs';
import { quotePreview } from '../src/quotes.mjs';
import { presentKyc, gateAction } from '../src/kyc.mjs';
import { createClient, FINANCIAL_POSTS } from '../src/client.mjs';
import { evaluateRoute } from '../src/routes.mjs';
import { mergeAccount, displayAccountReserves, ACCOUNT_6572 } from '../src/accounts.mjs';
import { pageHistory } from '../src/history-page.mjs';
import { crossAppConsistencyReport } from '../src/app-consistency.mjs';
import { loadProductScreen, renderProduct } from '../src/screens.mjs';
import { isAlltraWeth } from '../src/price-identity.mjs';

const approvedKyc = {
  state: 'approved',
  allowsSensitive: true,
  provider: 'sumsub',
  display: 'Verified',
};

function mockClient(overrides = {}) {
  return {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: { ok: true } }),
    reserves: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: { success: true, account: '6572', verified: true, status: 'verified by bank API', balances: {} },
    }),
    ledgerBridge: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: { success: true, ready: false, settled: false },
    }),
    vaultReserves: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: { status: 'UNAVAILABLE', chainId: 651940, pools: [] },
    }),
    kyc: async () => ({
      ok: true,
      state: 'ready',
      status: 200,
      data: {
        provider: 'sumsub',
        verified: true,
        reviewStatus: 'completed',
        reviewAnswer: 'GREEN',
        jurisdiction: { source: 'sumsub', verified: true },
      },
    }),
    history: async () => ({ ok: true, state: 'ready', status: 200, data: { items: [] } }),
    fiatRails: async () => ({ ok: false, state: 'unavailable', status: 404, data: null }),
    ...overrides,
  };
}

test('popular tokens require exact chain id and contract address; HHE3 is unsupported', () => {
  assert.deepEqual(POPULAR_TOKEN_SYMBOLS, ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'UNI', 'LINK', 'AAVE', 'HHE3']);
  const tokens = listPopularTokens();
  assert.equal(tokens.length, 9);
  for (const symbol of ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'UNI', 'LINK', 'AAVE']) {
    const selected = selectToken(symbol);
    assert.equal(selected.ok, true, symbol);
    assert.ok(Number.isFinite(selected.identity.chainId), symbol);
    if (symbol === 'ETH') assert.equal(selected.identity.native, true);
    else assert.match(selected.identity.address, /^0x[0-9a-f]{40}$/);
  }
  const hhe3 = popularTokenBySymbol('HHE3');
  assert.equal(requireExactTokenIdentity(hhe3).reason, 'missing_contract_address');
  assert.equal(selectToken('HHE3').ok, false);
});

test('unsupported HHE3 routes and missing liquidity stay closed', () => {
  const hhe3 = popularTokenBySymbol('HHE3');
  const usdc = popularTokenBySymbol('USDC');
  const unsupported = visualizeRoute({ fromToken: hhe3, toToken: usdc, liquidityEvidence: { authoritative: true, status: 'available' } });
  assert.equal(unsupported.reason, 'unsupported_hhe3_route');
  const missing = visualizeRoute({
    fromToken: popularTokenBySymbol('ETH'),
    toToken: usdc,
    liquidityEvidence: null,
  });
  assert.equal(missing.reason, 'missing_liquidity');
  assert.equal(
    evaluateRoute({
      action: 'swap',
      token: { ...hhe3, supported: false },
      kyc: approvedKyc,
      feeBps: 30,
      slippageBps: 50,
      pool: { status: 'LIVE', tokenReserve: 1, allReserve: 1 },
    }).reason,
    'unsupported',
  );
});

test('missing contract addresses and expired quotes never become executable', () => {
  assert.equal(requireExactTokenIdentity({ symbol: 'X', chainId: 1, address: null, native: false, contractVerified: true }).ok, false);
  const now = Date.parse('2026-11-22T12:00:00Z');
  const expired = quotePreview({
    authoritative: true,
    status: 'quoted',
    amountOut: 10,
    slippageBps: 50,
    expiresAt: '2026-11-22T11:00:00Z',
  }, now);
  assert.equal(expired.state, 'expired');
  assert.equal(expired.executable, false);
  const invented = quotePreview({
    authoritative: true,
    status: 'quoted',
    amountOut: 10,
    slippageBps: 50,
    invented: true,
  }, now);
  assert.equal(invented.state, 'unavailable');
  const presented = presentQuote(
    { authoritative: true, status: 'quoted', amountOut: 2, slippageBps: 50 },
    null,
    50,
    now,
  );
  assert.equal(presented.executable, false);
  assert.equal(presented.fees.feeLabel, 'Fee unavailable');
});

test('unverified KYC and failed authorization block financial actions', () => {
  const session = { token: 'live-token', expiresAt: '2099-01-01T00:00:00Z' };
  const unverified = presentKyc(session, {
    provider: 'sumsub',
    verified: false,
    reviewStatus: 'pending',
    reviewAnswer: 'PENDING',
    jurisdiction: { source: 'sumsub', verified: true },
  }, 200);
  assert.equal(unverified.allowsSensitive, false);
  assert.equal(gateAction('bridge', unverified).allowed, false);
  assert.equal(gateAction('swap', unverified).reason, 'kyc_required');

  const authFailed = interpretSuperBridgeTransfer({ status: 'failed' }, { httpStatus: 403 });
  assert.equal(authFailed.state, 'awaiting_user_authorization');
  assert.equal(authFailed.autoRetry, false);
});

test('ambiguous bridge timeouts require reconciliation and never auto-retry', () => {
  const timedOut = interpretSuperBridgeTransfer(null, { clientState: 'timeout' });
  assert.equal(timedOut.state, 'requires_reconciliation');
  assert.equal(shouldAutoRetrySuperBridge(timedOut), false);
  const ambiguous = interpretSuperBridgeTransfer({ status: 'confirmed', settled: true, success: true });
  assert.equal(ambiguous.state, 'requires_reconciliation');
  assert.equal(shouldAutoRetrySuperBridge(ambiguous), false);
  const confirming = interpretSuperBridgeTransfer({ status: 'confirming', txHash: '0x' + 'ab'.repeat(32) });
  assert.equal(confirming.state, 'confirming');
  assert.equal(shouldAutoRetrySuperBridge(confirming), false);
});

test('duplicate submissions and blocked transfer POSTs stay fail-closed', async () => {
  assert.ok(FINANCIAL_POSTS.includes(SUPER_BRIDGE_TRANSFER_API));
  const client = createClient({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ status: 'submitted' }) }),
  });
  const blocked = await client.superBridgeTransfer();
  assert.equal(blocked.state, 'blocked');
  assert.equal(blocked.error, 'financial_execution_disabled');

  let calls = 0;
  const dupClient = createClient({
    fetchImpl: async () => {
      calls += 1;
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
  });
  const first = dupClient.request('/health', { idempotencyKey: 'same' });
  const second = await dupClient.request('/health', { idempotencyKey: 'same' });
  assert.equal(second.state, 'duplicate');
  await first;
  assert.equal(calls, 1);
});

test('cross-account history access is dropped; account 6572 is not independently verified reserves', () => {
  const page = pageHistory([
    { id: 'a', source: 'bank', accountId: '6572' },
    { id: 'b', source: 'bank', accountId: '9999' },
  ], { accountId: '6572' });
  assert.equal(page.items.length, 1);
  assert.equal(page.droppedForeign, 1);

  const account = mergeAccount(null, {
    account: ACCOUNT_6572,
    verified: true,
    status: 'verified by bank API',
    balances: { ALL: 1 },
    independentlyVerifiedReserves: true,
  });
  assert.equal(account.independentlyVerifiedReserves, false);
  assert.equal(displayAccountReserves(account).independentlyVerified, false);
  assert.match(displayAccountReserves(account).label, /not independently verified/);
});

test('incorrect ETH/WETH representation is rejected', () => {
  const eth = { chainId: 1, native: true, symbol: 'ETH' };
  const alltraWeth = {
    chainId: 651940,
    address: '0x798f6762bb40d6801a593459d08f890603d3979c',
    symbol: 'WETH',
  };
  assert.equal(isAlltraWeth(alltraWeth), true);
  assert.equal(rejectEthWethConfusion(eth, alltraWeth), true);
  assert.equal(rejectEthWethConfusion(eth, { chainId: 1, native: true, symbol: 'ETH' }), false);
});

test('historical Super Bridge routes without deployed contracts remain disabled', () => {
  assert.equal(availableSuperBridgeRoutes().length, 0);
  assert.ok(SUPER_BRIDGE_EVM_ROUTES.every((route) => route.available === false));
  const ethToNova = evaluateSuperBridgeRoute({ sourceChainId: 1, destChainId: 22016 });
  assert.equal(ethToNova.state, 'route_unavailable');
  assert.equal(ethToNova.executable, false);
  const matrix = superBridgeRouteMatrix();
  assert.ok(matrix.some((row) => row.id === 'superbridge-polygon' && row.state === 'route_unavailable'));
  const body = buildSuperBridgeTransferBody({
    fromAccountId: 'acc-1',
    amount: '1',
    currency: 'ETH',
    targetChain: 'ethereum',
  });
  assert.equal(body.ok, true);
  assert.equal(body.path, SUPER_BRIDGE_TRANSFER_API);
});

test('trading panel and swap history never invent hashes or enable execution', () => {
  const panel = buildTradingPanel({
    selectedSymbol: 'USDC',
    selectedChainId: 1,
    kyc: approvedKyc,
    quoteEvidence: { authoritative: true, status: 'quoted', amountOut: 5, slippageBps: 50 },
    feeEvidence: { authoritative: true, feeBps: 30, gasEstimate: 21000 },
    liquidityEvidence: { authoritative: true, status: 'available' },
    historyItems: [
      { id: 's1', source: 'bank', accountId: '6572', status: 'pending', settled: false },
      { id: 'bad', source: 'bank', accountId: '6572', txHash: 'not-a-hash' },
    ],
    accountId: '6572',
  });
  assert.equal(panel.canTrade, false);
  assert.ok(panel.blockedReasons.includes('execution_disabled'));
  assert.equal(panel.quote.fees.feeBps, 30);
  assert.equal(panel.history[1].txHash, null);
  const tracked = trackTransactionStatus({
    submitted: true,
    settled: true,
    success: true,
    evidence: { authoritative: true },
    source: 'Nova Online Bank / Ledger Bridge',
  });
  assert.equal(tracked.completed, true);
  const history = presentSwapHistory([{ id: 'x', source: 'bank', settled: true }], { accountId: null });
  assert.equal(history[0].settlement, 'unconfirmed');
});

test('nova-x screen surfaces trading and super bridge fail-closed state', async () => {
  const screen = await loadProductScreen('nova-x', mockClient(), {
    session: { token: 't', accountId: '6572', address: '0xabc', expiresAt: '2099-01-01T00:00:00Z' },
    selectedSymbol: 'LINK',
    chainEvidence: { configurationVerified: true },
  });
  assert.equal(screen.trading.selection.ok, true);
  assert.equal(screen.trading.canTrade, false);
  assert.equal(screen.superBridge.availableCount, 0);
  assert.equal(screen.superBridge.transferBlocked, true);
  assert.equal(screen.superBridge.autoRetry, false);
  assert.equal(screen.reservesDisplay.independentlyVerified, false);
  const html = renderProduct(screen);
  assert.match(html, /Super Bridge live routes: 0/);
  assert.match(html, /Can trade: no/);
});

test('cross-app consistency keeps shared registries and web-only PouchPay', () => {
  const report = crossAppConsistencyReport();
  assert.equal(report.compatible, true);
  assert.equal(report.pouchpayAndroid, true);
  assert.equal(report.tokens.ethAlltraWethDistinct, true);
  assert.ok(report.bridge.superBridge.includes('requires_reconciliation'));
  assert.equal(report.auth.frontendCannotAuthorize, true);
});
