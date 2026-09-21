import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';
import { Button } from './Button';
import { Icon } from './Icon';
import { Typography } from './Typography';

/** Always 24-hour internally (0-23) — the device's own `aar`/etc. wire format.
 *  Only the picker itself displays 12-hour + AM/PM. */
export type Time = { hour: number; minute: number };

/** 24-hour "HH:MM", e.g. for a device-facing log line. */
export const formatTime = ({ hour, minute }: Time) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

function to12Hour(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const mod = hour24 % 12;
  return { hour12: mod === 0 ? 12 : mod, period };
}

/** 12-hour "h:MM AM/PM", e.g. "10:30 PM" — what the field shows. */
export function formatTime12(value: Time): string {
  const { hour12, period } = to12Hour(value.hour);
  return `${hour12}:${String(value.minute).padStart(2, '0')} ${period}`;
}

/** A fixed, arbitrary date — only its time-of-day component is ever read. */
function toDate(value: Time): Date {
  const date = new Date(2000, 0, 1);
  date.setHours(value.hour, value.minute, 0, 0);
  return date;
}

function fromDate(date: Date): Time {
  return { hour: date.getHours(), minute: date.getMinutes() };
}

/**
 * A tappable "10:30 PM" field backed by
 * @react-native-community/datetimepicker in time-only mode — the platform's
 * own time picker (Android's native dialog via the library's recommended
 * imperative `DateTimePickerAndroid.open`, iOS's spinner in a bottom sheet)
 * rather than a hand-built one.
 *
 * This is a native module: after installing it, both platforms need a full
 * rebuild (`pod install` + rebuild on iOS, a fresh Gradle build on Android)
 * before it actually works — a Metro reload alone isn't enough.
 */
export function TimePicker({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: Time;
  onChange: (next: Time) => void;
  accessibilityLabel?: string;
}) {
  const { colors, radius, spacing } = useTheme();
  const { gutter, contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'time',
        is24Hour: false,
        onValueChange: (_event, selectedDate) => {
          if (selectedDate) {
            onChange(fromDate(selectedDate));
          }
        },
      });
      return;
    }
    setIosSheetOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.field,
          {
            gap: spacing.sm,
            borderRadius: radius.md,
            borderColor: colors.primary,
            backgroundColor: colors.chipBackground,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Icon name="time-outline" size={20} color={colors.primary} />
        <Typography variant="captionBold" size={20} color={colors.primary}>
          {formatTime12(value)}
        </Typography>
      </Pressable>

      {/* Android's own dialog (DateTimePickerAndroid.open, above) is the
          whole UI — nothing further to render here on that platform. */}
      {Platform.OS !== 'android' && (
        <Modal
          visible={iosSheetOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosSheetOpen(false)}
        >
          <Pressable
            style={[styles.scrim, { backgroundColor: colors.overlay }]}
            onPress={() => setIosSheetOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          />

          <View style={styles.anchor} pointerEvents="box-none">
            <View
              style={[
                styles.sheet,
                {
                  maxWidth: contentMaxWidth,
                  backgroundColor: colors.card,
                  borderTopLeftRadius: radius.lg + 8,
                  borderTopRightRadius: radius.lg + 8,
                  paddingHorizontal: gutter,
                  paddingTop: spacing.md,
                  paddingBottom: insets.bottom + spacing.xl,
                  gap: spacing.lg,
                },
              ]}
            >
              <View style={[styles.grabber, { backgroundColor: colors.border }]} />

              <DateTimePicker
                value={toDate(value)}
                mode="time"
                is24Hour={false}
                display="spinner"
                onValueChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    onChange(fromDate(selectedDate));
                  }
                }}
              />

              <Button title="Done" onPress={() => setIosSheetOpen(false)} />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    alignSelf: 'center',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
});
