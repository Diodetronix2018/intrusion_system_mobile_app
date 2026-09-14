import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
};

/**
 * Pick-one row of pill chips.
 *
 * Widths come from the content plus 12pt side padding rather than the fixed
 * 84/47 in the spec, so the longer translations ("Burglar + Fire", and the
 * Tamil and Hindi strings) don't get clipped.
 */
export function ChipGroup<T extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel,
}: {
  options: readonly ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel?: string;
}) {
  const { colors, spacing } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { gap: spacing.sm }]}
    >
      {options.map(option => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : colors.chipBackground,
                borderColor: colors.primary,
                // the filled chip has no border in the spec; keeping a
                // transparent one of the same width stops it jumping by 2pt
                borderWidth: 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Typography
              variant="cardSubtitle"
              size={13}
              weight={isSelected ? '700' : '400'}
              color={isSelected ? colors.onPrimary : colors.primary}
              numberOfLines={1}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    minHeight: 32,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
