import { Platform } from 'react-native';

import { typography } from './typography';

/** 4pt scale. Use these instead of raw numbers so spacing stays consistent. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  sm: 8,
  /** Inputs, cards */
  md: 12,
  lg: 16,
  /** Buttons — half of the 52pt height, so the ends are true semicircles */
  pill: 26,
  full: 999,
} as const;

export const sizing = {
  /** Shared control height for buttons and inputs */
  control: 52,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;


/**
 * `0px 8px 16px 0px <primary>26` from the spec. 0x26 = 38/255 ≈ 0.15 alpha.
 * iOS reads shadow*, Android reads elevation — both are emitted so the button
 * lifts on either platform.
 */
export const elevation = (shadowColor: string) =>
  Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      shadowColor,
      elevation: 8,
    },
    default: {},
  })!;

/**
 * `0px 2px 8px 0px #0000000F` from the spec. 0x0F = 15/255 ≈ 0.06 alpha.
 * On dark the shadow reads as nothing, so the card relies on being lighter
 * than the page instead.
 */
export const cardElevation = (shadowColor: string, isDark: boolean) =>
  Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06,
      shadowRadius: 8,
    },
    android: {
      shadowColor,
      elevation: isDark ? 0 : 2,
    },
    default: {},
  })!;

/**
 * `0px 2px 8px 0px #0000000A, 0px 14px 28px -12px #00000012` from the spec.
 *
 * Two stacked shadows need the CSS-style `boxShadow` prop, which React Native
 * supports on the New Architecture (enabled in android/gradle.properties).
 * On dark it is dropped — a 4% black shadow is invisible there, and the card
 * already separates by being lighter than the page.
 */
export const layeredCardShadow = (isDark: boolean) =>
  isDark
    ? {}
    : {
        boxShadow:
          '0px 2px 8px 0px #0000000A, 0px 14px 28px -12px #00000012',
      };

/**
 * `0px 2px 8px 0px #0000000A` — the single-shadow card spec. 0x0A = 10/255
 * ≈ 0.04 alpha. Dropped on dark for the same reason as the layered version.
 */
export const subtleCardShadow = (isDark: boolean) =>
  isDark ? {} : { boxShadow: '0px 2px 8px 0px #0000000A' };

export const tokens = {
  spacing,
  radius,
  sizing,
  typography,
} as const;

export type Tokens = typeof tokens;
