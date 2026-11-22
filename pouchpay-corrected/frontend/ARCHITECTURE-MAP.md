# Architecture map

Repository: `novatrusty2-ops/nova-exchange`. This checkout is the worktree `/home/art-city/nova-apk-builds-wt-frontend` on `feat/frontend-mobile-gonogo`.

`pouchpay-corrected` is tracked by that repository. It is not a nested checkout with its own commits. The main working tree at `/home/art-city/nova-apk-builds/pouchpay-corrected/.git` is a directory without a `HEAD`; Git resolves the folder to the parent repository. That directory was left untouched. Untracked files on `main` (`reserves-status.controller.ts`, backups, logs) were not modified.

| App | Source in this repo | Build | Android |
|---|---|---|---|
| Shared wallet UI | `pouchpay-corrected/frontend` | `npm run test:frontend` | None for PouchPay |
| Nova X shell | Not tracked. Gitignored `android-wrappers/nova-x` | `./gradlew bundleRelease` needs JDK 17 and Android SDK 35 | `digital.novatrustee.novax`, AGP 8.7.3 |
| Nova Plus shell | Not tracked. Gitignored `android-wrappers/nova-plus` | Same Gradle command | `uk.novabank.pluswallet` |

There is no React Native, Expo, or Capacitor project. Separate Vite apps outside this repository were not edited.

Environment names read by the backend, values not copied: `PORT`, `APP_BIND_ADDRESS`, `NOVA_BANK_API_URL`, `NOVA_BANK_API_KEY`, `NOVA_BANK_TIMEOUT_MS`, `NOVA_X_RPC_URL`, `NOVA_PLUS_RPC_URL`, `ALLTRA_RPC_URL`, `ALLTRA_RPC_TIMEOUT_MS`, `ALLTRA_STALE_MAX_MS`, `EVM_RPC_URL`.

Frontend routes are read-only local paths plus the blocked Bank paths in `ROUTE-MATRIX.md`.
