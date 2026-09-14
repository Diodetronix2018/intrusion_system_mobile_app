import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ToggleSwitch, Typography } from '../../../../components';
import { useTheme } from '../../../../theme';

export type ToggleRow = {
  key: string;
  /** Number shown in the circle */
  badge: string;
  label: string;
  enabled: boolean;
  onChange: (next: boolean) => void;
};

/**
 * The striped card of ON/OFF rows shared by Part Setting and Relay.
 *
 * Striping follows the row's position in the list, so rows 1, 3, 5… take the
 * tint and the rest keep the card surface.
 */
export function ZoneToggleCard({ rows }: { rows: ToggleRow[] }) {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          gap: spacing.xs,
        },
        layeredShadow,
      ]}
    >
      {rows.map((row, position) => {
        const stripe = {
          backgroundColor: position % 2 === 0 ? colors.rowStripe : colors.card,
        };

        return (
          <View
            key={row.key}
            style={[
              styles.row,
              {
                gap: spacing.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                borderRadius: radius.md,
              },
              stripe,
            ]}
          >
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Typography
                variant="captionBold"
                size={14}
                color={colors.onPrimary}
              >
                {row.badge}
              </Typography>
            </View>

            <Typography
              variant="captionBold"
              size={16}
              align="left"
              color={colors.primary}
              numberOfLines={1}
              style={styles.label}
            >
              {row.label}
            </Typography>

            <Typography
              variant="captionBold"
              size={12}
              color={row.enabled ? colors.primary : colors.textSecondary}
            >
              {row.enabled ? t('common.on') : t('common.off')}
            </Typography>

            <ToggleSwitch
              value={row.enabled}
              onValueChange={row.onChange}
              accessibilityLabel={row.label}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
});
