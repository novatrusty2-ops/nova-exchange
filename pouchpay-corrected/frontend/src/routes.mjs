/** Disable a route unless KYC, funding, fees, and backend support all agree. */

import { gateAction } from './kyc.mjs';
import { evaluateSuperBridgeRoute, availableSuperBridgeRoutes } from './super-bridge.mjs';
import { requireExactTokenIdentity } from './trading-tokens.mjs';

const ACTIONS = ['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge', 'liquidity'];

export function evaluateRoute({
  action,
  token,
  kyc,
  pool,
  bridge,
  feeBps,
  slippageBps,
  liquidityEnabled = false,
  sourceChainId = null,
  destChainId = null,
}) {
  if (!ACTIONS.includes(action)) return disabled(action, 'unsupported');
  const gate = gateAction(action, kyc);
  if (!gate.allowed) return disabled(action, gate.reason);
  if (!token?.supported) return disabled(action, 'unsupported');
  if (token.kind === 'custom' || token.kind === 'rapid') return disabled(action, 'unsupported');
  if (token.symbol === 'HHE3' || token.unsupportedReason === 'missing_contract_address') {
    return disabled(action, 'unsupported');
  }
  if (token.productId === 'nova-x' || token.tradingSurface === true) {
    const identity = requireExactTokenIdentity(token);
    if (!identity.ok) return disabled(action, identity.reason);
  }

  if (action === 'bridge') {
    const routes = Array.isArray(bridge?.routes) ? bridge.routes : [];
    const legacyBridgeOpen = routes.length > 0 && bridge?.alltraCrossChainBridgeConfigured === true;
    const liveSuper = availableSuperBridgeRoutes();
    if (sourceChainId != null && destChainId != null) {
      const inspected = evaluateSuperBridgeRoute({ sourceChainId, destChainId });
      if (inspected.state !== 'quote_available') {
        return disabled(action, inspected.state === 'route_unavailable' ? 'unavailable' : 'unsupported');
      }
    }
    if (!legacyBridgeOpen && liveSuper.length === 0) {
      return disabled(action, 'unsupported');
    }
    if (!legacyBridgeOpen) {
      return disabled(action, 'unsupported');
    }
  }

  if (action === 'liquidity' && liquidityEnabled !== true) {
    return disabled(action, 'unsupported');
  }
  if (action === 'swap' || action === 'trade' || action === 'liquidity') {
    if (!pool || pool.status !== 'LIVE') return disabled(action, pool?.status === 'STALE' ? 'stale' : 'unavailable');
    if (!(pool.tokenReserve > 0) || !(pool.allReserve > 0)) return disabled(action, 'unfunded');
    if (typeof feeBps !== 'number') return disabled(action, 'fee_unavailable');
    if (typeof slippageBps !== 'number' || slippageBps < 0 || slippageBps > 1000) {
      return disabled(action, 'slippage_invalid');
    }
  }

  if (action === 'deposit') {
    if (token.depositRouteVerified !== true) return disabled(action, 'unsupported');
  }
  if (action === 'withdraw' || action === 'transfer') {
    if (!(token.balance > 0)) return disabled(action, 'unfunded');
  }

  return { action, enabled: true, reason: null, feeBps: feeBps ?? null, slippageBps: slippageBps ?? null };
}

export function quoteSwap({ amountIn, pool, feeBps, slippageBps }) {
  const route = evaluateRoute({
    action: 'swap',
    token: { supported: true, kind: 'catalog' },
    kyc: { state: 'approved', allowsSensitive: true },
    pool,
    feeBps,
    slippageBps,
  });
  if (!route.enabled) return { enabled: false, reason: route.reason, amountOut: null, minOut: null };
  if (!(amountIn > 0)) return { enabled: false, reason: 'amount_invalid', amountOut: null, minOut: null };
  const amountInWithFee = amountIn * (1 - feeBps / 10_000);
  const amountOut = (amountInWithFee * pool.allReserve) / (pool.tokenReserve + amountInWithFee);
  if (!Number.isFinite(amountOut) || amountOut <= 0) {
    return { enabled: false, reason: 'unfunded', amountOut: null, minOut: null };
  }
  const minOut = amountOut * (1 - slippageBps / 10_000);
  return { enabled: true, reason: null, amountOut, minOut, feeBps, slippageBps };
}

function disabled(action, reason) {
  return { action, enabled: false, reason, feeBps: null, slippageBps: null };
}
