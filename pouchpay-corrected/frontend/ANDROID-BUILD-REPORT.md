# Android build report

No debug or release build was produced. `java` is not on `PATH` and `ANDROID_HOME` is unset. Release signing was not run.

| App | Application id | versionCode | AGP | SDK in Gradle | Allowed host |
|---|---|---|---|---|---|
| Nova X | `digital.novatrustee.novax` | 1 | 8.7.3 | compile/target 35, min 24 | `nova-x.io` |
| Nova Plus | `uk.novabank.pluswallet` | 1 | 8.7.3 | compile/target 35, min 24 | `nova-x.io` |

Reproducible setup, not executed here:

1. Install Temurin JDK 17 and set `JAVA_HOME`.
2. Install Android SDK platform 35 and build-tools, and set `ANDROID_HOME`.
3. From the gitignored `android-wrappers/<app>` directory, run `./gradlew assembleDebug` for a debug build.
4. Do not run `bundleRelease` or upload an AAB without a separate approval. Keystore passwords stay in local properties or CI secrets and are not written into this report.

PouchPay has no Android project. Play listing copy, screenshots, and content rating are not in this repository.
