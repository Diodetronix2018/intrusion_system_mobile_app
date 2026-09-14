import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../theme';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 28;
const TRACK_PADDING = 2;
const THUMB_SIZE = TRACK_HEIGHT - TRACK_PADDING * 2;
const TRAVEL = TRACK_WIDTH - TRACK_PADDING * 2 - THUMB_SIZE;

/**
 * 52x28 pill switch.
 *
 * Hand-rolled rather than React Native's <Switch>, which ignores width and
 * height on Android and renders the platform's own size.
 */
export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 160,
      // the track colour animates too, and colour cannot run on the native
      // driver — the cost is negligible for a control this size
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.switchTrackOff, colors.primary],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  const dimmed = { opacity: disabled ? 0.5 : 1 };

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: trackColor },
          dimmed,
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: colors.onPrimary, transform: [{ translateX }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});
