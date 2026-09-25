import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';

export type SubsystemStatus = 'success' | 'warning' | 'failed';

const CIRCLE = 36;
const GLYPH = 18;

/** Ring + glyph over a label; the ring and label follow the status. */
export function StatusTile({
  label,
  glyph: Glyph,
  status,
  onPress,
}: {
  label: string;
  glyph: React.ComponentType<{ size: number; color: string }>;
  status: SubsystemStatus;
  onPress?: () => void;
}) {
  const { colors, radius, spacing } = useTheme();

  const ringColor =
    status === 'failed'
      ? colors.failed
      : status === 'warning'
      ? colors.warning
      : colors.success;

  // a healthy subsystem gets a plain drop shadow; the other two glow
  const ringShadow =
    status === 'success'
      ? { boxShadow: '0px 4px 10px -4px #00000012' }
      : {
          boxShadow: `0px 0px 14px 0px ${ringColor}66, 0px 6px 16px -10px #00000012`,
        };

  // black for healthy, the status colour otherwise
  const labelColor = status === 'success' ? colors.text : ringColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? label : undefined}
      style={({ pressed }) => [
        styles.tile,
        {
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingVertical: spacing.xs,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.ring, { borderColor: ringColor }, ringShadow]}>
        <Glyph size={GLYPH} color={colors.primary} />
      </View>

      <Typography
        variant="captionBold"
        size={9}
        color={labelColor}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 59,
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
