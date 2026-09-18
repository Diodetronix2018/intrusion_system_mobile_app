import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { eventStatusColor, formatEventTimestamp } from '../events';
import type { EventItem } from '../events';
import { useTheme } from '../../../theme';

/**
 * Event log preview: a header with "View all", then one row per entry
 * showing just the status and timestamp — the full detail (icon, subtitle)
 * lives on the Events tab itself.
 *
 * The card grows with however many rows it is given; the design shows a
 * two-row preview with the rest behind "View all".
 */
export function LatestActivityCard({
  entries,
  onViewAll,
}: {
  entries: EventItem[];
  onViewAll?: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing, softShadow } = useTheme();

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

      {entries.length > 0 && (
        <View
          style={[
            styles.list,
            {
              borderRadius: radius.sm,
              backgroundColor: colors.backgroundSubtle,
            },
          ]}
        >
          {entries.map((entry, index) => {
            const tint = eventStatusColor(entry.status, colors);
            return (
              <View
                key={entry.id}
                style={[
                  styles.row,
                  {
                    gap: spacing.sm,
                    paddingVertical: spacing.xs + 2,
                    paddingHorizontal: spacing.sm,
                  },
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
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
                  {entry.title}
                </Typography>

                <Typography
                  variant="caption"
                  size={11}
                  align="right"
                  color={colors.textSecondary}
                  numberOfLines={1}
                >
                  {formatEventTimestamp(entry.datetime)}
                </Typography>
              </View>
            );
          })}
        </View>
      )}
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
  list: {
    overflow: 'hidden',
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
