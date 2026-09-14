import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { Icon, IconFamily, Typography } from '../../../components';
import { ChevronRightIcon } from '../../../icons';
import { useTheme } from '../../../theme';

/**
 * Icon circle → title over subtitle → chevron circle, all in one row.
 * Height comes from the content plus 16pt padding rather than the fixed 74
 * in the spec, so longer translations don't clip.
 */
export function SettingsOptionCard({
  icon,
  family = 'ionicons',
  Svg,
  title,
  subtitle,
  onPress,
}: {
  /** Font glyph name; ignored when `Svg` is given */
  icon?: string;
  family?: IconFamily;
  /** SVG component, for glyphs no icon font carries */
  Svg?: React.FC<SvgProps>;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  const { colors, radius, sizing, spacing, layeredShadow } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          padding: spacing.lg,
          gap: spacing.md,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: pressed && !!onPress ? 0.85 : 1,
        },
        layeredShadow,
      ]}
    >
      <View style={[styles.iconWell, { backgroundColor: colors.primary }]}>
        {Svg ? (
          // the viewBox is not square, so a 20x20 box letterboxes rather than
          // distorting — react-native-svg honours preserveAspectRatio
          <Svg width={sizing.iconMd} height={sizing.iconMd} />
        ) : (
          <Icon
            name={icon ?? 'ellipse-outline'}
            family={family}
            size={sizing.iconMd}
            color={colors.onPrimary}
          />
        )}
      </View>

      <View style={styles.text}>
        <Typography
          variant="captionBold"
          size={15}
          align="left"
          color={colors.primary}
          numberOfLines={1}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          size={13}
          align="left"
          color={colors.textSecondary}
          numberOfLines={2}
          style={{ marginTop: spacing.xs + 2 }}
        >
          {subtitle}
        </Typography>
      </View>

      <View style={[styles.chevronWell, { backgroundColor: colors.accentWell }]}>
        <ChevronRightIcon size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  chevronWell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
