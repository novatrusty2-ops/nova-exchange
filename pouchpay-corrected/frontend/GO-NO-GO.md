# Frontend and mobile GO / NO-GO

Review date: 2026-11-22. Decision: **NO-GO** for production, Play publishing, and live financial operations.

Batch 9 detail: `BATCH9-DELIVERY.md`. Super Bridge matrix: `SUPER-BRIDGE-ROUTE-MATRIX.md`.

## GO (isolated review only)

- Public fiat-rail rendering keeps capability fields and rejects instruction fallbacks.
- Sumsub display requires a live session, a backend GREEN review, and `jurisdiction.source = sumsub` with `verified: true`.
- Expired sessions, RED reviews, restricted jurisdiction, and HTTP 503 stay closed.
- Native ETH (chain 1) and ALLTRA WETH (`0x798f…979c`) have different chain ids and display names.
- Unpriced and indicative rows stay out of portfolio USD.
- Swap, bridge, deposit, withdraw, and liquidity routes stay disabled without backend authorization.
- Settlement labels are confirmed, pending, failed, reorganization, or unconfirmed. A reorg overrides an earlier settled flag.
- Super Bridge historical routes with no deployed contracts stay `route_unavailable`; transfer POST is blocked; ambiguous timeouts never auto-retry.
- Popular tokens ETH/USDC/USDT/DAI/WBTC/UNI/LINK/AAVE require exact chainId+address; HHE3 stays unsupported (missing contract).
- Account 6572 balances are not displayed as independently verified reserves.
- `npm run test:frontend` covers these cases (41/41).
- Bank fiat POSTs, KYC start, Sumsub webhook, and Super Bridge transfer are refused by the wallet client. Customer GETs observed in Nova Bank source are not called until Codex confirms them.

## NO-GO

- `GET /api/v1/nova-x/fiat-rails`, `GET /api/v1/kyc/sumsub/status`, and `GET /api/v1/activity` are not implemented on the pouchpay backend in this repo.
- No approved ALLTRA price feed, so portfolio USD is "not available".
- Nova Plus chain 33001 and Nova X chain 22016 have no verified token registry here.
- Android SDK and Java are absent, so release AABs were not built. versionCode is 1. Wrappers are gitignored and still point at hosted nova-x.io pages.
- PouchPay has no Android project.
- Signing secrets exist only on the local machine and must not be committed. Play upload credentials were not checked.
- Codex banking changes and Claude chain registries live in other repositories and were not copied.

## Dependencies still required

- Backend Sumsub decision with jurisdiction, session expiry, and 401 behavior.
- Authoritative activity feed with confirmation, pending, failed, and reorg evidence.
- Public fiat-rail deployment from novabank.uk #997 and #998.
- A tracked Android source tree, JDK 17, Android SDK 35, and Play signing secrets in CI if a later approved build is requested.
