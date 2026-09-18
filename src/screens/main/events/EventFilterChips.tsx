import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { EVENT_CATEGORIES } from './eventCategories';
import type { EventFilter } from './useEvents';

const FILTERS: EventFilter[] = ['all', ...EVENT_CATEGORIES];

/**
 * The category filter row: a horizontally scrollable line of pill chips (10
 * options don't fit one screen width). Each chip sizes to its own label —
 * width is never fixed — with the selected one filled navy/bold-white and
 * the rest outlined navy-on-white, matching the design spec exactly.
 */
export function EventFilterChips({
  value,
  onChange,
}: {
  value: EventFilter;
  onChange: (next: EventFilter) => void;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <ScrollView
      horizontal
      // Fixed to its own content height — without this it has no intrinsic
      // size of its own, so as a plain child of the header's `flex: 1`
      // column it was expanding to soak up the column's leftover space
      // instead of just sitting at chip height, with its row centered
      // inside that oversized box.
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { gap: spacing.sm }]}
    >
      {FILTERS.map(id => {
        const active = id === value;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : `${colors.primary}1A`,
              },
            ]}
          >
            <Typography
              variant="captionBold"
              size={14}
              weight={active ? '700' : '400'}
              lineHeight="100%"
              letterSpacing={0}
              color={active ? colors.onPrimary : colors.primary}
              numberOfLines={1}
            >
              {t(`events.categories.${id}`)}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    height: 35,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
