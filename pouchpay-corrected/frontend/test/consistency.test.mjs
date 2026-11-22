import assert from 'node:assert/strict';
import test from 'node:test';
import { APPS, CHAINS, sameAsset, substitutionBlocked, formatAddress, knownAsset } from '../src/manifest.mjs';
import { PRODUCTS } from '../src/networks.mjs';
import { confirmationState, STATUS_TERMS } from '../src/settlement.mjs';
import { truncateAmount } from '../src/format.mjs';
import { presentKyc } from '../src/kyc.mjs';
import { quotePreview } from '../src/quotes.mjs';
import { actionCapability } from '../src/capabilities.mjs';
import { createClient } from '../src/client.mjs';

test('one manifest owns chain ids and blocks asset substitution', () => {
  assert.equal(PRODUCTS['nova-x'].chainId, CHAINS.novaone.chainId);
  assert.equal(PRODUCTS['nova-plus'].chainId, CHAINS.nrw.chainId);
  assert.equal(PRODUCTS.pouchpay.chainId, CHAINS.alltra.chainId);
  assert.equal(APPS.pouchpay.android, 'web-only');
  const eth = knownAsset(1, null, true);
  const weth = knownAsset(651940, '0x798f6762bb40d6801a593459d08f890603d3979c', false);
  assert.equal(sameAsset(eth, weth), false);
  assert.equal(substitutionBlocked({ chainId: 1, native: true, symbol: 'ETH' }, { chainId: 651940, native: false, symbol: 'ETH', address: weth.address }), true);
  assert.equal(formatAddress('0x798F6762BB40D6801A593459D08F890603D3979C'), weth.address);
  assert.equal(formatAddress('not-an-address'), null);
});

test('submitted requests stay distinct from confirmed settlement', () => {
  const submitted = confirmationState({ submitted: true, settled: false, success: false });
  assert.equal(submitted.request, 'submitted');
  assert.equal(submitted.completed, false);
  assert.ok(STATUS_TERMS.includes('submitted'));
  assert.equal(truncateAmount(1.239, 2), 1.23);
  assert.equal(truncateAmount(1.239, 2), truncateAmount(1.239, 2));
});

test('malformed, stale, and contradictory payloads fail closed', async () => {
  const now = Date.parse('2026-11-22T12:00:00Z');
  assert.equal(presentKyc({ token: 't' }, null, 200, now).allowsSensitive, false);
  assert.equal(presentKyc({ token: 't' }, { provider: 'sumsub', verified: true, reviewStatus: 'completed', reviewAnswer: 'GREEN', reviewResult: { reviewAnswer: 'RED' }, jurisdiction: { source: 'sumsub', verified: true } }, 200, now).state, 'rejected');
  assert.equal(quotePreview({ authoritative: true, status: 'quoted', amountOut: 1, slippageBps: 50, stale: true, expiresAt: '2020-01-01T00:00:00Z' }, now).state, 'expired');
  assert.equal(actionCapability({ action: 'swap' }), 'prohibited');
  const client = createClient({
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ code: 'maintenance' }) }),
  });
  assert.equal((await client.health()).state, 'maintenance');
});
