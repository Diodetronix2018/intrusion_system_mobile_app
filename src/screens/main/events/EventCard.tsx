import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import type { EventChip, EventDetail, EventItem } from './buildEventItems';
import { eventStatusColor, formatEventTimestamp } from './eventDisplay';

const ICON_CIRCLE = 36;

/** An icon followed by its value — one of a card's optional details. */
function Detail({
  detail: { icon: DetailIcon, label },
  color,
  gap,
  shrink = false,
}: {
  detail: EventDetail;
  color: string;
  gap: number;
  /** Let this one truncate when the line runs out of room. */
  shrink?: boolean;
}) {
  return (
    <View style={[styles.detail, shrink && styles.shrink, { gap }]}>
      <DetailIcon size={12} color={color} />
      <Typography
        variant="caption"
        size={11}
        weight="400"
        lineHeight="100%"
        letterSpacing={0}
        align="left"
        color={color}
        numberOfLines={1}
        style={styles.shrink}
      >
        {label}
      </Typography>
    </View>
  );
}

/** A tinted status pill: icon + label in the chip's own status colour. */
function Chip({ chip }: { chip: EventChip }) {
  const { colors, radius, spacing } = useTheme();
  const tint = eventStatusColor(chip.status, colors);
  const ChipIcon = chip.icon;
  return (
    <View
      style={[
        styles.chip,
        {
          gap: spacing.xs,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.pill,
          // 10% wash of the status colour, as on ZoneDetails' status pill
          backgroundColor: `${tint}1A`,
        },
      ]}
    >
      <ChipIcon size={12} color={tint} />
      <Typography variant="captionBold" size={11} color={tint} numberOfLines={1}>
        {chip.label}
      </Typography>
    </View>
  );
}

/**
 * One event row: status-tinted icon ring, then the title (with an optional
 * detail pinned to the right) over the timestamp (followed by an optional
 * detail that truncates first), with any status chips (zone cards) between
 * the two.
 */
export function EventCard({ event }: { event: EventItem }) {
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const Glyph = event.icon;
  const tint = eventStatusColor(event.status, colors);
  const timestamp = formatEventTimestamp(event.datetime);

  return (
    <View
      style={[
        styles.card,
        {
          gap: spacing.md,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        layeredShadow,
      ]}
    >
      <View style={[styles.iconCircle, { borderColor: tint, backgroundColor: colors.card }]}>
        <Glyph size={18} color={tint} />
      </View>

      <View style={styles.text}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Typography
            variant="captionBold"
            size={14}
            weight="700"
            lineHeight="100%"
            letterSpacing={0}
            align="left"
            color={colors.primary}
            numberOfLines={1}
            style={styles.shrink}
          >
            {event.title}
          </Typography>
          {event.titleDetail ? (
            <View style={styles.pushRight}>
              <Detail
                detail={event.titleDetail}
                color={colors.textSecondary}
                gap={spacing.xs}
              />
            </View>
          ) : null}
        </View>

        {event.chips?.length ? (
          <View style={[styles.chips, { gap: spacing.xs + 2 }]}>
            {event.chips.map(chip => (
              <Chip key={chip.label} chip={chip} />
            ))}
          </View>
        ) : null}


        <View style={[styles.row, styles.timestamp, { gap: spacing.xs }]}>
          <Typography
            variant="caption"
            size={11}
            weight="400"
            lineHeight="100%"
            letterSpacing={0}
            align="left"
            color={colors.textSecondary}
            numberOfLines={1}
          >
            {timestamp}
          </Typography>
          {event.metaDetail ? (
            <>
              {timestamp ? (
                <View style={[styles.separator, { backgroundColor: colors.textMuted }]} />
              ) : null}
              <Detail
                detail={event.metaDetail}
                color={colors.textSecondary}
                gap={spacing.xs / 2}
                shrink
              />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderWidth: 1,
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
  text: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shrink: {
    flexShrink: 1,
    minWidth: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  pushRight: {
    marginLeft: 'auto',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  timestamp: {
    marginTop: 4,
  },
});
