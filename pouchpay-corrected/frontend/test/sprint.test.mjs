import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { actionCapability } from '../src/capabilities.mjs';
import { quotePreview } from '../src/quotes.mjs';
import { pageHistory } from '../src/history-page.mjs';
import { reservationView } from '../src/reservations.mjs';
import { bindWallet, redactIdentifier, redactPayload } from '../src/redaction.mjs';
import { formatAmount } from '../src/format.mjs';
import { presentKyc, gateAction } from '../src/kyc.mjs';
import { loadProductScreen, renderProduct } from '../src/screens.mjs';

const session = { token: 'session-token', address: '0xabc', accountId: '6572' };
const now = Date.parse('2026-11-22T12:00:00Z');
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

test('unverified sessions cannot enable a financial action', () => {
  const kyc = presentKyc(null, { provider: 'sumsub', verified: true, reviewStatus: 'completed', reviewAnswer: 'GREEN', jurisdiction: { source: 'sumsub', verified: true } }, 200, now);
  for (const action of ['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge', 'liquidity']) {
    assert.equal(gateAction(action, kyc).allowed, false);
    assert.equal(actionCapability({ action, executionApproved: false }), 'prohibited');
  }
});

test('quotes, reservations, and history stay inside the signed-in account', () => {
  assert.equal(quotePreview(null, now).state, 'unavailable');
  assert.equal(quotePreview({ authoritative: true, status: 'pending' }, now).executable, false);
  assert.equal(quotePreview({ authoritative: true, status: 'quoted', amountOut: 1, slippageBps: 50, expiresAt: '2026-11-22T11:00:00Z' }, now).state, 'expired');
  assert.equal(quotePreview({ authoritative: true, status: 'rejected' }, now).state, 'rejected');
  const live = quotePreview({ authoritative: true, status: 'quoted', amountOut: 1.5, slippageBps: 50, expiresAt: '2026-11-22T13:00:00Z' }, now);
  assert.equal(live.executable, false);
  assert.equal(reservationView({ authoritative: true, status: 'pending', expiresAt: '2026-11-22T11:00:00Z' }, now).state, 'expired');
  const page = pageHistory([
    { id: 'mine', source: 'bank', accountId: '6572' },
    { id: 'other', source: 'bank', accountId: '9999' },
  ], { accountId: '6572', limit: 1 });
  assert.equal(page.total, 1);
  assert.equal(page.droppedForeign, 1);
  assert.equal(page.items[0].id, 'mine');
  assert.equal(bindWallet(session, { address: '0xdef' }).reason, 'address_mismatch');
  assert.equal(bindWallet(session, { address: '0xABC' }).ok, true);
});

test('redaction removes payment secrets and shortens identifiers', () => {
  assert.equal(redactIdentifier('6572'), '••••');
  assert.equal(redactIdentifier('0xabcdef'), '0x…ef');
  const clean = JSON.stringify(redactPayload({ iban: 'DE00', note: 'ok', nested: { privateKey: 'secret' } }));
  assert.equal(clean.includes('DE00'), false);
  assert.equal(clean.includes('secret'), false);
  assert.equal(formatAmount(1.239, 2), '1.23');
  assert.equal(formatAmount(Number.NaN), '—');
});

test('rendered screens do not mark a prohibited action as successful', async () => {
  const screen = await loadProductScreen('pouchpay', {
    health: async () => ({ ok: true, state: 'ready', status: 200, data: {} }),
    reserves: async () => ({ ok: true, state: 'ready', status: 200, data: { success: true, account: '6572', verified: false, status: 'declared, not verified' } }),
    ledgerBridge: async () => ({ ok: true, state: 'ready', status: 200, data: { success: false, settled: false } }),
    vaultReserves: async () => ({ ok: false, state: 'unavailable', status: 503, data: null }),
    kyc: async () => ({ ok: false, state: 'unavailable', status: 503, data: null }),
    history: async () => ({ ok: true, state: 'ready', status: 200, data: { items: [{ id: 'other', source: 'bank', accountId: '9999' }, { id: 'mine', source: 'bank', accountId: '6572', status: 'pending', settled: false }] } }),
  }, { session, quoteEvidence: null, reservationEvidence: { authoritative: true, status: 'pending', expiresAt: '2026-11-22T11:00:00Z' }, now });
  const html = renderProduct(screen);
  assert.equal(screen.capabilities.swap, 'prohibited');
  assert.equal(screen.history.length, 1);
  assert.equal(screen.quote.state, 'unavailable');
  assert.equal(screen.reservation.state, 'expired');
  assert.equal(html.includes('6572'), false);
  assert.equal(html.includes('success'), false);
  assert.match(html, /min-height:44px/);
});

test('frontend source does not embed keystore passwords or private keys', () => {
  const files = fs.readdirSync(srcDir).filter((name) => name.endsWith('.mjs'));
  const blob = files.map((name) => fs.readFileSync(path.join(srcDir, name), 'utf8')).join('\n');
  assert.doesNotMatch(blob, /BEGIN [A-Z ]*PRIVATE KEY/);
  assert.doesNotMatch(blob, /storePassword\s*[:=]\s*['"][^'"]+['"]/);
});
