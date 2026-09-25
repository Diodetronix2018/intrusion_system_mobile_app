import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { HomeAwayGlyph, HomeGlyph } from './ModeGlyphs';
import type { ArmMode } from './useMainControls';

const ICON_SIZE = 48;
/** The oversized, faded mode glyph tucked into the top-right corner. */
const WATERMARK_SIZE = 150;

/**
 * The brand-filled hero: status pill and device switcher on top, the mode
 * icon and title below, and whatever is passed as `children` (the Stay/Away
 * chips) along the bottom — so the current mode and the control that changes
 * it live in one card.
 *
 * The white alphas (borders, pill, watermark) are identical in both themes,
 * so they're written inline rather than tokenised.
 */
export function StatusCard({
  mode,
  summary,
  online = true,
  onSwitchDevice,
  children,
}: {
  mode: ArmMode;
  summary: string;
  /** Drives the dot colour */
  online?: boolean;
  /** Shown as a button in the top-right, only when the signed-in user has
   *  more than one device to switch between. */
  onSwitchDevice?: () => void;
  /** Rendered along the bottom of the card, under a divider. */
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const Glyph = mode === 'stay' ? HomeGlyph : HomeAwayGlyph;
  const title = t(
    mode === 'stay' ? 'main.status.titleStay' : 'main.status.titleAway',
  );

  return (
    <View
      style={[
        styles.card,
        {
          padding: spacing.xl,
          gap: spacing.lg,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <View style={styles.watermark} pointerEvents="none">
        <Glyph size={WATERMARK_SIZE} color={colors.onPrimary} />
      </View>

      <View style={[styles.topRow, { gap: spacing.sm }]}>
        <View
          style={[
            styles.pill,
            { gap: spacing.sm, paddingHorizontal: spacing.md },
          ]}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: online ? colors.success : colors.textMuted },
            ]}
          />
          <Typography
            variant="cardSubtitle"
            weight="600"
            size={12}
            align="left"
            color={colors.onPrimary}
            numberOfLines={1}
            style={styles.shrink}
          >
            {summary}
          </Typography>
        </View>

        {onSwitchDevice && (
          <Pressable
            onPress={onSwitchDevice}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('main.switchDevice.action')}
            style={styles.switchButton}
          >
            <Icon
              name="swap-horizontal-outline"
              size={20}
              color={colors.onPrimary}
            />
          </Pressable>
        )}
      </View>

      <View style={[styles.header, { gap: spacing.md }]}>
        <View style={styles.iconRing}>
          <Glyph size={24} color={colors.onPrimary} />
        </View>

        <Typography
          variant="screenTitle"
          size={20}
          align="left"
          color={colors.onPrimary}
          numberOfLines={2}
          style={styles.shrink}
        >
          {title}
        </Typography>
      </View>

      {children && (
        <>
          <View style={styles.divider} />
          {children}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    boxShadow: '0px 14px 32px -12px #00000040, inset 0px 1px 0px 0px #FFFFFF12',
  },
  watermark: {
    position: 'absolute',
    top: -18,
    right: -28,
    opacity: 0.07,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  switchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRing: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  shrink: {
    flexShrink: 1,
    minWidth: 0,
  },
});
