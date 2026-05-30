import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode } from '@/theme/homePalettes';

const THEME_MODE_STORAGE_KEY = '@code2part/theme-mode';

let memoryMode: ThemeMode | null = null;

export async function loadThemeMode(): Promise<ThemeMode | null> {
  if (memoryMode) {
    return memoryMode;
  }

  try {
    const value = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (value === 'light' || value === 'dark') {
      memoryMode = value;
      return value;
    }
    return null;
  } catch {
    return memoryMode;
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  memoryMode = mode;
  try {
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // Persist failure should not block UI theme switch.
  }
}

export function resetThemeModeForTests(): void {
  memoryMode = null;
}
