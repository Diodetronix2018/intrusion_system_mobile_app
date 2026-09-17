import React, { useCallback, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { Typography } from './Typography';

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;

/**
 * Horizontal slider for a small integer range (e.g. detection count 1-10).
 *
 * Built on the `PanResponder` that ships with core React Native rather than
 * a gesture library the app doesn't otherwise depend on — precise enough for
 * a handful of discrete steps, snapping to the nearest integer as you drag.
 */
export function Slider({
  min,
  max,
  value,
  onChange,
  accessibilityLabel,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
  accessibilityLabel?: string;
}) {
  const { colors, spacing } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  // PanResponder callbacks are created once and close over stale state, so
  // the current width lives in a ref they can read live.
  const trackWidthRef = useRef(0);

  const valueFromX = useCallback(
    (x: number) => {
      const width = trackWidthRef.current;
      if (width <= 0) {
        return value;
      }
      const ratio = Math.min(1, Math.max(0, x / width));
      return Math.round(min + ratio * (max - min));
    },
    [min, max, value],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => onChange(valueFromX(evt.nativeEvent.locationX)),
      onPanResponderMove: evt => onChange(valueFromX(evt.nativeEvent.locationX)),
    }),
  ).current;

  const ratio = max === min ? 0 : (value - min) / (max - min);

  return (
    <View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        style={[styles.touchArea, { paddingVertical: spacing.md }]}
        onLayout={e => {
          const width = e.nativeEvent.layout.width;
          setTrackWidth(width);
          trackWidthRef.current = width;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.primary, width: `${ratio * 100}%` },
            ]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              backgroundColor: colors.primary,
              borderColor: colors.card,
              left: Math.max(
                0,
                Math.min(trackWidth - THUMB_SIZE, ratio * trackWidth - THUMB_SIZE / 2),
              ),
            },
          ]}
        />
      </View>

      <View style={[styles.scaleRow, { marginTop: spacing.xs }]}>
        <Typography variant="caption" size={12} color={colors.textSecondary}>
          {min}
        </Typography>
        <Typography
          variant="captionBold"
          size={13}
          color={colors.primary}
        >
          {value}
        </Typography>
        <Typography variant="caption" size={12} color={colors.textSecondary}>
          {max}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
