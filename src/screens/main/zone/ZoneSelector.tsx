import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../icons';
import { useTheme } from '../../../theme';

/** Card with the current zone name and an arrow either side. */
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
  const { colors, radius, sizing, spacing, softShadow } = useTheme();

  const arrowStyle = ({ pressed }: { pressed: boolean }) => [
    styles.arrow,
    {
      borderRadius: radius.full,
      backgroundColor: colors.accentWell,
      opacity: pressed ? 0.6 : 1,
    },
  ];

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        softShadow,
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={onPrevious}
          hitSlop={sizing.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('zone.previous')}
          style={arrowStyle}
        >
          <ChevronLeftIcon size={18} color={colors.primary} />
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
          <ChevronRightIcon size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
});
