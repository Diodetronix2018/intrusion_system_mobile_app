import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { Typography } from './Typography';

/**
 * Icon circle + title over description on one row, with optional content
 * underneath (chips) or alongside (a switch).
 *
 * Shared by Auto ARM, Repeat and Special Notify — they are the same card with
 * different payloads.
 */
export function FeatureCard({
  icon,
  title,
  titleTrailing,
  description,
  trailing,
  children,
  shadow = 'layered',
}: {
  icon: React.ReactNode;
  title: string;
  /** Sits right after the title, on the same line, e.g. a small mode badge */
  titleTrailing?: React.ReactNode;
  /** Omit for a title-only header, e.g. the silence cards */
  description?: string;
  /** Sits at the end of the header row, e.g. a switch */
  trailing?: React.ReactNode;
  /** Sits below the header row, e.g. a chip group */
  children?: React.ReactNode;
  /** Which of the two card shadow specs to use */
  shadow?: 'layered' | 'soft';
}) {
  const { colors, radius, spacing, layeredShadow, softShadow } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          gap: spacing.lg,
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        shadow === 'soft' ? softShadow : layeredShadow,
      ]}
    >
      <View style={[styles.header, { gap: spacing.md }]}>
        <View style={[styles.iconWell, { backgroundColor: colors.primary }]}>
          {icon}
        </View>

        <View style={styles.text}>
          <View style={[styles.titleRow, { gap: spacing.sm }]}>
            <Typography
              variant="captionBold"
              size={16}
              align="left"
              color={colors.primary}
              numberOfLines={1}
              style={styles.titleText}
            >
              {title}
            </Typography>
            {titleTrailing}
          </View>
          {!!description && (
            <Typography
              variant="caption"
              size={12}
              lineHeight="140%"
              align="left"
              color={colors.textSecondary}
              style={{ marginTop: spacing.xs }}
            >
              {description}
            </Typography>
          )}
        </View>

        {trailing}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    flexShrink: 1,
  },
});
