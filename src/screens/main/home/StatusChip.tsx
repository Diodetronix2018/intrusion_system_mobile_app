import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import type { SubsystemStatus } from './StatusTile';

/**
 * Dot + bold label pill. Colours are literal per-status Figma values (a
 * light tint background, ~30%-alpha border, solid dot, darker text) rather
 * than the flat `colors.success`/`warning`/`failed` tokens used elsewhere —
 * this is its own light/dark-shade trio per status, not a themed surface.
 */
const CHIP_COLORS: Record<
  SubsystemStatus,
  { background: string; border: string; dot: string; text: string }
> = {
  success: { background: '#DCFCE7', border: '#00C8534D', dot: '#00C853', text: '#0F7A3D' },
  warning: { background: '#FEF3C7', border: '#F59E0B4D', dot: '#F59E0B', text: '#92400E' },
  failed: { background: '#FEE0E0', border: '#EF44444D', dot: '#EF4444', text: '#C41E1E' },
};

export function StatusChip({
  status,
  label,
}: {
  status: SubsystemStatus;
  label: string;
}) {
  const { radius } = useTheme();
  const palette = CHIP_COLORS[status];

  return (
    <View
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <Typography
        variant="captionBold"
        size={10}
        weight="700"
        lineHeight="100%"
        letterSpacing={0}
        color={palette.text}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
