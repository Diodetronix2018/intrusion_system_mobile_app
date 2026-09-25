import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Height the glyphs render at inside the chip. */
const GLYPH_HEIGHT = 22;

/**
 * A Stay/Away chip, laid out along the bottom of the brand-filled StatusCard.
 *
 * The panel's current mode is the solid white chip with a check; the other is
 * a translucent chip on the brand fill, as the switch-to option.
 */
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
  /** Whether this card represents the panel's current mode. */
  active: boolean;
  /** True while this card's own publish is in flight — swaps the glyph for a spinner. */
  loading?: boolean;
  /** True while any control on the screen is publishing — blocks a second tap mid-flight. */
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  const content = active ? colors.primary : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        active ? { backgroundColor: colors.onPrimary } : styles.chipIdle,
        {
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
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
        size={14}
        uppercase
        color={content}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>

      {active && !loading && (
        <Icon name="checkmark-circle" size={18} color={colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // white alphas over the brand fill, identical in both themes
  chipIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  label: {
    flexShrink: 1,
  },
});
