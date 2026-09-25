import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';

/** Height the glyphs render at inside the icon bubble. */
const GLYPH_HEIGHT = 24;
const BUBBLE_SIZE = 44;

/**
 * Icon bubble, label and a one-line status caption.
 *
 * The panel's current mode is the light, outlined card with a check and an
 * "Active" caption; the other is brand-filled with "Tap to switch", so the
 * option you can act on is the one that stands out.
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
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const title = active ? colors.primary : colors.onPrimary;
  const caption = active ? colors.textSecondary : colors.onPrimaryMuted;

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
          padding: spacing.lg,
          gap: spacing.md,
          backgroundColor: active ? colors.primaryMuted : colors.primary,
          borderColor: active ? colors.primary : 'transparent',
          opacity: disabled && !loading ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.bubble,
            active ? { backgroundColor: colors.primary } : styles.bubbleOnBrand,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Glyph size={GLYPH_HEIGHT} color={colors.onPrimary} />
          )}
        </View>

        {active ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Icon name="checkmark" size={14} color={colors.onPrimary} />
          </View>
        ) : (
          <Icon name="arrow-forward" size={18} color={colors.onPrimaryMuted} />
        )}
      </View>

      <View style={styles.text}>
        <Typography
          variant="captionBold"
          size={16}
          uppercase
          color={title}
          numberOfLines={1}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          size={12}
          color={caption}
          numberOfLines={1}
        >
          {t(active ? 'main.modes.active' : 'main.modes.tapToSwitch')}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 128,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    boxShadow: '0px 8px 20px -10px #00000026',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // white alpha over the brand fill, identical in both themes
  bubbleOnBrand: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    gap: 2,
  },
});
