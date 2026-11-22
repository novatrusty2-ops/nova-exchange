# Nova X readiness

**NO-GO.**

- UI product `nova-x` expects chain 22016. Routes stay `chain_unverified` until backend evidence sets `configurationVerified: true` for that chain id.
- Public fiat rails render capability fields only. The pouchpay backend does not serve `/api/v1/nova-x/fiat-rails`.
- Android shell `digital.novatrustee.novax` is gitignored, versionCode 1, and loads `https://nova-x.io/novax/`. Java and ANDROID_HOME are absent, so no AAB was built. See `PLAY-READINESS-NOVA-X.md`.
- No live order, swap, or settlement call is connected.
