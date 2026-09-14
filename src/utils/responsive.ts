import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** The width the design was drawn at. */
export const BASE_WIDTH = 375;

export const breakpoints = {
  /** iPhone SE and similar */
  small: 360,
  /** phones */
  medium: 600,
  /** tablets */
  large: 768,
} as const;

/**
 * Caps how far type and controls scale away from the design size. At factor 0
 * nothing scales; at 1 everything scales linearly with screen width — both
 * look wrong on tablets, so the default sits between.
 */
const DEFAULT_FACTOR = 0.4;

export type Responsive = {
  width: number;
  height: number;
  /** < 360pt — small phones */
  isSmall: boolean;
  /** >= 768pt — tablets and foldables */
  isTablet: boolean;
  isLandscape: boolean;
  /** Screen gutter: 24 on phones, wider on tablets */
  gutter: number;
  /** Keeps forms readable instead of stretching across a tablet */
  contentMaxWidth: number;
  /** Scales a design value linearly with screen width */
  scale: (value: number) => number;
  /** Scales a design value, damped — use for type and control heights */
  moderateScale: (value: number, factor?: number) => number;
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmall = width < breakpoints.small;
    const isTablet = width >= breakpoints.large;
    const ratio = width / BASE_WIDTH;

    const scale = (value: number) => Math.round(value * ratio);
    const moderateScale = (value: number, factor = DEFAULT_FACTOR) =>
      Math.round(value + (value * ratio - value) * factor);

    return {
      width,
      height,
      isSmall,
      isTablet,
      isLandscape: width > height,
      gutter: isTablet ? 40 : 24,
      contentMaxWidth: isTablet ? 520 : width,
      scale,
      moderateScale,
    };
  }, [width, height]);
}
