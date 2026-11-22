# Nova Plus wallet readiness

**NO-GO for deposits and withdrawals.**

Chain 33001 stays `chain_unverified` unless evidence sets `configurationVerified: true` for 33001. Chain 22016 does not satisfy that check. There is no verified NRW token list in this repo.

History pages keep rows whose `accountId` matches the session and drop other accounts. Empty history is `unavailable`, not a confirmed empty ledger. Deposit and withdrawal controls stay prohibited.

A payload address that differs from the session address is an `address_mismatch`. Session storage was not migrated.

The Android shell still opens `https://nova-x.io/novaplus/`.
