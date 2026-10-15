import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { eventStatusColor, formatEventTimestamp } from '../events';
import type { EventItem } from '../events';
import { useTheme } from '../../../theme';

/** A smaller take on the Events card's icon ring, to fit the compact row. */
const ICON_CIRCLE = 24;

/**
 * Event log preview: a header with "View all", then one row per entry
 * showing the event's icon (in the same status-tinted ring as the Events
 * tab), title and timestamp — the full detail (chips, details) lives on the
 * Events tab itself.
 *
 * The card grows with however many rows it is given; the design shows a
 * five-row preview with the rest behind "View all". With no rows it shows
 * a spinner during the first load, then "No activity found" (or a load
 * error) instead of an empty card.
 */
export function LatestActivityCard({
  entries,
  loading = false,
  error = false,
  onViewAll,
}: {
  entries: EventItem[];
  /** The event history is still loading. */
  loading?: boolean;
  /** The event history failed to load. */
  error?: boolean;
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

      {entries.length === 0 && (
        <View
          style={[
            styles.empty,
            {
              borderRadius: radius.sm,
              backgroundColor: colors.backgroundSubtle,
              paddingVertical: spacing.lg,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Typography
              variant="caption"
              size={13}
              align="center"
              color={error ? colors.error : colors.textSecondary}
            >
              {t(error ? 'main.activity.error' : 'main.activity.empty')}
            </Typography>
          )}
        </View>
      )}

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
            const Glyph = entry.icon;
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
                    styles.iconCircle,
                    { borderColor: tint, backgroundColor: colors.card },
                  ]}
                >
                  <Glyph size={13} color={tint} />
                </View>

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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryLabel: {
    flex: 1,
    minWidth: 0,
  },
});
