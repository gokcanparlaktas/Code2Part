import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const SPLASH_IMAGE = require('../../assets/images/android-icon-background.png');
const MIN_SPLASH_MS = 600;

type Props = {
  children: React.ReactNode;
};

export function AppSplashScreen({ children }: Props) {
  const [appReady, setAppReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    async function prepare() {
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      setAppReady(true);
    }
    prepare();
  }, []);

  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    if (!appReady || !imageReady || splashFinished) {
      return;
    }
    let cancelled = false;
    (async () => {
      await SplashScreen.hideAsync();
      if (!cancelled) {
        setSplashFinished(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appReady, imageReady, splashFinished]);

  if (!splashFinished) {
    return (
      <View style={styles.container}>
        <Image
          source={SPLASH_IMAGE}
          style={styles.image}
          resizeMode="cover"
          onLoadEnd={() => setImageReady(true)}
        />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
});
