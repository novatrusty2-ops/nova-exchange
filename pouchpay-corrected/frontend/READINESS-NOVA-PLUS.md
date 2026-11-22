# Nova Plus readiness

**NO-GO.**

- UI product `nova-plus` expects chain 33001 (NRW). Routes stay `chain_unverified` until backend evidence sets `configurationVerified: true` for that chain id. A NovaONE chain id does not satisfy this check.
- There is no verified NRW token list in this repo. Native balance stays unpriced.
- Android shell `uk.novabank.pluswallet` is gitignored, versionCode 1, and loads `https://nova-x.io/novaplus/`. No AAB was built. See `PLAY-READINESS-NOVA-PLUS.md`.
- The separate Vite app `nova-plus-wallet` was not modified.
- Batch 9: shares Super Bridge / KYC / settlement contracts; NovaONE→NRW historical route remains unavailable. See `BATCH9-DELIVERY.md`.
