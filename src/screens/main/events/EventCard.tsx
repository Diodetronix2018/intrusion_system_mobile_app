import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import type { EventItem, EventStatus } from './buildEventItems';

const ICON_CIRCLE = 36;

/**
 * `"YYYY-MM-DD HH:mm:ss"` (device-local, no timezone marker) -> a
 * user-readable `"<time> · <date>"`, e.g. `"6:56 PM · 18 Sep 2026"`.
 */
function formatEventTimestamp(datetime?: string): string {
  if (!datetime) return '';
  // `new Date()` needs a `T` separator to parse this reliably across engines.
  const parsed = new Date(datetime.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return datetime;

  const time = parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const date = parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time} · ${date}`;
}

/** One event row: status-tinted icon ring, title, optional subtitle, and a readable timestamp. */
export function EventCard({ event }: { event: EventItem }) {
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const Glyph = event.icon;
  const tint = statusColor(event.status, colors);

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
        <Typography
          variant="captionBold"
          size={14}
          weight="700"
          lineHeight="100%"
          letterSpacing={0}
          align="left"
          color={colors.primary}
          numberOfLines={1}
        >
          {event.title}
        </Typography>
        {event.subtitle ? (
          <Typography
            variant="caption"
            size={12}
            weight="400"
            lineHeight="100%"
            letterSpacing={0}
            align="left"
            color={colors.textSecondary}
            numberOfLines={1}
            style={styles.subtitle}
          >
            {event.subtitle}
          </Typography>
        ) : null}
        <Typography
          variant="caption"
          size={11}
          weight="400"
          lineHeight="100%"
          letterSpacing={0}
          align="left"
          color={colors.textSecondary}
          numberOfLines={1}
          style={styles.timestamp}
        >
          {formatEventTimestamp(event.datetime)}
        </Typography>
      </View>
    </View>
  );
}

function statusColor(
  status: EventStatus,
  colors: { success: string; warning: string; failed: string; primary: string },
): string {
  switch (status) {
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'failed':
      return colors.failed;
    default:
      return colors.primary;
  }
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
  subtitle: {
    marginTop: 2,
  },
  timestamp: {
    marginTop: 4,
  },
});
