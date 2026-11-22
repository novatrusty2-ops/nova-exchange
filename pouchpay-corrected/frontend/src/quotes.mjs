/** Quote previews render backend evidence only. They never submit a trade. */

export function quotePreview(payload, now = Date.now()) {
  const closed = (state) => ({
    state,
    executable: false,
    amountOut: null,
    slippageBps: null,
    feeBps: null,
    gasEstimate: null,
    routeLabel: null,
  });
  if (!payload || payload.authoritative !== true) return closed('unavailable');
  if (payload.status === 'rejected') return closed('rejected');
  const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= now) return closed('expired');
  if (payload.status === 'pending') return closed('pending');
  if (payload.status !== 'quoted' || !Number.isFinite(payload.amountOut) || !Number.isFinite(payload.slippageBps)) {
    return closed('unavailable');
  }
  if (payload.invented === true || payload.syntheticLiquidity === true) {
    return closed('unavailable');
  }
  return {
    state: 'preview',
    executable: false,
    amountOut: payload.amountOut,
    slippageBps: payload.slippageBps,
    feeBps: Number.isFinite(payload.feeBps) ? payload.feeBps : null,
    gasEstimate: Number.isFinite(payload.gasEstimate) ? payload.gasEstimate : null,
    routeLabel: typeof payload.routeLabel === 'string' ? payload.routeLabel : null,
  };
}
