const { withDangerousMod } = require('expo/config-plugins');
const {
  writeFullscreenSplashAssetsAsync,
  patchSplashStylesXmlAsync,
} = require('./withAndroidFullscreenSplash.lib');

function withAndroidFullscreenSplash(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { projectRoot } = config.modRequest;
      await writeFullscreenSplashAssetsAsync(projectRoot);
      await patchSplashStylesXmlAsync(projectRoot);
      return config;
    },
  ]);
}

module.exports = withAndroidFullscreenSplash;
