import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import type { EventItem } from './buildEventItems';
import { eventStatusColor, formatEventTimestamp } from './eventDisplay';

const ICON_CIRCLE = 36;

/** One event row: status-tinted icon ring, title, optional subtitle, and a readable timestamp. */
export function EventCard({ event }: { event: EventItem }) {
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const Glyph = event.icon;
  const tint = eventStatusColor(event.status, colors);

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
