import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { HomeAwayGlyph, HomeGlyph } from './ModeGlyphs';
import type { ArmMode } from './useMainControls';

const ICON_SIZE = 44;

/**
 * The brand-filled panel status panel: icon, mode title, then a status line.
 *
 * The title and icon track the same Stay/Away selection as the mode cards
 * below — the same glyphs (`HomeGlyph`/`HomeAwayGlyph`), not a separate icon.
 *
 * The two borders are pure-white alphas from the design (#FFFFFF14 on the
 * card, #FFFFFF1F on the icon ring). They are written inline rather than
 * tokenised because they are derived from white and identical in both themes.
 */
export function StatusCard({
  mode,
  summary,
  online = true,
  onSwitchDevice,
}: {
  mode: ArmMode;
  summary: string;
  /** Drives the dot colour */
  online?: boolean;
  /** Shown as a button in place of the balancing spacer, only when the
   *  signed-in user has more than one device to switch between. */
  onSwitchDevice?: () => void;
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
      <View style={[styles.header, { gap: spacing.md }]}>
        <View style={styles.iconRing}>
          <Glyph size={22} color={colors.onPrimary} />
        </View>

        <Typography
          variant="screenTitle"
          size={16}
          uppercase
          align="center"
          color={colors.onPrimary}
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Typography>

        {/* balances the icon so the title stays optically centred, unless
            there's an actual device to switch to */}
        {onSwitchDevice ? (
          <Pressable
            onPress={onSwitchDevice}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('main.switchDevice.action')}
            style={styles.spacer}
          >
            <Icon name="swap-horizontal-outline" size={22} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.onPrimaryDivider }]}
      />

      <View style={[styles.statusLine, { gap: spacing.sm }]}>
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
          color={colors.onPrimaryMuted}
          numberOfLines={2}
          style={styles.summary}
        >
          {summary}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    // #FFFFFF14
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow:
      '0px 10px 28px -10px #00000026, inset 0px 1px 0px 0px #FFFFFF12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRing: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 1,
    // #FFFFFF1F
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: 1,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summary: {
    flex: 1,
    minWidth: 0,
  },
});
