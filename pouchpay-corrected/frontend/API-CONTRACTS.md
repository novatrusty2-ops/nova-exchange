# API contracts

The client sends `Authorization: Bearer <session token>` when the existing session has a token. HTTP 401 becomes `expired`. HTTP 503 becomes `unavailable`. Timeouts abort the read. `recover()` retries a failed read and refuses financial paths.

Capability levels for deposit, withdraw, transfer, swap, trade, bridge, and liquidity are `prohibited` until `executionApproved === true`. This UI never sets that flag.

Customer Bank routes observed in source stay inactive. Fiat transaction POSTs, KYC/KYB start, and `POST /webhooks/compliance/sumsub` are prohibited. See `ROUTE-MATRIX.md`.

Quote preview accepts only a payload with `authoritative: true`. Missing, rejected, expired, and pending payloads are not executable. Invented liquidity is rejected. No quote endpoint is called.

## Super Bridge

- Status read: `GET /api/v1/chains/super-bridge`
- Transfer: `POST /api/v1/chains/super-bridge/transfer` with body `{ fromAccountId, amount, currency, targetChain, recipientAddress?, pin }`
- The browser client blocks the transfer POST. Timeouts and unauthoritative confirmations map to `requires_reconciliation` and must not auto-retry.
- Historical EVM routes in `super-bridge.mjs` remain unavailable until backend evidence shows deployed contracts and a running relayer.
