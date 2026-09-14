import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '../icons';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export type PreferenceCardProps = {
  /** Ionicons name shown in the tinted well on the left */
  icon: string;
  title: string;
  subtitle: string;
  /** Current selection, shown before the chevron */
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

/**
 * Icon → title over subtitle → chevron, on a rounded elevated card.
 * Spec: #FFFFFF, 16pt padding, 16pt radius, 0px 2px 8px 0px #0000000F.
 */
export function PreferenceCard({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
}: PreferenceCardProps) {
  const { colors, radius, spacing, cardShadow } = useTheme();
  const tint = destructive ? colors.error : colors.primary;
  const iconWell = {
    backgroundColor: destructive ? colors.errorMuted : colors.primaryMuted,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          marginBottom: spacing.md,
          gap: spacing.md,
        },
        cardShadow,
        pressed && !!onPress && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWell,
          { borderRadius: radius.md },
          iconWell,
        ]}
      >
        <Icon name={icon} size={20} color={tint} />
      </View>

      <View style={styles.text}>
        <Typography
          variant="cardTitle"
          align="left"
          color={destructive ? colors.error : colors.primary}
          numberOfLines={1}
        >
          {title}
        </Typography>
        <Typography
          variant="cardSubtitle"
          align="left"
          color={colors.textSecondary}
          numberOfLines={2}
          style={{ marginTop: spacing.xs }}
        >
          {subtitle}
        </Typography>
      </View>

      {!!value && (
        <Typography
          variant="cardSubtitle"
          color={colors.textSecondary}
          numberOfLines={1}
        >
          {value}
        </Typography>
      )}

      {!!onPress && <ChevronRightIcon size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
});
