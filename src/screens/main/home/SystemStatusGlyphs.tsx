import React from 'react';
import { Image } from 'react-native';

import { Icon } from '../../../components';
import { LocationPinIcon, PlugIcon, Volume2Icon } from '../../../icons';

type GlyphProps = { size: number; color: string };

/** Stroke weight from the design. */
const STROKE = 1.4;

/**
 * Glyphs for the system-status tiles, normalised to `{ size, color }`.
 * Font glyphs (Material) ignore the stroke width — it only applies to the
 * SVG icons, which are stroke-drawn.
 */

export const ZoneGlyph = ({ size, color }: GlyphProps) => (
  <LocationPinIcon size={size} color={color} strokeWidth={STROKE} />
);

/**
 * battery.svg was a Figma raster with an opaque white backing, so it was
 * converted to a white alpha mask — `tintColor` then colours it and the old
 * white box no longer shows on a dark card.
 */
export const BatteryGlyph = ({ size, color }: GlyphProps) => (
  <Image
    source={require('../../../assets/images/status-battery.png')}
    style={{ width: size, height: size }}
    tintColor={color}
    resizeMode="contain"
    accessibilityIgnoresInvertColors
  />
);

export const AcGlyph = ({ size, color }: GlyphProps) => (
  <PlugIcon size={size} color={color} strokeWidth={STROKE} />
);

export const HooterGlyph = ({ size, color }: GlyphProps) => (
  <Volume2Icon size={size} color={color} strokeWidth={STROKE} />
);

export const TamperGlyph = ({ size, color }: GlyphProps) => (
  <Icon family="material" name="shield-alert-outline" size={size} color={color} />
);

export const SignalGlyph = ({ size, color }: GlyphProps) => (
  <Icon family="material" name="signal" size={size} color={color} />
);
