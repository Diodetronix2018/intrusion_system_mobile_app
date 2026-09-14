import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, ThemeColors } from './colors';
import { cardElevation, elevation, tokens, Tokens } from './tokens';

/** `system` follows the OS setting; `light`/`dark` pin the app to one theme. */
export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = Tokens & {
  colors: ThemeColors;
  isDark: boolean;
  /** Ready-made shadow style for the brand-elevated button */
  shadow: ReturnType<typeof elevation>;
  /** Ready-made shadow style for a settings card */
  cardShadow: ReturnType<typeof cardElevation>;
};

type ThemeContextValue = {
  theme: Theme;
  /** What the app was asked to use — may be `system` */
  mode: ThemeMode;
  /** What is actually on screen right now */
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  /** Flip between light and dark, leaving `system` behind */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function buildTheme(isDark: boolean): Theme {
  const colors = isDark ? darkColors : lightColors;
  return {
    ...tokens,
    colors,
    isDark,
    shadow: elevation(colors.shadow),
    cardShadow: cardElevation(colors.cardShadow, isDark),
  };
}

export function ThemeProvider({
  children,
  initialMode = 'system',
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const toggleTheme = useCallback(() => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark');
  }, [resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: buildTheme(resolvedMode === 'dark'),
      mode,
      resolvedMode,
      setMode,
      toggleTheme,
    }),
    [mode, resolvedMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Full context — use when you need to read or change the mode. */
export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside a <ThemeProvider>');
  }
  return ctx;
}

/** The common case: just the tokens for styling. */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/**
 * Builds a StyleSheet from the active theme and memoises it per theme object,
 * so styles are only recreated when the theme actually changes.
 *
 *   const styles = useThemedStyles(t => StyleSheet.create({ ... }));
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
