# Source audit

No production system was changed. Codex banking security and Claude Web3 infrastructure repositories were not edited.

| App | Authoritative UI in this sprint | Build | Mobile shell |
|---|---|---|---|
| PouchPay Alltra | `pouchpay-corrected/frontend` in `novatrusty2-ops/nova-exchange` | `npm run test:frontend` (Node test runner, no bundler) | No Android project in this repository |
| Nova Plus | Same frontend module, product id `nova-plus` | Same | WebView shell `android-wrappers/nova-plus`, package `uk.novabank.pluswallet`, gitignored in nova-apk-builds. Separate Vite app exists outside this repo at `nova-plus-wallet` and was not modified |
| Nova X | Same frontend module, product id `nova-x` | Same | WebView shell `android-wrappers/nova-x`, package `digital.novatrustee.novax`, gitignored. Opens `https://nova-x.io/novax/` |

React Native, Expo, and Capacitor configs are not present for these three apps. The Android projects are WebView wrappers with Gradle `compileSdk` 35, `minSdk` 24, `targetSdk` 35, and `versionCode` 1.

Account merge, session token shape, and wallet addresses already stored by the existing auth helpers are left in place. This module does not write balances or history.
