const fs = require('fs');
const path = require('path');
const { generateImageAsync } = require('@expo/image-utils');

const SPLASH_SOURCE = 'assets/splash.png';
const IMAGE_NAME = 'splashscreen_background_image';
const SPLASH_COLOR = '#0A1628';

/** Source asset is 853×1844 (portrait). */
const SOURCE_ASPECT = 1844 / 853;

const DENSITY_WIDTHS = {
  mdpi: 320,
  hdpi: 480,
  xhdpi: 720,
  xxhdpi: 1080,
  xxxhdpi: 1440,
};

async function writeFullscreenSplashAssetsAsync(projectRoot) {
  const src = path.join(projectRoot, SPLASH_SOURCE);
  for (const [density, width] of Object.entries(DENSITY_WIDTHS)) {
    const height = Math.round(width * SOURCE_ASPECT);
    const { source } = await generateImageAsync(
      { projectRoot, cacheType: 'code2part-fullscreen-splash-v2' },
      { src, width, height, resizeMode: 'cover' }
    );
    const dir = path.join(projectRoot, 'android/app/src/main/res', `drawable-${density}`);
    await fs.promises.mkdir(dir, { recursive: true });
    const imagePath = path.join(dir, `${IMAGE_NAME}.png`);
    await fs.promises.writeFile(imagePath, source);
    // expo-splash-screen still references splashscreen_logo — use same cover bitmap.
    await fs.promises.writeFile(path.join(dir, 'splashscreen_logo.png'), source);
  }

  const drawableDir = path.join(projectRoot, 'android/app/src/main/res/drawable');
  await fs.promises.mkdir(drawableDir, { recursive: true });

  const fullscreenXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/${IMAGE_NAME}"/>
  </item>
</layer-list>
`;
  await fs.promises.writeFile(
    path.join(drawableDir, 'splashscreen_fullscreen.xml'),
    fullscreenXml
  );

  const launcherBgXml = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/${IMAGE_NAME}"/>
  </item>
</layer-list>
`;
  await fs.promises.writeFile(
    path.join(drawableDir, 'ic_launcher_background.xml'),
    launcherBgXml
  );
}

async function patchSplashStylesXmlAsync(projectRoot) {
  const stylesPath = path.join(projectRoot, 'android/app/src/main/res/values/styles.xml');
  const splashStyle = `  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen_fullscreen</item>
    <item name="android:statusBarColor">${SPLASH_COLOR}</item>
    <item name="android:navigationBarColor">${SPLASH_COLOR}</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
  </style>`;
  const content = await fs.promises.readFile(stylesPath, 'utf8');
  const updated = content.replace(
    /<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>/,
    splashStyle
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
