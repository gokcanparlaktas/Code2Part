import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';

export function useHomeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: HomeColorPalette) => T
): T {
  const { homeColors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(homeColors)), [factory, homeColors]);
}
