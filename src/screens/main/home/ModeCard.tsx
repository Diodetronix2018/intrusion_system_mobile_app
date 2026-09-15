import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Height the glyphs render at inside the card. */
const GLYPH_HEIGHT = 37.8;

/** Icon over label, filled with brand when active. */
export function ModeCard({
  label,
  glyph: Glyph,
  active,
  onPress,
}: {
  label: string;
  /**
   * The glyph component itself, not an element — the card resolves the
   * colour from `active` and mounts it, so it is not recreated each render.
   */
  glyph: React.ComponentType<{ size: number; color: string }>;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  // the design keeps the glyph and label white in both states
  const content = colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          gap: spacing.xs,
          backgroundColor: active ? colors.primary : colors.accentWell,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Glyph size={GLYPH_HEIGHT} color={content} />

      <Typography
        variant="captionBold"
        size={16}
        uppercase
        color={content}
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
    minHeight: 86,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 20px -10px #00000014',
  },
});
