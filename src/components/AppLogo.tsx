import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

const ICON = require('../../assets/images/icon.png');

type LogoSize = 'sm' | 'md' | 'lg';

interface AppLogoProps {
  size?: LogoSize;
  showName?: boolean;
  /** light = white text on dark backgrounds; dark = navy text on light backgrounds */
  variant?: 'light' | 'dark';
}

const ICON_SIZES: Record<LogoSize, number> = {
  sm: 36,
  md: 52,
  lg: 64,
};

export function AppLogo({ size = 'md', showName = true, variant = 'light' }: AppLogoProps) {
  const iconSize = ICON_SIZES[size];
  const isLight = variant === 'light';

  const nameWhite = isLight ? colors.text.inverse : colors.text.primary;
  const nameBlue = colors.accent.blueLight;
  const nameOrange = colors.accent.orange;

  return (
    <View style={styles.row}>
      <Image
        source={ICON}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        accessibilityLabel="Code2Part logo"
      />
      {showName ? (
        <View style={styles.nameBlock}>
          <Text style={[styles.name, typography.brand, size === 'lg' && styles.nameLg]}>
            <Text style={{ color: nameWhite }}>Code</Text>
            <Text style={{ color: nameBlue }}>2</Text>
            <Text style={{ color: nameOrange }}>Part</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    borderRadius: 10,
  },
  nameBlock: {
    flexShrink: 1,
  },
  name: {},
  nameLg: {
    fontSize: 26,
  },
});
