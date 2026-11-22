# Dependencies on Codex and Claude Code

## Codex

- Confirm auth and schemas before any customer call to `/compliance/kyc/me`, `/compliance/aml`, `/compliance/kyb/me`, `/compliance/tier`, `/compliance/tier/me`, `/transactions`, or `/transactions/cards`.
- Confirm `/fiat/transactions` GET and every POST stay off public wallet actions. This client blocks them.
- Confirm the public fiat-rail allowlist from novabank.uk #997 and #998 is what production will serve.
- Do not treat `/compliance/status` or `/compliance/cases` as a customer KYC decision.

## Claude Code

- Token identity remains chain id plus contract address, from `NATIVE-APP-PRICE-IDENTITY-CONTRACT.md`.
- ALLTRA WETH `0x798f6762bb40d6801a593459d08f890603d3979c` stays "Wrapped ALL (legacy WETH)".
- NovaONE 22016 and NRW 33001 are not enabled here until a backend record has `configurationVerified: true` and the same chain id. The global controller source shows those chain ids, which is not custody or price approval.
- No ALLTRA row is an approved `priced` feed. Portfolio totals stay "not available".

Neither repository was modified.
