import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../icons';
import { useTheme } from '../../../theme';

/** Flat bar with the current zone name and a bare arrow either side. */
export function ZoneSelector({
  label,
  onPrevious,
  onNext,
}: {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, sizing } = useTheme();

  const arrowStyle = ({ pressed }: { pressed: boolean }) => [
    styles.arrow,
    { opacity: pressed ? 0.5 : 1 },
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceMuted,
        },
      ]}
    >
      <Pressable
        onPress={onPrevious}
        hitSlop={sizing.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t('zone.previous')}
        style={arrowStyle}
      >
        <ChevronLeftIcon size={20} color={colors.primary} />
      </Pressable>

      <Typography
        variant="captionBold"
        size={18}
        uppercase
        color={colors.primary}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Typography>

      <Pressable
        onPress={onNext}
        hitSlop={sizing.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t('zone.next')}
        style={arrowStyle}
      >
        <ChevronRightIcon size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 25 comes straight from the design rather than the 4pt scale
    paddingHorizontal: 25,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
});
