import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

export type ActivitySeverity = 'alarm' | 'warning' | 'info';

export type ActivityEntry = {
  id: string;
  /** Local time, already formatted, e.g. "18:12:11" */
  time: string;
  /** Translation key under `main.activity.events` */
  eventKey: string;
  /** 1-based zone number */
  zoneNumber: number;
  /** Translation key under `zone.locations` */
  locationKey: string;
  severity: ActivitySeverity;
};

/**
 * Event log preview: a header with "View all", then one row per entry.
 *
 * The card grows with however many rows it is given; the design shows a
 * single-row preview with the rest behind "View all".
 */
export function LatestActivityCard({
  entries,
  onViewAll,
}: {
  entries: ActivityEntry[];
  onViewAll?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing, softShadow } = useTheme();

  const severityColor = (severity: ActivitySeverity) =>
    severity === 'alarm'
      ? colors.failed
      : severity === 'warning'
      ? colors.warning
      : colors.success;

  return (
    <View
      style={[
        styles.card,
        {
          gap: spacing.sm - 2,
          borderRadius: radius.md,
          // the spec's white-on-white border; kept so the box model matches
          // the other cards, and it follows the card colour on dark
          borderColor: colors.card,
          backgroundColor: colors.card,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
        },
        softShadow,
      ]}
    >
      <View style={styles.header}>
        <Typography
          variant="captionBold"
          size={14}
          align="left"
          color={colors.primary}
          numberOfLines={1}
          style={styles.headerTitle}
        >
          {t('main.activity.title')}
        </Typography>

        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Typography
            variant="captionBold"
            size={12}
            color={colors.primary}
            numberOfLines={1}
          >
            {t('common.viewAll')}
          </Typography>
        </Pressable>
      </View>

      {entries.map(entry => {
        const tint = severityColor(entry.severity);
        return (
          <View
            key={entry.id}
            style={[
              styles.row,
              {
                gap: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: colors.backgroundSubtle,
                paddingVertical: spacing.xs + 2,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: tint,
                  boxShadow: `0px 0px 8px 0px ${tint}33`,
                },
              ]}
            />

            <Typography
              variant="captionBold"
              size={13}
              align="left"
              color={colors.text}
              numberOfLines={1}
              style={styles.entryLabel}
            >
              {`${entry.time} - ${t(
                `main.activity.events.${entry.eventKey}`,
              )} - ${t('zone.label', { number: entry.zoneNumber })}, ${t(
                `zone.locations.${entry.locationKey}`,
              )}`}
            </Typography>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexShrink: 1,
  },
  row: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryLabel: {
    flex: 1,
    minWidth: 0,
  },
});
