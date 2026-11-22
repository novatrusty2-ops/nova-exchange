# Frontend security audit

## Fixed in this branch

- Rendered account ids and wallet addresses are shortened.
- Error-shaped objects drop `iban`, `accountNumber`, `privateKey`, `mnemonic`, `password`, and `authorization` before display helpers return them.
- History rows for another `accountId` are not shown.
- A session address is not replaced by a different payload address.
- HTML text is escaped. Fiat markup has no external links.
- Frontend source has a test that the modules do not contain a private key block or keystore password.

## Unresolved

- Nova Plus auth in `all-three-comprehensive/nova-plus/src/authStore.js` stores the session in `localStorage`. It was not migrated.
- Android WebViews enable JavaScript and third-party cookies, allow file chooser uploads, and send non-`nova-x.io` URLs to an external view. No `addJavascriptInterface` was found. File access is false and mixed content is never allowed. Host allowlist is `nova-x.io`. These shells are gitignored and were not changed.
- This audit did not include a browser penetration test.
