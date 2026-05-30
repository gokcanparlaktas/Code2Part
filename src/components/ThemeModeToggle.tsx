import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import type { HomeColorPalette } from '@/theme/homePalettes';

interface ThemeModeToggleProps {
  compact?: boolean;
}

export function ThemeModeToggle({ compact = false }: ThemeModeToggleProps) {
  const { isDark, toggleMode, homeColors } = useTheme();
  const styles = useHomeStyles(createStyles);
  const iconColor = isDark ? homeColors.accent : homeColors.brandBlue;

  return (
    <Pressable
      style={({ pressed }) => [
        compact ? styles.compactButton : styles.button,
        pressed && styles.pressed,
      ]}
      onPress={toggleMode}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={compact ? 18 : 16}
        color={iconColor}
      />
      {compact ? null : (
        <Text style={styles.label}>{isDark ? 'Açık mod' : 'Koyu mod'}</Text>
      )}
    </Pressable>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    compactButton: {
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '500',
    },
  });
