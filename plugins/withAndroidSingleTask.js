const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Prevents multiple MainActivity instances on Android, which can register
 * expo-router deep-link handlers twice in development.
 */
function withAndroidSingleTask(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    const activities = application?.activity ?? [];

    for (const activity of activities) {
      const name = activity.$?.['android:name'] ?? '';
      if (name === '.MainActivity' || name.endsWith('.MainActivity')) {
        activity.$['android:launchMode'] = 'singleTask';
      }
    }

    return manifestConfig;
  });
}

module.exports = withAndroidSingleTask;
