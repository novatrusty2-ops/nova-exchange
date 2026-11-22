/**
 * Keep a previously verified account when a later payload is only declared.
 * Declared reserves never replace verified balances.
 */

export function mergeAccount(previous, incoming) {
  if (!incoming) return previous ?? null;
  if (previous?.verified === true && incoming.verified !== true) {
    return {
      ...previous,
      preserved: true,
      declared: {
        status: incoming.status || 'declared, not verified',
        verified: false,
        balances: incoming.balances ?? null,
      },
    };
  }
  return {
    account: incoming.account ?? previous?.account ?? null,
    verified: incoming.verified === true,
    status: incoming.status || (incoming.verified === true ? 'verified by bank API' : 'declared, not verified'),
    balances: incoming.verified === true ? (incoming.balances ?? previous?.balances ?? null) : null,
    declaredBalances: incoming.verified === true ? null : (incoming.balances ?? null),
    source: incoming.source ?? previous?.source ?? null,
    preserved: false,
  };
}
