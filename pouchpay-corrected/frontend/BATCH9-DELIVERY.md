# CURSOR BATCH 9 — Delivery

Branch: `feat/frontend-mobile-gonogo`  
Worktree: `/home/art-city/nova-apk-builds-wt-frontend`  
Review date: 2026-11-22  
Scope: customer-facing integration review candidate only. No merge, deploy, live tx, or private-key access.

## 1. Changed-file inventory

| Path | Change |
|---|---|
| `frontend/src/super-bridge.mjs` | **New** — historical EVM route matrix (all unavailable), transfer body builder, lifecycle interpreter, no auto-retry |
| `frontend/src/trading-tokens.mjs` | **New** — ETH/USDC/USDT/DAI/WBTC/UNI/LINK/AAVE exact Ethereum identities; HHE3 missing address |
| `frontend/src/trading.mjs` | **New** — token/network selection, fee/gas/slippage presentation, route viz, swap history, tx status |
| `frontend/src/app-consistency.mjs` | **New** — shared registries across Nova X / Plus / PouchPay |
| `frontend/test/batch9-safety.test.mjs` | **New** — synthetic fail-closed cases from Phase 6 |
| `frontend/src/accounts.mjs` | Account 6572 never shown as independently verified reserves |
| `frontend/src/client.mjs` | Block `POST …/chains/super-bridge/transfer`; add Super Bridge status read |
| `frontend/src/quotes.mjs` | Reject invented liquidity; expose fee/gas/route fields when authoritative |
| `frontend/src/routes.mjs` | HHE3 / missing contract gates; explicit Super Bridge pair inspection |
| `frontend/src/screens.mjs` | Trading panel + Super Bridge matrix + reserves display |
| `frontend/src/settlement.mjs` | Super Bridge lifecycle terms mapped into confirmation model |

Historical archives were **read only** (`UPLOAD-THIS-pouchpay-review.tgz`, `pouchpay-source.tgz`). No banking ledger, Codex, or Claude worktree edits.

## 2. API compatibility report

| Contract | Frontend behavior |
|---|---|
| `POST /api/v1/chains/super-bridge/transfer` | Shape recovered (`fromAccountId`, `amount`, `currency`, `targetChain`, `recipientAddress`, `pin`). Client **blocks** the POST (`financial_execution_disabled`). |
| `GET /api/v1/chains/super-bridge` | Read path registered; no invented status. |
| `GET /api/v1/kyc/sumsub/status` | Authoritative only; GREEN + Sumsub jurisdiction required. Frontend KYC cannot authorize execution. |
| `GET /api/v1/activity` | Account-scoped history; foreign rows dropped. |
| `GET /api/v1/reserves/status` | Verified balances only; 6572 not independently verified reserves. |
| Ledger Bridge settle / vault swap / AMM quote / build-tx | Remain blocked financial POSTs. |
| Quote preview | Requires `authoritative: true`, non-expired `quoted`; `executable` always false in UI. |

**Gap:** pouchpay backend in this repo still does not implement Sumsub status, activity, fiat-rails, or Super Bridge transfer. Frontend fails closed when those reads are missing.

## 3. Frontend test results

```text
npm run test:frontend
ℹ tests 41
ℹ pass 41
ℹ fail 0
```

Phase 6 coverage added in `batch9-safety.test.mjs`:
- Unsupported HHE3 routes
- Missing liquidity
- Missing contract addresses
- Expired quotes
- Unverified KYC
- Failed authorization (403 → awaiting_user_authorization)
- Ambiguous bridge timeouts → requires_reconciliation, no auto-retry
- Duplicate submissions
- Cross-account access
- Incorrect ETH/WETH representation
- Historical Super Bridge routes remain disabled

Mocks/synthetic balances only. No live chain calls.

## 4. Nova X readiness report

**Candidate readiness: FAIL-CLOSED PREVIEW — NO-GO for production trading.**

- Popular Ethereum token registry present with exact chainId + address.
- Trading panel surfaces token/network selection, quote/fee/gas/slippage/route/history.
- Execution remains prohibited (`canTrade: false`, capabilities prohibited).
- Chain 22016 still requires backend `configurationVerified` evidence.
- Fiat rails still depend on missing backend route.
- Super Bridge live route count: **0**.

## 5. Nova Plus readiness report

**Candidate readiness: FAIL-CLOSED PREVIEW — NO-GO for production wallet money moves.**

- Shares settlement / KYC / capability contracts with Nova X and PouchPay.
- Chain 33001 still unverified without backend evidence.
- No verified NRW token registry beyond native placeholder.
- Super Bridge NovaONE→NRW historical route remains `route_unavailable` (no deployed contracts).

## 6. PouchPay readiness report

**Candidate readiness: FAIL-CLOSED PREVIEW — NO-GO for production.**

- Alltra catalog unchanged; ETH native and ALLTRA WETH remain distinct.
- Account 6572 explicitly labeled not independently verified reserves.
- Android: **web-only** (no wrapper assumed).
- Cross-chain bridge config still empty; Super Bridge EVM routes disabled.

## 7. Super Bridge route matrix

All historical `SUPER_BRIDGE_EVM_ROUTES` preserved as `available: false`:

| Route id | Path | State | Reason |
|---|---|---|---|
| superbridge-ethereum | 1 → 22016 | route_unavailable | Wrapped token has no code / no relayer |
| superbridge-bsc | 56 → 22016 | route_unavailable | Wrapped token has no code / no relayer |
| superbridge-polygon | 137 → 22016 | route_unavailable | No bridge contracts deployed |
| superbridge-arbitrum | 42161 → 22016 | route_unavailable | No bridge contracts deployed |
| superbridge-base | 8453 → 22016 | route_unavailable | No bridge contracts deployed |
| superbridge-optimism | 10 → 22016 | route_unavailable | No bridge contracts deployed |
| superbridge-avalanche | 43114 → 22016 | route_unavailable | No bridge contracts deployed |
| superbridge-tron | 728126428 → 22016 | route_unavailable | No bridge contracts deployed |
| novaone-nrw-world | 22016 → 33001 | route_unavailable | No bridge contracts deployed |
| superbridge-alltra | 651940 → 22016 | route_unavailable | No bridge contracts deployed |
| novaone-alltra | 22016 → 651940 | route_unavailable | No bridge contracts deployed |

Lifecycle states implemented: `unsupported_route`, `route_unavailable`, `quote_available`, `awaiting_user_authorization`, `submitted`, `confirming`, `confirmed`, `failed`, `requires_reconciliation`.  
Ambiguous timeouts → `requires_reconciliation` with `autoRetry: false`.

## 8. Remaining backend dependencies

1. Authoritative Sumsub status with jurisdiction + 401 expiry semantics on pouchpay API.
2. Activity feed with authoritative confirmation / pending / failed / reorg evidence.
3. Super Bridge status + transfer backend that can flip routes only when contracts + relayer are live.
4. Verified token registries / fee / gas / liquidity evidence for Nova X and Nova Plus.
5. Fiat-rail public capabilities for Nova X.
6. Codex confirmation of customer Bank API auth/schemas before any customer GET is enabled.
7. Explicit `executionApproved` authority if money actions are ever unlocked (UI never self-grants).

## 9. Technical GO / NO-GO recommendation

### **NO-GO** for production, Play publishing, live swaps, or live bridging.

### **GO** as an isolated frontend integration candidate for backend compatibility review, because:

- Fail-closed posture preserved and extended for Super Bridge + popular-token trading.
- Historical undeployed bridge routes remain disabled.
- No invented liquidity, prices, or tx hashes.
- KYC / execution cannot be authorized by frontend-only state.
- Frontend contract tests: **41/41 pass**.
- No merge, deploy, ledger mutation, or cross-worktree changes performed.
