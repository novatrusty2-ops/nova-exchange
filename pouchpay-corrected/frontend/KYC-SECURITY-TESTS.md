# KYC security tests

Verified requires an existing session token, `provider: "sumsub"`, `verified: true`, `reviewStatus: "completed"`, `reviewAnswer: "GREEN"`, and `jurisdiction.source = "sumsub"` with `verified: true`.

Covered by `frontend/test/regression.test.mjs` and `frontend/test/sprint.test.mjs`:

- Signed-out GREEN stays unavailable and does not enable withdraw, swap, or liquidity.
- Expired `expiresAt` and HTTP 401 stay expired.
- RED, including `verified: true` together with `reviewAnswer: "RED"`, is rejected.
- Pending review stays pending.
- Restricted or missing jurisdiction does not enable an action.
- Account merge still keeps a verified balance when a later payload is only declared.

These checks do not authorize a backend transaction.
