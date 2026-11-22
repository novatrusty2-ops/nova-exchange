# Nova X exchange readiness

**NO-GO for trading.**

No approved market list or quote service is connected. A quote renders only from authoritative evidence and is never executable. Slippage is shown only when that evidence includes `slippageBps`. Pending, rejected, expired, and unavailable are the other states.

Chain 22016 stays `chain_unverified` until backend evidence sets `configurationVerified: true` for chain 22016. Fiat rails, when present, show provider capability only.

The Android shell still opens `https://nova-x.io/novax/` and is not this branch.
