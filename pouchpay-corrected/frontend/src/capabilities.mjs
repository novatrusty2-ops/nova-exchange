/** Wallet actions stay prohibited until a backend execution approval exists. */

const MONEY = new Set(['deposit', 'withdraw', 'transfer', 'swap', 'trade', 'bridge', 'liquidity']);

export function actionCapability({ action, executionApproved = false }) {
  if (MONEY.has(action)) {
    return executionApproved === true ? 'supported' : 'prohibited';
  }
  return 'unverified';
}
