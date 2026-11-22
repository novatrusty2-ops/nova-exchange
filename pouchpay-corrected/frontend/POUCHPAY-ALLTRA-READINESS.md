# PouchPay Alltra readiness

**NO-GO for swaps, liquidity, and USD totals.**

Native ETH is chain 1. ALLTRA WETH `0x798f6762bb40d6801a593459d08f890603d3979c` is "Wrapped ALL (legacy WETH)". Unpriced rows, including `current_price: 0`, stay out of the portfolio total.

Vault status other than a live funded pool leaves swap and liquidity unavailable. Settlement labels are confirmed, pending, failed, unconfirmed, and reorganization. A reservation with an authoritative past `expiresAt` shows expired. No reservation is created here.

Account 6572 is displayed redacted. Balances still come only from a verified bank payload.
