import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import type { IconProps } from '../../../icons';
import { useTheme } from '../../../theme';

/**
 * One of a pair of pick-one cards: icon then label, side by side.
 *
 * The border stays 2pt in both states and only changes colour. The spec has
 * 2pt selected / 1pt unselected, but swapping widths shifts the contents by a
 * point every time you tap, which reads as jitter.
 */
export function ChoiceCard({
  icon: Glyph,
  label,
  selected,
  onPress,
}: {
  /**
   * The icon component itself, not an element — the card resolves the colour
   * from `selected` and mounts it, so it is not recreated on every render.
   */
  icon: React.ComponentType<IconProps>;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  const tint = selected ? colors.primary : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: colors.card,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.icon}>
        <Glyph size={20} color={tint} />
      </View>

      <Typography
        variant="captionBold"
        size={16}
        align="left"
        color={tint}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

/** Two choice cards sharing the row evenly. */
export function ChoiceRow({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return <View style={[styles.row, { gap: spacing.md }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
  },
});
