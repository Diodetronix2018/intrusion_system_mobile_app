import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon, ChevronRightIcon } from '../icons';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

/** Uppercase caption above a card. */
export function SectionLabel({ children }: { children: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Typography
      variant="label"
      align="left"
      color={colors.textSecondary}
      style={{ marginBottom: spacing.md, marginLeft: spacing.xs }}
    >
      {children}
    </Typography>
  );
}

/** Rounded, bordered container that clips its rows. */
export function SettingsCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { colors, radius, spacing, cardShadow } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          marginBottom: spacing['2xl'],
        },
        cardShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type SettingsRowProps = {
  label: string;
  /** Ionicons name shown in a tinted well on the left */
  icon?: string;
  /** Secondary text on the right, before the chevron */
  value?: string;
  /** Shows a tick instead of a chevron — for pick-one lists */
  selected?: boolean;
  showChevron?: boolean;
  /** Suppresses the divider — pass on the first row of a card */
  first?: boolean;
  destructive?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  label,
  icon,
  value,
  selected,
  showChevron = false,
  first = false,
  destructive = false,
  onPress,
}: SettingsRowProps) {
  const { colors, radius, spacing } = useTheme();
  const tint = destructive ? colors.error : colors.primary;
  const iconWell = {
    backgroundColor: destructive ? colors.errorMuted : colors.primaryMuted,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityState={
        selected === undefined ? undefined : { selected }
      }
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          gap: spacing.md,
        },
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
        pressed && !!onPress && { backgroundColor: colors.inputBackground },
      ]}
    >
      {!!icon && (
        <View
          style={[
            styles.icon,
            { borderRadius: radius.md },
            iconWell,
          ]}
        >
          <Icon name={icon} size={18} color={tint} />
        </View>
      )}

      <Typography
        variant="body"
        align="left"
        color={destructive ? colors.error : colors.text}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>

      {!!value && (
        <Typography
          variant="caption"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {value}
        </Typography>
      )}

      {selected && <CheckIcon size={18} color={colors.primary} />}
      {showChevron && <ChevronRightIcon size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
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
  label: {
    flex: 1,
    minWidth: 0,
  },
});
