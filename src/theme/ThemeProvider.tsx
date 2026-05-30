import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loadThemeMode, saveThemeMode } from '@/services/themeModeStore';
import {
  darkHomeColors,
  homeColorsForMode,
  type HomeColorPalette,
  type ThemeMode,
} from '@/theme/homePalettes';

interface ThemeContextValue {
  mode: ThemeMode;
  homeColors: HomeColorPalette;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  homeColors: darkHomeColors,
  isDark: true,
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    void loadThemeMode().then((stored) => {
      if (stored) {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      void saveThemeMode(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      homeColors: homeColorsForMode(mode),
      isDark: mode === 'dark',
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
