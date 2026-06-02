import { Image, StyleSheet, Text, View } from 'react-native';

import { HowItWorksHelp, type HowItWorksVariant } from '@/components/HowItWorksHelp';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

const ICON = require('../../assets/images/icon.png');

interface AppBrandHeaderProps {
  showHowItWorks?: boolean;
  howItWorksVariant?: HowItWorksVariant;
}

export function AppBrandHeader({
  showHowItWorks = true,
  howItWorksVariant = 'identify',
}: AppBrandHeaderProps) {
  const styles = useHomeStyles(createStyles);

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerSide}>
        <Image source={ICON} style={styles.logoIcon} accessibilityLabel="Code2Part logo" />
      </View>

      <Text style={styles.brandName}>
        <Text style={styles.brandNamePrimary}>Code</Text>
        <Text style={styles.brandNameBlue}>2</Text>
        <Text style={styles.brandNameOrange}>Part</Text>
      </Text>

      <View style={[styles.headerSideRight, !showHowItWorks && styles.headerSideRightCompact]}>
        {showHowItWorks ? (
          <HowItWorksHelp compact variant={howItWorksVariant} />
        ) : null}
        <ThemeModeToggle compact />
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 20,
    },
    headerSide: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      width: 44,
    },
    headerSideRight: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
      minWidth: 96,
    },
    headerSideRightCompact: {
      minWidth: 44,
      width: 44,
    },
    logoIcon: {
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      resizeMode: 'cover',
      width: 44,
    },
    brandName: {
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
    },
    brandNamePrimary: {
      color: c.headerTitle,
    },
    brandNameBlue: {
      color: c.brandAccentBlue,
    },
    brandNameOrange: {
      color: c.accent,
    },
  });
