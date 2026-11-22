/**
 * Keep a previously verified account when a later payload is only declared.
 * Declared reserves never replace verified balances.
 * Account 6572 declared figures are never treated as independently verified reserves.
 */

export const ACCOUNT_6572 = '6572';

export function mergeAccount(previous, incoming) {
  if (!incoming) return previous ?? null;
  if (previous?.verified === true && incoming.verified !== true) {
    return {
      ...previous,
      preserved: true,
      independentlyVerifiedReserves: previous.independentlyVerifiedReserves === true,
      declared: {
        status: incoming.status || 'declared, not verified',
        verified: false,
        balances: incoming.balances ?? null,
      },
    };
  }
  const account = incoming.account ?? previous?.account ?? null;
  const bankVerified = incoming.verified === true;
  const independentlyVerifiedReserves = bankVerified
    && incoming.independentlyVerifiedReserves === true
    && String(account) !== ACCOUNT_6572;
  return {
    account,
    verified: bankVerified,
    independentlyVerifiedReserves,
    status: incoming.status || (bankVerified ? 'verified by bank API' : 'declared, not verified'),
    balances: bankVerified ? (incoming.balances ?? previous?.balances ?? null) : null,
    declaredBalances: bankVerified ? null : (incoming.balances ?? null),
    source: incoming.source ?? previous?.source ?? null,
    preserved: false,
    account6572Note: String(account) === ACCOUNT_6572
      ? 'Account 6572 balances are not displayed as independently verified reserves.'
      : null,
  };
}

export function displayAccountReserves(account) {
  if (!account) {
    return { label: 'unavailable', independentlyVerified: false, balances: null };
  }
  if (String(account.account) === ACCOUNT_6572) {
    return {
      label: account.verified === true
        ? 'bank-reported (not independently verified reserves)'
        : 'declared, not verified',
      independentlyVerified: false,
      balances: account.verified === true ? account.balances : null,
      note: account.account6572Note,
    };
  }
  return {
    label: account.status,
    independentlyVerified: account.independentlyVerifiedReserves === true,
    balances: account.verified === true ? account.balances : null,
    note: null,
  };
}
