import { Ionicons } from '@expo/vector-icons';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { prepareScannedProductCodeText } from '@/domain/labelReading/prepareScannedProductCodeText';
import {
  setPendingScanResult,
  type ProductCodeScanTarget,
} from '@/services/scanCaptureStore';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { homeMonoFont } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

function isScanTarget(value: string | undefined): value is ProductCodeScanTarget {
  return value === 'home' || value === 'compare-source' || value === 'compare-target';
}

export function ProductCodeScanScreen() {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const params = useLocalSearchParams<{ target?: string }>();
  const target = isScanTarget(params.target) ? params.target : 'home';

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [draftCode, setDraftCode] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isScanning) {
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
      });

      if (!photo?.uri) {
        setScanError('Fotoğraf alınamadı. Tekrar deneyin.');
        return;
      }

      const result = await TextRecognition.recognize(photo.uri);
      const prepared = prepareScannedProductCodeText(result.text ?? '');

      if (!prepared) {
        setScanError('Metin okunamadı. Etiketi kadrajlayıp tekrar deneyin.');
        return;
      }

      setDraftCode(prepared);
    } catch {
      setScanError('Okuma sırasında bir hata oluştu. Tekrar deneyin.');
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const handleUseCode = useCallback(() => {
    const trimmed = draftCode?.trim();
    if (!trimmed) {
      return;
    }

    setPendingScanResult(target, trimmed);
    router.back();
  }, [draftCode, target]);

  const handleRetake = useCallback(() => {
    setDraftCode(null);
    setScanError(null);
  }, []);

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={homeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.permissionTitle}>Kamera izni gerekli</Text>
          <Text style={styles.permissionText}>
            Etiket okumak için kamera erişimine izin verin.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={() => {
              void requestPermission();
            }}
          >
            <Text style={styles.primaryButtonText}>İzin ver</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Geri dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (draftCode !== null) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.confirmRoot}>
          <Text style={styles.confirmTitle}>Okunan metni kontrol edin</Text>
          <Text style={styles.confirmHint}>
            Tanımlama yalnızca desteklenen seriler için yapılır. Arama otomatik başlamaz.
          </Text>

          <TextInput
            style={styles.confirmInput}
            value={draftCode}
            onChangeText={setDraftCode}
            autoCapitalize="characters"
            autoCorrect={false}
            multiline
            selectionColor={homeColors.accent}
            underlineColorAndroid="transparent"
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              !draftCode.trim() && styles.buttonDisabled,
              pressed && draftCode.trim() ? styles.buttonPressed : null,
            ]}
            onPress={handleUseCode}
            disabled={!draftCode.trim()}
          >
            <Text style={styles.primaryButtonText}>Kullan</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleRetake}
          >
            <Text style={styles.secondaryButtonText}>Yeniden oku</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.cameraRoot}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.overlay}>
            <Text style={styles.overlayHint}>Etiketi veya tip kodunu kadrajlayın</Text>
            <View style={styles.frame} />
          </View>
        </CameraView>

        {scanError ? <Text style={styles.errorText}>{scanError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.captureButton,
            isScanning && styles.buttonDisabled,
            pressed && !isScanning ? styles.buttonPressed : null,
          ]}
          onPress={() => {
            void handleCapture();
          }}
          disabled={isScanning}
          accessibilityRole="button"
          accessibilityLabel="Etiketi oku"
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={22} color="#fff" />
              <Text style={styles.captureButtonText}>Oku</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    safe: {
      backgroundColor: c.bg,
      flex: 1,
    },
    centered: {
      alignItems: 'center',
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    cameraRoot: {
      flex: 1,
      gap: 16,
      padding: 16,
    },
    camera: {
      borderRadius: 12,
      flex: 1,
      overflow: 'hidden',
    },
    overlay: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    overlayHint: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 8,
      color: '#fff',
      fontSize: 14,
      marginBottom: 16,
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 8,
      textAlign: 'center',
    },
    frame: {
      borderColor: 'rgba(255,255,255,0.85)',
      borderRadius: 10,
      borderWidth: 2,
      height: 120,
      width: '100%',
    },
    captureButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 10,
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 20,
    },
    captureButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: '#DC2626',
      fontSize: 13,
      textAlign: 'center',
    },
    confirmRoot: {
      flex: 1,
      gap: 12,
      padding: 16,
    },
    confirmTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    confirmHint: {
      color: c.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    confirmInput: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      color: c.textPrimary,
      flex: 1,
      fontFamily: homeMonoFont,
      fontSize: 15,
      letterSpacing: 0.3,
      minHeight: 120,
      paddingHorizontal: 14,
      paddingVertical: 12,
      textAlignVertical: 'top',
    },
    permissionTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    permissionText: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 14,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingVertical: 14,
    },
    secondaryButtonText: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonPressed: {
      opacity: 0.88,
    },
  });
