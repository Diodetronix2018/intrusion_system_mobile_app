import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Size the glyphs render at inside the card. */
const GLYPH_SIZE = 24;

/**
 * Small brand-filled action tile: icon over label, no selected state.
 * Four of these share a row, so the width comes from `flex` rather than the
 * 75.25 in the spec.
 */
export function QuickActionCard({
  label,
  glyph: Glyph,
  onPress,
}: {
  label: string;
  /** The glyph component itself, mounted with the resolved colour */
  glyph: React.ComponentType<{ size: number; color: string }>;
  onPress?: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          gap: spacing.xs + 2,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Glyph size={GLYPH_SIZE} color={colors.onPrimary} />

      <Typography
        variant="captionBold"
        size={12}
        color={colors.onPrimary}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 76,
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 16px -10px #00000012',
  },
});
