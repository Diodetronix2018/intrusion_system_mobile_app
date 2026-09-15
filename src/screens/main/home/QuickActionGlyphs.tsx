import React from 'react';

import { Icon } from '../../../components';
import { ShieldCheckIcon, ShieldIcon } from '../../../icons';
import MuteSvg from '../../../icons/svg/volume-mute.svg';

type GlyphProps = { size: number; color: string };

/**
 * Glyphs for the quick-action row, each normalised to `{ size, color }` so
 * QuickActionCard can mount them uniformly.
 */

export const AllGlyph = ({ size, color }: GlyphProps) => (
  <ShieldIcon size={size} color={color} />
);

export const PartGlyph = ({ size, color }: GlyphProps) => (
  <ShieldCheckIcon size={size} color={color} />
);

/**
 * Reuses the volume-mute.svg already in the project rather than pulling in
 * Octicons — a fifth icon font would mean another native rebuild for one
 * glyph.
 *
 * `color` is ignored: the file hard-codes stroke="white", which is what the
 * navy card needs. Change the asset to stroke="currentColor" if it ever has
 * to sit on a light surface.
 */
export const MuteGlyph = ({ size }: GlyphProps) => (
  <MuteSvg width={size} height={size} />
);

export const ResetGlyph = ({ size, color }: GlyphProps) => (
  <Icon family="material" name="refresh" size={size} color={color} />
);
