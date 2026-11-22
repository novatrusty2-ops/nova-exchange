# Google Play readiness — Nova Plus

**NO-GO for upload.**

| Check | Result |
|---|---|
| Package | `uk.novabank.pluswallet` |
| versionCode / versionName | 1 / 1.0.0 |
| targetSdk | 35 |
| Cleartext | Denied in `network_security_config` |
| Signing config | Same pattern as Nova X: local `keystore.properties` names are present and the store file exists. Passwords are not recorded here |
| Build environment | `java` is not installed and `ANDROID_HOME` is unset, so no AAB was produced |
| Source tracked in nova-exchange | No. `android-wrappers/` is gitignored |
| What the shell loads | `https://nova-x.io/novaplus/`, not this branch |
| Separate wallet repo | `nova-plus-wallet` is a Vite web app. It has no Expo, Capacitor, or Gradle config, and it was not changed |
| Play artifacts | None generated and none uploaded |
