import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronDownIcon, ChevronUpIcon } from '../icons';
import { useTheme } from '../theme';
import { Typography } from './Typography';

export type Time = { hour: number; minute: number };

/** 24-hour "HH:MM". */
export const formatTime = ({ hour, minute }: Time) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const wrap = (value: number, size: number) => ((value % size) + size) % size;

/**
 * Hour / minute stepper.
 *
 * Deliberately not @react-native-community/datetimepicker: that is a native
 * module, so it would need an app rebuild and would render the OS dialog
 * rather than this design. A stepper covers setting a fixed arm time and
 * stays fully themeable.
 */
export function TimePicker({
  value,
  onChange,
  /** Minutes move in these steps — 5 keeps the stepper to 12 taps a cycle */
  minuteStep = 5,
  accessibilityLabel,
}: {
  value: Time;
  onChange: (next: Time) => void;
  minuteStep?: number;
  accessibilityLabel?: string;
}) {
  const { colors, radius, spacing } = useTheme();

  const column = (
    unit: 'hour' | 'minute',
    current: number,
    size: number,
    step: number,
  ) => {
    const shift = (direction: 1 | -1) =>
      onChange({ ...value, [unit]: wrap(current + direction * step, size) });

    const arrow = (direction: 1 | -1) => (
      <Pressable
        onPress={() => shift(direction)}
        accessibilityRole="button"
        accessibilityLabel={`${unit} ${direction > 0 ? 'up' : 'down'}`}
        hitSlop={8}
        style={({ pressed }) => [styles.arrow, { opacity: pressed ? 0.5 : 1 }]}
      >
        {direction > 0 ? (
          <ChevronUpIcon size={18} color={colors.primary} />
        ) : (
          <ChevronDownIcon size={18} color={colors.primary} />
        )}
      </Pressable>
    );

    return (
      <View style={[styles.column, { gap: spacing.xs }]}>
        {arrow(1)}
        <View
          style={[
            styles.cell,
            {
              borderRadius: radius.md,
              borderColor: colors.primary,
              backgroundColor: colors.chipBackground,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Typography variant="captionBold" size={24} color={colors.primary}>
            {String(current).padStart(2, '0')}
          </Typography>
        </View>
        {arrow(-1)}
      </View>
    );
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, { gap: spacing.md }]}
    >
      {column('hour', value.hour, 24, 1)}

      <Typography variant="captionBold" size={24} color={colors.primary}>
        :
      </Typography>

      {column('minute', value.minute, 60, minuteStep)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    alignItems: 'center',
  },
  arrow: {
    padding: 2,
  },
  cell: {
    borderWidth: 1,
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
