import assert from 'node:assert/strict';
import test from 'node:test';
import { readFiatRailCatalog, fiatRailView } from '../src/fiat-rails.mjs';
import { presentPrice, portfolioTotal, displayName, isBlockedToken, isAlltraWeth, assetClass } from '../src/price-identity.mjs';
import { presentKyc, gateAction } from '../src/kyc.mjs';
import { settlementLabel } from '../src/settlement.mjs';
import { chainReady } from '../src/chain-gate.mjs';
import { ROUTE_MATRIX } from '../src/bank-contracts.mjs';
import { swapErrorMessage } from '../src/swap-errors.mjs';
import { listTokens } from '../src/catalog.mjs';
import { createClient } from '../src/client.mjs';
import { loadProductScreen, renderProduct } from '../src/screens.mjs';
import { PRODUCTS } from '../src/networks.mjs';

const session = { token: 'session-token', address: '0xabc' };
const buy = { id: 'sample', provider: 'wise', currency: 'USD', roles: ['buy_crypto'], rails: ['wire'], country: 'US' };

test('fiat rail rows keep capability fields and reject a static account fallback', () => {
  const legacy = { ...buy, accountNumber: 'synthetic', iban: 'DE00', routingNumber: '021', swiftBic: 'TEST', payUrl: 'https://fixture.invalid', note: 'synthetic' };
  assert.deepEqual(readFiatRailCatalog({ buyCrypto: [legacy], sellCrypto: [] }), { buyCrypto: [buy], sellCrypto: [] });
  assert.throws(() => readFiatRailCatalog({ accounts: [buy] }), /Invalid fiat rail catalog/);
  assert.equal(fiatRailView({ ok: false, data: { accounts: [legacy] } }).state, 'unavailable');
  assert.equal(JSON.stringify(readFiatRailCatalog({ buyCrypto: [legacy], sellCrypto: [] })).includes('accountNumber'), false);
});

test('signed-out sessions cannot display a verified Sumsub decision', () => {
  const body = { provider: 'sumsub', reviewStatus: 'completed', reviewAnswer: 'GREEN', verified: true };
  assert.equal(presentKyc(null, body, 200).state, 'unavailable');
  assert.equal(presentKyc(null, body, 200).allowsSensitive, false);
  assert.equal(presentKyc(session, body, 200).display, 'Jurisdiction not confirmed');
  assert.equal(presentKyc(session, body, 200).allowsSensitive, false);
  assert.equal(presentKyc(session, { success: false }, 503).display, 'KYC status unavailable');
});

test('ALLTRA WETH is not Ethereum ETH and blocked lookalikes stay hidden', () => {
  const weth = listTokens('pouchpay').find((token) => token.id === 'WETH');
  assert.equal(isAlltraWeth(weth), true);
  assert.equal(displayName(weth), 'Wrapped ALL (legacy WETH)');
  assert.equal(displayName({ ...weth, symbol: 'ETH', name: 'Ether' }), 'Wrapped ALL (legacy WETH)');
  const blocked = '0x980dad39b3de421d9299e37e430b21b9e02429b6';
  assert.equal(isBlockedToken(651940, blocked), true);
  assert.equal(listTokens('pouchpay', [{ address: blocked, symbol: 'WBNB' }]).some((token) => token.address === blocked), false);
  assert.equal(PRODUCTS.pouchpay.rpc, 'https://mainnet-rpc.alltra.global');
});

test('unpriced rows never become dollar totals', () => {
  const row = presentPrice({ priceDisplay: 'Unpriced', priceBasis: 'unpriced', current_price: 0, balance: 4, countsTowardTotals: false });
  assert.equal(row.text, 'Unpriced');
  assert.equal(row.text.includes('$'), false);
  const indicative = presentPrice({ priceDisplay: 'indicative', priceBasis: 'indicative', priceVerified: false, current_price: 65000, balance: 1, priceLabel: 'Indicative price' });
  assert.equal(indicative.includeInTotal, false);
  assert.equal(portfolioTotal([row, indicative]).label, 'not available');
  const verified = presentPrice({ priceDisplay: 'verified', priceBasis: 'priced', priceVerified: true, current_price: 2, balance: 3, countsTowardTotals: true });
  assert.equal(portfolioTotal([verified]).usd, 6);
});

test('swap and liquidity errors do not authorize a retry that sends funds', async () => {
  assert.equal(swapErrorMessage('kyc_decision_unavailable', 503).message, 'Swaps are unavailable while identity checks are offline');
  assert.equal(swapErrorMessage('regional_swap_limit_unpriced', 403).message, 'Swaps are paused: no verified price');
  assert.equal(swapErrorMessage('settlement_tx_already_used', 409).message, 'Transaction already used');
  assert.equal(swapErrorMessage('regional_swap_limit', 200).message, 'This action is unavailable');
  const client = createClient({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }) });
  const recovered = await client.recover('/api/v1/swap/build-tx', { state: 'failure' });
  assert.equal(recovered.retrySendsFunds, false);
  assert.equal(recovered.error, 'financial_execution_disabled');
});

test('Nova X screen renders rail capabilities without bank instructions', async () => {
  const client = {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: {} }),
    reserves: async () => ({ ok: true, state: 'ready', status: 200, data: { success: true, account: '6572', verified: true, status: 'verified by bank API', balances: {} } }),
    ledgerBridge: async () => ({ ok: true, state: 'ready', status: 200, data: { success: false, ready: false, settled: false } }),
    kyc: async () => ({ ok: true, state: 'ready', status: 200, data: { provider: 'sumsub', verified: true, reviewStatus: 'completed', reviewAnswer: 'GREEN', jurisdiction: { source: 'sumsub', verified: true, country: 'GB' } } }),
    history: async () => ({ ok: true, state: 'ready', status: 200, data: { errorCode: 'regional_swap_limit_unpriced', items: [] } }),
    fiatRails: async () => ({
      ok: true,
      state: 'ready',
      data: {
        buyCrypto: [{ ...buy, iban: 'HIDDEN' }],
        sellCrypto: [],
      },
    }),
  };
  const screen = await loadProductScreen('nova-x', client, { session });
  const html = renderProduct(screen);
  assert.equal(screen.fiat.buyCrypto[0].rails[0], 'wire');
  assert.equal(html.includes('HIDDEN'), false);
  assert.equal(html.includes('iban'), false);
  assert.equal(html.includes('accountNumber'), false);
  assert.match(html, /Swaps are paused: no verified price/);
  assert.equal(screen.portfolio.label, 'not available');
  assert.equal(screen.kyc.display, 'Verified');
  for (const token of screen.tokens) assert.equal(token.routes.liquidity.enabled, false);
});

test('session, rejection, jurisdiction, and settlement states stay closed', () => {
  const green = { provider: 'sumsub', verified: true, reviewStatus: 'completed', reviewAnswer: 'GREEN' };
  const now = Date.parse('2026-11-22T12:00:00Z');
  assert.equal(presentKyc({ token: 't', expiresAt: '2026-11-22T11:00:00Z' }, green, 200, now).display, 'Session expired');
  assert.equal(presentKyc(session, green, 401, now).state, 'expired');
  assert.equal(presentKyc(session, { ...green, reviewAnswer: 'RED', verified: false }, 200, now).display, 'Verification rejected');
  assert.equal(presentKyc(session, { ...green, jurisdiction: { source: 'sumsub', verified: false, restricted: true } }, 200, now).display, 'Restricted jurisdiction');
  assert.equal(presentKyc(session, green, 200, now).display, 'Jurisdiction not confirmed');
  assert.equal(gateAction('withdraw', presentKyc(session, green, 200, now)).allowed, false);
  const approved = presentKyc(session, { ...green, jurisdiction: { source: 'sumsub', verified: true } }, 200, now);
  assert.equal(approved.display, 'Verified');
  assert.equal(gateAction('withdraw', approved).allowed, true);
  assert.equal(settlementLabel({ status: 'pending', settled: false }), 'pending');
  assert.equal(settlementLabel({ status: 'failed', settled: false }), 'failed');
  assert.equal(settlementLabel({ reorg: true, settled: true, success: true, evidence: { authoritative: true } }), 'reorganization');
  const eth = listTokens('pouchpay').find((token) => token.id === 'ETH');
  const weth = listTokens('pouchpay').find((token) => token.id === 'WETH');
  assert.equal(assetClass(eth), 'native-eth');
  assert.equal(assetClass(weth), 'alltra-weth');
  assert.notEqual(eth.chainId, weth.chainId);
  const contradictory = { provider: 'sumsub', verified: true, reviewStatus: 'completed', reviewAnswer: 'RED', jurisdiction: { source: 'sumsub', verified: true } };
  assert.equal(presentKyc(session, contradictory, 200).display, 'Verification rejected');
  assert.equal(presentKyc(session, contradictory, 200).allowsSensitive, false);
  assert.equal(presentKyc(session, { provider: 'sumsub', verified: true, reviewStatus: 'pending', reviewAnswer: 'PENDING' }, 200).display, 'Verification pending');
});

test('bank writes stay blocked and NovaONE stays disabled without verified chain evidence', async () => {
  let calls = 0;
  let auth = null;
  const client = createClient({
    session: { token: 'session-token' },
    fetchImpl: (_url, init) => {
      calls += 1;
      auth = init.headers.authorization;
      return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
    },
  });
  const blocked = await client.request('/fiat/transactions/REF/credit', { method: 'POST', body: { amount: '1' } });
  assert.equal(blocked.error, 'financial_execution_disabled');
  assert.equal(calls, 0);
  const held = await client.customerKycMe();
  assert.equal(held.error, 'codex_verification_required');
  assert.equal(calls, 0);
  const expired = await client.health();
  assert.equal(expired.state, 'expired');
  assert.equal(auth, 'Bearer session-token');
  assert.equal(ROUTE_MATRIX.find((row) => row.id === 'sumsub-webhook').customerCall, false);
  assert.equal(chainReady(22016, null).reason, 'chain_unverified');
  assert.equal(chainReady(33001, { chainId: 22016, configurationVerified: true }).reason, 'chain_mismatch');
  assert.equal(chainReady(22016, { chainId: 22016, configurationVerified: true }).enabled, true);
  const screen = await loadProductScreen('nova-x', {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: {} }),
    reserves: async () => ({ ok: true, state: 'ready', status: 200, data: { success: true, account: '1', verified: false, status: 'declared, not verified' } }),
    ledgerBridge: async () => ({ ok: true, state: 'ready', status: 200, data: { success: false, settled: false } }),
    kyc: async () => ({ ok: false, state: 'failure', status: 404, data: null }),
    history: async () => ({ ok: true, state: 'ready', status: 200, data: { items: [] } }),
  });
  assert.equal(screen.chain.enabled, false);
  assert.equal(screen.tokens[0].routes.swap.reason, 'chain_unverified');
  assert.match(renderProduct(screen), /Retry read/);
});
