const fs = require('fs');
const path = require('path');
const { generateImageAsync } = require('@expo/image-utils');

const SPLASH_SOURCE = 'assets/images/android-icon-background.png';
const IMAGE_NAME = 'splashscreen_background_image';

const DENSITY_SIZES = {
  mdpi: { width: 320, height: 568 },
  hdpi: { width: 480, height: 854 },
  xhdpi: { width: 720, height: 1280 },
  xxhdpi: { width: 1080, height: 1920 },
  xxxhdpi: { width: 1440, height: 2560 },
};

async function writeFullscreenSplashAssetsAsync(projectRoot) {
  const src = path.join(projectRoot, SPLASH_SOURCE);
  for (const [density, { width, height }] of Object.entries(DENSITY_SIZES)) {
    const { source } = await generateImageAsync(
      { projectRoot, cacheType: 'code2part-fullscreen-splash' },
      { src, width, height, resizeMode: 'cover' }
    );
    const dir = path.join(projectRoot, 'android/app/src/main/res', `drawable-${density}`);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, `${IMAGE_NAME}.png`), source);
  }

  const drawableDir = path.join(projectRoot, 'android/app/src/main/res/drawable');
  await fs.promises.mkdir(drawableDir, { recursive: true });
  const layerList = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="fill" android:src="@drawable/${IMAGE_NAME}"/>
  </item>
</layer-list>
`;
  await fs.promises.writeFile(
    path.join(drawableDir, 'splashscreen_fullscreen.xml'),
    layerList
  );
}

async function patchSplashStylesXmlAsync(projectRoot) {
  const stylesPath = path.join(projectRoot, 'android/app/src/main/res/values/styles.xml');
  const fullscreenStyle = `  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen_fullscreen</item>
    <item name="android:statusBarColor">#0A1628</item>
    <item name="android:navigationBarColor">#0A1628</item>
  </style>`;
  const content = await fs.promises.readFile(stylesPath, 'utf8');
  const updated = content.replace(
    /<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>/,
    fullscreenStyle
  );
  if (updated === content) {
    throw new Error('Could not patch Theme.App.SplashScreen in styles.xml');
  }
  await fs.promises.writeFile(stylesPath, updated);
}

module.exports = {
  writeFullscreenSplashAssetsAsync,
  patchSplashStylesXmlAsync,
};
