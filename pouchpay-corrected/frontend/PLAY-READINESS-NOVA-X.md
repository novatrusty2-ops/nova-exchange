# Google Play readiness — Nova X

**NO-GO for upload.**

| Check | Result |
|---|---|
| Package | `digital.novatrustee.novax` |
| versionCode / versionName | 1 / 1.0.0 |
| targetSdk | 35 |
| Cleartext | Denied in `network_security_config` |
| Signing config | Release signing reads `keystore.properties` or `KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`. Property names are present locally. Passwords are not recorded here |
| Keystore file | A store file path is set and the file exists on this machine. It is gitignored |
| Build environment | `java` is not installed and `ANDROID_HOME` is unset, so no AAB was produced |
| Source tracked in nova-exchange | No. `android-wrappers/` is gitignored |
| What the shell loads | `https://nova-x.io/novax/`, not this branch |
| Play artifacts | None generated and none uploaded |
