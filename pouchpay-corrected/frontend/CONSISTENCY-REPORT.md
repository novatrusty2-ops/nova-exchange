# Cross-project consistency

Chain ids, native symbols, and the three application ids live in `src/manifest.mjs`. Nova X is 22016, Nova Plus is 33001, and PouchPay is Alltra 651940. Product objects read those values.

Ethereum native ETH and ALLTRA WETH do not compare equal. A shared symbol does not merge them. Addresses that are not 40 hex characters format as null.

Balances and quotes truncate toward zero at the requested decimal places. `1.239` at two places is `1.23`, not `1.24`.

Transaction words shared by the three screens are submitted, pending, confirmed, failed, unconfirmed, reorganization, expired, and unavailable. A submitted request is not a completed settlement.

Money actions stay prohibited. HTTP 401, 503, maintenance, and malformed KYC stay closed.

PouchPay stays web-only. This repository has no PouchPay Android project, and no separate product requirement was supplied to create one. Nova X and Nova Plus keep the existing WebView package ids.
