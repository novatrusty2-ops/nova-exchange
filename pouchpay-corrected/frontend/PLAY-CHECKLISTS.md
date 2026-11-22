# Google Play checklists

No APK or AAB was built. JDK 17 and Android SDK 35 are not installed here. Signing passwords were not read.

## Nova X

- Package `digital.novatrustee.novax`, versionCode 1, AGP 8.7.3, target SDK 35.
- WebView stays on `https` hosts equal to or under `nova-x.io`. Other URLs open outside the app. Mixed content is denied. File access is false.
- Debug build, when the toolchain exists: `./gradlew assembleDebug` inside the gitignored `android-wrappers/nova-x` project.
- Signed AAB: `./gradlew bundleRelease` only after a separate approval. Passwords stay in uncommitted `keystore.properties` or CI secrets.

## Nova Plus

- Package `uk.novabank.pluswallet`, versionCode 1, same SDK and WebView rules, host `nova-x.io`.
- Same debug and release commands in `android-wrappers/nova-plus`.

## PouchPay

- Web-only in this repository. No Play listing checklist can be completed until an Android source tree exists.
