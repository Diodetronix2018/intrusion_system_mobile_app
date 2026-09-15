import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

export type ZoneCondition = 'normal' | 'warning' | 'fault';

export type ZoneStatusEntry = {
  /** 1-based zone number, rendered as Z01, Z02… */
  number: number;
  /** Translation key under `zone.locations` */
  locationKey: string;
  condition: ZoneCondition;
};

/**
 * Navy header bar with a "View all" action, then one row per zone.
 *
 * The card grows with however many rows it is given; the design shows a
 * single-row preview with the rest behind "View all".
 */
export function ZoneStatusCard({
  zones,
  onViewAll,
}: {
  zones: ZoneStatusEntry[];
  onViewAll?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();

  const conditionColor = (condition: ZoneCondition) =>
    condition === 'fault'
      ? colors.failed
      : condition === 'warning'
      ? colors.warning
      : colors.success;

  return (
    <View
      style={[
        styles.card,
        {
          gap: spacing.sm + 2,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.lg,
        },
        layeredShadow,
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <Typography
          variant="heading"
          size={16}
          align="left"
          color={colors.onPrimary}
          numberOfLines={1}
          style={styles.headerTitle}
        >
          {t('main.zoneStatus.title')}
        </Typography>

        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Typography
            variant="captionBold"
            size={13}
            // #FFFFFFCC
            color="rgba(255, 255, 255, 0.8)"
            numberOfLines={1}
          >
            {t('common.viewAll')}
          </Typography>
        </Pressable>
      </View>

      {zones.map(zone => {
        const tint = conditionColor(zone.condition);
        return (
          <View
            key={zone.number}
            style={[styles.row, { gap: spacing.sm }]}
          >
            <View style={[styles.dot, { backgroundColor: tint }]} />

            <Typography
              variant="captionBold"
              size={14}
              align="left"
              color={colors.primary}
              numberOfLines={1}
              style={styles.zoneLabel}
            >
              {`Z${String(zone.number).padStart(2, '0')} - ${t(
                `zone.locations.${zone.locationKey}`,
              )}`}
            </Typography>

            <Typography
              variant="captionBold"
              size={13}
              color={tint}
              numberOfLines={1}
            >
              {t(`main.zoneStatus.${zone.condition}`)}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneLabel: {
    flex: 1,
    minWidth: 0,
  },
});
