import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Typography } from '../../components';
import { useTheme } from '../../theme';

/**
 * Label above value, with a tinted icon and an "opens elsewhere" affordance.
 * Kept at module scope so the row holds a stable identity across re-renders.
 */
export function ContactRow({
  icon,
  label,
  value,
  first = false,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  first?: boolean;
  onPress: () => void;
}) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md + 1,
          gap: spacing.md,
        },
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        pressed && { backgroundColor: colors.inputBackground },
      ]}
    >
      <View
        style={[
          styles.icon,
          { borderRadius: radius.md, backgroundColor: colors.primaryMuted },
        ]}
      >
        <Icon name={icon} size={18} color={colors.primary} />
      </View>

      <View style={styles.text}>
        <Typography
          variant="label"
          align="left"
          size={11}
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {label}
        </Typography>
        <Typography
          variant="captionBold"
          align="left"
          size={15}
          color={colors.text}
          numberOfLines={1}
          style={styles.value}
        >
          {value}
        </Typography>
      </View>

      <Icon name="open-outline" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    marginTop: 1,
  },
});
