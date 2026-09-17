import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Height the glyphs render at inside the card. */
const GLYPH_HEIGHT = 37.8;

/** Icon over label, filled with brand when active. */
export function ModeCard({
  label,
  glyph: Glyph,
  active,
  loading = false,
  disabled = false,
  onPress,
}: {
  label: string;
  /**
   * The glyph component itself, not an element — the card resolves the
   * colour from `active` and mounts it, so it is not recreated each render.
   */
  glyph: React.ComponentType<{ size: number; color: string }>;
  active: boolean;
  /** True while this card's own publish is in flight — swaps the glyph for a spinner. */
  loading?: boolean;
  /** True while any control on the screen is publishing — blocks a second tap mid-flight. */
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  // the design keeps the glyph and label white in both states
  const content = colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          gap: spacing.xs,
          backgroundColor: active ? colors.primary : colors.accentWell,
          opacity: disabled && !loading ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={content} size="small" />
      ) : (
        <Glyph size={GLYPH_HEIGHT} color={content} />
      )}

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
