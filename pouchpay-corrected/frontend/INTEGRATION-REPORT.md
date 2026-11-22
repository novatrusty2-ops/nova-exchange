# Frontend integration report

Isolated branch only. No app publish, frontend deploy, or live transaction was run.

## Contracts used

- Codex [novabank.uk#997](https://github.com/novatrusty2-ops/novabank.uk/pull/997) and [#998](https://github.com/novatrusty2-ops/novabank.uk/pull/998): public `GET /api/v1/nova-x/fiat-rails` rows are limited to `id`, `provider`, `currency`, `roles`, `rails`, and `country`. A missing or malformed catalog renders "Fiat rail availability is unavailable." Extra instruction fields are dropped and never used as a fallback catalog.
- Claude `NATIVE-APP-PRICE-IDENTITY-CONTRACT.md`: price UI follows `priceBasis`, `priceVerified`, `priceDisplay`, `priceLabel`, and `countsTowardTotals`. Identity is chain id plus contract address. ALLTRA WETH `0x798f6762bb40d6801a593459d08f890603d3979c` is labeled "Wrapped ALL (legacy WETH)". `0x980dad39b3de421d9299e37e430b21b9e02429b6` cannot be imported or listed. ALLTRA reads prefer `https://mainnet-rpc.alltra.global`.

## What the screens do

- A Sumsub "Verified" label requires an existing session token plus a backend body with `provider: "sumsub"`, `verified: true`, `reviewStatus: "completed"`, and `reviewAnswer: "GREEN"`. Without a session the same body stays unavailable.
- Deposit, withdraw, transfer, swap, trade, bridge, and liquidity stay disabled unless the backend gates already in this client allow them. Liquidity stays unsupported until the backend sets `liquidityEnabled`. Swap error codes `kyc_decision_unavailable`, `regional_swap_limit_unpriced`, `regional_swap_limit`, and `settlement_tx_already_used` render the contract messages. Recovery never posts a swap, build-tx, or settlement.
- Portfolio USD sums only rows with `countsTowardTotals: true` and a verified price. Unpriced `current_price: 0` stays the word Unpriced. Bridge settlement still requires authoritative bank evidence.
- Existing account merge behavior is unchanged. Wallet addresses are not rewritten from fiat-rail payloads.

## Android readiness

`android-wrappers/` remains gitignored, so this repository workflow does not build AABs. Local Nova X (`digital.novatrustee.novax`) and Nova Plus (`uk.novabank.pluswallet`) projects target SDK 35, deny cleartext, and read signing values from uncommitted `keystore.properties` or environment variables. Both `versionCode` values are still 1. There is no PouchPay Android project. WebViews still open the hosted nova-x.io pages, which this branch does not deploy.

## Still blocked

- This pouchpay backend does not implement `/api/v1/nova-x/fiat-rails`, `/api/v1/kyc/sumsub/status`, or `/api/v1/activity`. The UI fails closed.
- No ALLTRA row is approved as `priced` under the Claude contract, so portfolio USD stays "not available".
- Nova Plus (33001) and Nova X (22016) still have no verified token registry in this repo.
- Authorization of any real transfer remains a backend decision and is not enabled here.
