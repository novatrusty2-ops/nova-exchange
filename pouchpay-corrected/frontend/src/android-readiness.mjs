/**
 * Report Android/Play prerequisites from a file listing. Does not read secrets.
 */

export function assessAndroid(tree) {
  const apps = ['nova-x', 'nova-plus', 'pouchpay'];
  const reports = apps.map((app) => {
    const prefix = `android-wrappers/${app}/`;
    const present = tree.files.some((file) => file.startsWith(prefix));
    const gradle = tree.files.includes(`${prefix}app/build.gradle`);
    const manifest = tree.files.includes(`${prefix}app/src/main/AndroidManifest.xml`);
    const network = tree.files.includes(`${prefix}app/src/main/res/xml/network_security_config.xml`);
    const keystoreDeclared = tree.keystorePropertyNames?.[app]?.includes('storeFile')
      && tree.keystorePropertyNames[app].includes('storePassword')
      && tree.keystorePropertyNames[app].includes('keyAlias')
      && tree.keystorePropertyNames[app].includes('keyPassword');
    return {
      app,
      present,
      gradle,
      manifest,
      networkSecurityConfig: network,
      cleartextDenied: tree.cleartextDenied?.[app] === true,
      versionCode: tree.versionCodes?.[app] ?? null,
      targetSdk: tree.targetSdks?.[app] ?? null,
      signingConfigPresent: keystoreDeclared === true,
      playReady: present && gradle && manifest && network && tree.cleartextDenied?.[app] === true && keystoreDeclared === true && (tree.versionCodes?.[app] ?? 0) > 0,
    };
  });
  return {
    trackedInGit: tree.androidWrappersGitignored !== true,
    reports,
    blockers: [
      ...(tree.androidWrappersGitignored ? ['android-wrappers is gitignored, so this repository workflow does not build the AABs'] : []),
      ...reports.filter((item) => !item.present).map((item) => `${item.app} has no Android project`),
      ...reports.filter((item) => item.present && item.versionCode === 1).map((item) => `${item.app} versionCode is still 1`),
    ],
  };
}
