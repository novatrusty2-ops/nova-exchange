# Route contract matrix

Observed in the Nova Bank API source. Not activated from this wallet. Codex still needs to confirm authentication, authorization, response schemas, and that the routes are registered in the deployed app.

| Id | Method | Path | Status |
|---|---|---|---|
| compliance-kyc-me | GET | `/compliance/kyc/me` | Source only. CurrentUser. Not called |
| compliance-aml | GET | `/compliance/aml` | Source only. Not called |
| compliance-kyb-me | GET | `/compliance/kyb/me` | Source only. Not called |
| compliance-status | GET | `/compliance/status` | Source only. Public operations snapshot, not a KYC decision |
| compliance-tier | GET | `/compliance/tier` | Source only. Optional JWT |
| compliance-tier-me | GET | `/compliance/tier/me` | Source only. Optional JWT |
| compliance-cases | GET | `/compliance/cases` | Blocked. Admin list |
| transactions-list | GET | `/transactions` | Source only. CurrentUser. Not called |
| transactions-cards | GET | `/transactions/cards` | Source only. Not called |
| fiat-tx-get | GET | `/fiat/transactions/:referenceNo` | Blocked until auth is confirmed |
| fiat-tx-settlements-get | GET | `/fiat/transactions/:referenceNo/crypto-settlements` | Blocked |
| fiat-tx-create | POST | `/fiat/transactions` | Blocked. Not a wallet action |
| fiat-tx-verify | POST | `/fiat/transactions/:referenceNo/verify` | Blocked |
| fiat-tx-credit | POST | `/fiat/transactions/:referenceNo/credit` | Blocked |
| fiat-tx-crypto-post | POST | `/fiat/transactions/:referenceNo/crypto-settlements` | Blocked |
| kyc-start | POST | `/compliance/kyc/start` | Blocked |
| kyb-start | POST | `/compliance/kyb/start` | Blocked |
| sumsub-webhook | POST | `/webhooks/compliance/sumsub` | Blocked. Inbound webhook |
| local-kyc | GET | `/api/v1/kyc/sumsub/status` | Missing on the pouchpay backend in this repo |
| local-activity | GET | `/api/v1/activity` | Missing on the pouchpay backend in this repo |
| local-fiat-rails | GET | `/api/v1/nova-x/fiat-rails` | Missing on the pouchpay backend in this repo. Public capability shape is specified by novabank.uk #997 and #998 |

`GET /compliance/kyc/me` in source returns `ok`, `kycStatus`, `kycTier`, `accountKind`, `kybStatus`, `limits`, `applicantId`, `reviewStatus`, `sanctionsStatus`, and `sumsubConfigured`. This wallet does not treat that payload as Verified unless session, GREEN review, and Sumsub jurisdiction already agree, and it does not call the route yet.
