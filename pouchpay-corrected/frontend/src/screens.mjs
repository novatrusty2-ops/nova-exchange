import { getProduct } from './networks.mjs';
import { listTokens, tokensByKind, TOKEN_KINDS, rapidTokens } from './catalog.mjs';
import { UNPRICED } from './pricing.mjs';
import { presentKyc } from './kyc.mjs';
import { assetClass, displayName, isBlockedToken, portfolioTotal, presentPrice } from './price-identity.mjs';
import { fiatRailView } from './fiat-rails.mjs';
import { swapErrorMessage } from './swap-errors.mjs';
import { evaluateRoute } from './routes.mjs';
import { settlementLabel, visibleHistory } from './settlement.mjs';
import { mergeAccount } from './accounts.mjs';
import { checkReservesStatus, checkVaultReserves } from './contract.mjs';

const ACTIONS = ['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge', 'liquidity'];

export async function loadProductScreen(productId, client, { previousAccount = null, customTokens = [], slippageBps = 50, session = null } = {}) {
  const product = getProduct(productId);
  const [health, reserves, bridge, vault, kycRes, historyRes] = await Promise.all([
    client.health(),
    client.reserves(),
    client.ledgerBridge(),
    productId === 'pouchpay' ? client.vaultReserves() : Promise.resolve({ ok: false, state: 'failure', data: null, error: 'no_alltra_pools' }),
    client.kyc(),
    client.history(),
  ]);

  const failed = [health, reserves, bridge, kycRes, historyRes].find((item) => item.state === 'timeout' || item.state === 'failure');
  const kyc = presentKyc(session, kycRes.data, kycRes.status || (kycRes.ok ? 200 : 404));
  const fiat = productId === 'nova-x' && client.fiatRails
    ? fiatRailView(await client.fiatRails())
    : { state: 'unavailable', buyCrypto: [], sellCrypto: [] };
  const swapError = historyRes.data?.errorCode
    ? swapErrorMessage(historyRes.data.errorCode, historyRes.data.httpStatus ?? null)
    : null;
  const account = checkReservesStatus(reserves.data)
    ? mergeAccount(previousAccount, reserves.data)
    : mergeAccount(previousAccount, null);

  const pools = checkVaultReserves(vault.data) ? vault.data.pools : [];
  const tokens = listTokens(productId, customTokens).filter((token) => !isBlockedToken(token.chainId, token.address)).map((token) => {
    const pool = pools.find((item) => item.token === token.symbol || item.token === token.id);
    const balance = verifiedBalance(account, token);
    const withBalance = { ...token, balance };
    const price = presentPrice({ ...token, balance });
    const routes = Object.fromEntries(ACTIONS.map((action) => [
      action,
      evaluateRoute({
        action,
        token: withBalance,
        kyc,
        pool: pool ? { ...pool, status: vault.data?.status } : null,
        bridge: bridge.data,
        feeBps: null,
        slippageBps,
      }),
    ]));
    return {
      ...withBalance,
      value: { valueLabel: price.text, usd: price.usd, includeInTotal: price.includeInTotal },
      displayName: displayName(token),
      assetClass: assetClass(token),
      routes,
      pool: pool || null,
    };
  });

  const historyItems = historyRes.ok
    ? visibleHistory(historyRes.data?.items || historyRes.data)
    : [];

  return {
    product,
    phase: failed ? failed.state : 'ready',
    error: failed?.error || null,
    kyc,
    account,
    settlement: settlementLabel(bridge.data),
    bridgeReady: bridge.data?.ready === true && bridge.data?.success === true,
    vaultStatus: vault.ok ? vault.data.status : 'UNAVAILABLE',
    warnings: vault.data?.warnings || [],
    tokens,
    kinds: Object.fromEntries(TOKEN_KINDS.map((kind) => [kind, tokensByKind(productId, kind, customTokens).length])),
    rapidSupported: rapidTokens().length,
    history: historyItems,
    slippageBps,
    feeLabel: 'Fee unavailable',
    fiat,
    swapError,
    portfolio: portfolioTotal(tokens.map((token) => token.value)),
  };
}

export function renderProduct(screen) {
  const rows = screen.tokens.map((token) => {
    const routeSummary = ACTIONS.map((action) => {
      const route = token.routes[action];
      return `${action}:${route.enabled ? 'on' : route.reason}`;
    }).join(' ');
    return `<tr data-kind="${token.kind}" data-asset="${escapeHtml(token.assetClass)}" data-id="${escapeHtml(token.id)}">
      <td>${escapeHtml(token.displayName)}</td>
      <td>${escapeHtml(token.kind)}</td>
      <td>${token.chainId}</td>
      <td>${token.balance == null ? '—' : escapeHtml(String(token.balance))}</td>
      <td>${escapeHtml(token.value.valueLabel)}</td>
      <td>${escapeHtml(routeSummary)}</td>
    </tr>`;
  }).join('');

  const history = screen.history.length
    ? screen.history.map((item) => `<li>${escapeHtml(item.id)} · ${escapeHtml(item.settlement)}</li>`).join('')
    : '<li>No confirmed activity</li>';

  return `<section data-product="${screen.product.id}" data-phase="${screen.phase}">
    <h1>${escapeHtml(screen.product.name)}</h1>
    <p>Chain ${screen.product.chainId}. Vault ${escapeHtml(String(screen.vaultStatus))}.</p>
    <p data-kyc="${screen.kyc.state}">${escapeHtml(screen.kyc.display || screen.kyc.state)}</p>
    <p data-portfolio="${escapeHtml(screen.portfolio.label)}">Portfolio ${escapeHtml(screen.portfolio.label)}</p>
    <p data-fiat="${screen.fiat.state}">${screen.fiat.state === 'ready' ? fiatMarkup(screen.fiat) : 'Fiat rail availability is unavailable.'}</p>
    ${screen.swapError ? `<p data-swap-error="${escapeHtml(screen.swapError.code)}">${escapeHtml(screen.swapError.message)}</p>` : ''}
    <p data-settlement="${screen.settlement}">Settlement ${escapeHtml(screen.settlement)}</p>
    <p data-fee>${escapeHtml(screen.feeLabel)}. Slippage ${screen.slippageBps} bps (not applied while the fee is unknown).</p>
    ${screen.error ? `<p data-error="${escapeHtml(screen.error)}">Request ${escapeHtml(screen.phase)}. Retry when the API answers.</p>` : ''}
    <table><thead><tr><th>Asset</th><th>Kind</th><th>Chain</th><th>Balance</th><th>Value</th><th>Routes</th></tr></thead><tbody>${rows}</tbody></table>
    <ul>${history}</ul>
  </section>`;
}

function fiatMarkup(fiat) {
  const lines = [...fiat.buyCrypto, ...fiat.sellCrypto].map((row) => `${row.provider} ${row.currency} ${row.country} ${row.rails.join(' ')}`);
  return escapeHtml(lines.join('; ') || 'No public rail capabilities');
}

function verifiedBalance(account, token) {
  if (!account?.verified || !account.balances) return null;
  const balances = account.balances;
  if (typeof balances !== 'object') return null;
  const raw = balances[token.id] ?? balances[token.symbol];
  return typeof raw === 'number' ? raw : null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export { UNPRICED };
