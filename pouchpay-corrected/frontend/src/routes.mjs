/** Disable a route unless KYC, funding, fees, and backend support all agree. */

import { gateAction } from './kyc.mjs';

const ACTIONS = ['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge'];

export function evaluateRoute({ action, token, kyc, pool, bridge, feeBps, slippageBps }) {
  if (!ACTIONS.includes(action)) return disabled(action, 'unsupported');
  const gate = gateAction(action, kyc);
  if (!gate.allowed) return disabled(action, gate.reason);
  if (!token?.supported) return disabled(action, 'unsupported');
  if (token.kind === 'custom' || token.kind === 'rapid') return disabled(action, 'unsupported');

  if (action === 'bridge') {
    const routes = Array.isArray(bridge?.routes) ? bridge.routes : [];
    if (routes.length === 0 || bridge?.alltraCrossChainBridgeConfigured !== true) {
      return disabled(action, 'unsupported');
    }
  }

  if (action === 'swap' || action === 'trade') {
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
