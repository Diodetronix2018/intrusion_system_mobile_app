import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Height the glyphs render at inside the segment. */
const GLYPH_HEIGHT = 26;

/**
 * One segment of the Stay/Away toggle — glyph beside label.
 *
 * Rendered side by side inside the track in `MainScreen`: the panel's current
 * mode is the filled brand segment with a check, the other sits flat on the
 * track as the switch-to option.
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
  const content = active ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled, busy: loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.segment,
        active && styles.segmentActive,
        {
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: active ? colors.primary : 'transparent',
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
        size={15}
        uppercase
        color={content}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>

      {active && !loading && (
        <View style={[styles.check, { backgroundColor: colors.onPrimary }]}>
          <Icon name="checkmark" size={12} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    boxShadow: '0px 6px 14px -6px #00000040',
  },
  label: {
    flexShrink: 1,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
