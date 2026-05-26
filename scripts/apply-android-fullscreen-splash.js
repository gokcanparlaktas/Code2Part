/**
 * Patches Android native splash to full-screen after `expo prebuild`.
 * Run automatically via package.json postprebuild, or manually after prebuild.
 */
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const {
  writeFullscreenSplashAssetsAsync,
  patchSplashStylesXmlAsync,
} = require('../plugins/withAndroidFullscreenSplash.lib');

async function main() {
  const androidDir = path.join(projectRoot, 'android');
  try {
    await require('fs').promises.access(androidDir);
  } catch {
    console.log('apply-android-fullscreen-splash: no android/ folder, skipping');
    return;
  }
  await writeFullscreenSplashAssetsAsync(projectRoot);
  await patchSplashStylesXmlAsync(projectRoot);
  console.log('apply-android-fullscreen-splash: full-screen splash applied');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
