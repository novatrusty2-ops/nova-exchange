/**
 * Trading interface helpers. Never invent liquidity, prices, or transaction hashes.
 * Quotes stay non-executable unless an authoritative backend payload says otherwise —
 * and even then this frontend does not submit swaps.
 */

import { quotePreview } from './quotes.mjs';
import { gateAction } from './kyc.mjs';
import { isAlltraWeth } from './price-identity.mjs';
import { sameAsset, substitutionBlocked, CHAINS } from './manifest.mjs';
import {
  listPopularTokens,
  popularTokenBySymbol,
  requireExactTokenIdentity,
  tradingNetworks,
} from './trading-tokens.mjs';
import { evaluateSuperBridgeRoute } from './super-bridge.mjs';
import { confirmationState, settlementLabel, visibleHistory } from './settlement.mjs';

const SUPER_BRIDGE_DEST_FOR_PANEL = 22016;

export function selectToken(symbol) {
  const token = popularTokenBySymbol(symbol);
  if (!token) return { ok: false, reason: 'unknown_token', token: null, identity: null };
  const identity = requireExactTokenIdentity(token);
  if (!identity.ok) return { ok: false, reason: identity.reason, token, identity: null };
  return { ok: true, reason: null, token, identity: identity.identity };
}

export function selectNetwork(chainId) {
  const network = tradingNetworks().find((row) => Number(row.chainId) === Number(chainId));
  if (!network) return { ok: false, reason: 'unsupported_network', network: null };
  if (network.selectable !== true) return { ok: false, reason: 'network_disabled', network };
  return { ok: true, reason: null, network };
}

export function presentFeeAndGas(evidence) {
  const closed = {
    feeLabel: 'Fee unavailable',
    feeBps: null,
    gasLabel: 'Gas unavailable',
    gasEstimate: null,
    source: null,
  };
  if (!evidence || evidence.authoritative !== true) return closed;
  const feeBps = Number.isFinite(evidence.feeBps) ? evidence.feeBps : null;
  const gasEstimate = Number.isFinite(evidence.gasEstimate) ? evidence.gasEstimate : null;
  return {
    feeLabel: feeBps == null ? 'Fee unavailable' : `${feeBps} bps`,
    feeBps,
    gasLabel: gasEstimate == null ? 'Gas unavailable' : String(gasEstimate),
    gasEstimate,
    source: evidence.source || 'backend',
  };
}

export function presentSlippage(slippageBps, { feeBps = null } = {}) {
  if (typeof slippageBps !== 'number' || !Number.isFinite(slippageBps) || slippageBps < 0 || slippageBps > 1000) {
    return { valid: false, applied: false, slippageBps: null, label: 'Slippage invalid' };
  }
  if (typeof feeBps !== 'number') {
    return {
      valid: true,
      applied: false,
      slippageBps,
      label: `Slippage ${slippageBps} bps (not applied while the fee is unknown)`,
    };
  }
  return {
    valid: true,
    applied: true,
    slippageBps,
    label: `Slippage ${slippageBps} bps`,
  };
}

export function visualizeRoute({ fromToken, toToken, hops = null, liquidityEvidence = null } = {}) {
  if (fromToken?.symbol === 'HHE3' || toToken?.symbol === 'HHE3') {
    return {
      state: 'unsupported',
      label: 'HHE3 route unsupported',
      hops: [],
      reason: 'unsupported_hhe3_route',
    };
  }
  const from = requireExactTokenIdentity(fromToken);
  const to = requireExactTokenIdentity(toToken);
  if (!from.ok || !to.ok) {
    return {
      state: 'unsupported',
      label: 'Route unavailable',
      hops: [],
      reason: !from.ok ? from.reason : to.reason,
    };
  }
  if (liquidityEvidence?.authoritative !== true || liquidityEvidence?.status !== 'available') {
    return {
      state: 'missing_liquidity',
      label: 'Liquidity unavailable',
      hops: [],
      reason: 'missing_liquidity',
    };
  }
  const path = Array.isArray(hops) && hops.length
    ? hops.filter((hop) => hop && hop.chainId != null && hop.label)
    : [{ chainId: from.identity.chainId, label: fromToken.symbol }, { chainId: to.identity.chainId, label: toToken.symbol }];
  return {
    state: 'preview',
    label: path.map((hop) => hop.label).join(' → '),
    hops: path,
    reason: null,
  };
}

export function presentQuote(quoteEvidence, feeEvidence, slippageBps, now = Date.now()) {
  const quote = quotePreview(quoteEvidence, now);
  const fees = presentFeeAndGas(feeEvidence);
  const slippage = presentSlippage(slippageBps, { feeBps: fees.feeBps });
  return {
    quote,
    fees,
    slippage,
    executable: false,
    amountOut: quote.amountOut,
    display: quote.state === 'preview'
      ? `Preview ${quote.amountOut} (not submitted)`
      : `Quote ${quote.state}`,
  };
}

export function presentSwapHistory(items, { accountId = null } = {}) {
  const source = Array.isArray(items) ? items : [];
  const owned = source.filter((item) => item && item.id && item.source && (accountId == null || item.accountId === accountId));
  return owned.map((item) => ({
    id: String(item.id),
    source: item.source,
    kind: item.kind || item.type || 'swap',
    settlement: settlementLabel(item),
    confirmation: confirmationState(item),
    txHash: typeof item.txHash === 'string' && /^0x[0-9a-fA-F]{64}$/.test(item.txHash) ? item.txHash : null,
  }));
}

export function trackTransactionStatus(record) {
  const confirmation = confirmationState(record);
  return {
    request: confirmation.request,
    settlement: confirmation.settlement,
    completed: confirmation.completed,
    label: confirmation.completed
      ? 'Confirmed'
      : confirmation.request === 'submitted'
        ? `Submitted · ${confirmation.settlement}`
        : confirmation.settlement,
  };
}

export function rejectEthWethConfusion(left, right) {
  const ethNative = { chainId: 1, native: true, symbol: 'ETH' };
  const alltraWeth = {
    chainId: CHAINS.alltra.chainId,
    native: false,
    address: '0x798f6762bb40d6801a593459d08f890603d3979c',
    symbol: 'WETH',
  };
  if (isAlltraWeth(left) && sameAsset(right, ethNative)) return true;
  if (isAlltraWeth(right) && sameAsset(left, ethNative)) return true;
  if (sameAsset(left, ethNative) && sameAsset(right, alltraWeth)) return true;
  if (sameAsset(right, ethNative) && sameAsset(left, alltraWeth)) return true;
  return substitutionBlocked(left, right) && (
    (left?.symbol === 'ETH' && right?.symbol === 'WETH')
    || (left?.symbol === 'WETH' && right?.symbol === 'ETH')
    || (left?.symbol === 'ETH' && right?.symbol === 'ETH' && Number(left?.chainId) !== Number(right?.chainId))
  );
}

export function buildTradingPanel({
  selectedSymbol = null,
  selectedChainId = 1,
  kyc = null,
  quoteEvidence = null,
  feeEvidence = null,
  liquidityEvidence = null,
  slippageBps = 50,
  historyItems = [],
  accountId = null,
  now = Date.now(),
} = {}) {
  const tokens = listPopularTokens();
  const networks = tradingNetworks();
  const selection = selectedSymbol ? selectToken(selectedSymbol) : { ok: false, reason: 'no_selection', token: null };
  const network = selectNetwork(selectedChainId);
  const quote = presentQuote(quoteEvidence, feeEvidence, slippageBps, now);
  const route = selection.ok
    ? visualizeRoute({
      fromToken: selection.token,
      toToken: popularTokenBySymbol('USDC'),
      liquidityEvidence,
    })
    : { state: 'unsupported', label: 'Select a token', hops: [], reason: selection.reason };
  const bridge = evaluateSuperBridgeRoute({
    sourceChainId: selectedChainId,
    destChainId: SUPER_BRIDGE_DEST_FOR_PANEL,
  });
  const kycGate = gateAction('swap', kyc);
  const history = presentSwapHistory(historyItems, { accountId });

  return {
    tokens,
    networks,
    selection,
    network,
    quote,
    route,
    bridge: {
      state: bridge.state,
      executable: false,
      reason: bridge.reason,
    },
    history,
    canTrade: false,
    blockedReasons: [
      !kycGate.allowed ? kycGate.reason : null,
      !selection.ok ? selection.reason : null,
      !network.ok ? network.reason : null,
      route.state !== 'preview' ? route.reason : null,
      quote.quote.state !== 'preview' ? `quote_${quote.quote.state}` : null,
      'execution_disabled',
    ].filter(Boolean),
  };
}

export { listPopularTokens, tradingNetworks, visibleHistory };
