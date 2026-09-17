import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Size the glyphs render at inside the card. */
const GLYPH_SIZE = 24;

/**
 * Small brand-filled action tile: icon over label.
 * Four of these share a row, so the width comes from `flex` rather than the
 * 75.25 in the spec.
 */
export function QuickActionCard({
  label,
  glyph: Glyph,
  active,
  loading = false,
  disabled = false,
  onPress,
}: {
  label: string;
  /** The glyph component itself, mounted with the resolved colour */
  glyph: React.ComponentType<{ size: number; color: string }>;
  /**
   * Leave unset for a plain momentary action (Mute, Reset — always full
   * strength). Pass `true`/`false` for one of a mutually-exclusive pair
   * (All/Part): the unselected card dims via opacity to highlight the one
   * that's actually active, rather than swapping colours like `ModeCard`.
   */
  active?: boolean;
  /** True while this card's own publish is in flight — swaps the glyph for a spinner. */
  loading?: boolean;
  /** True while any control on the screen is publishing — blocks a second tap mid-flight. */
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { colors, spacing } = useTheme();
  const dimmed = active === false;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={
        active === undefined
          ? { disabled, busy: loading }
          : { selected: active, disabled, busy: loading }
      }
      style={({ pressed }) => [
        styles.card,
        {
          gap: spacing.xs + 2,
          backgroundColor: colors.primary,
          opacity: dimmed || disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} size="small" />
      ) : (
        <Glyph size={GLYPH_SIZE} color={colors.onPrimary} />
      )}

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
