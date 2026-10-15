import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { useResponsive } from '../../../utils/responsive';

/**
 * Blocks the screen while a device switch settles — from picking the new
 * device until its connection is up and its state has loaded — so nobody
 * taps Stay/Away against the previous device's state or a connection that
 * isn't there yet. The Android back button can't dismiss it; the caller
 * clears it on success or after its own timeout.
 */
export function SwitchingDeviceOverlay({
  thingName,
}: {
  /** The device being switched to; null hides the overlay. */
  thingName: string | null;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const { contentMaxWidth } = useResponsive();

  return (
    <Modal
      visible={thingName !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={[styles.anchor, { backgroundColor: colors.overlay }]}>
        <View
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          style={[
            styles.card,
            {
              maxWidth: contentMaxWidth,
              gap: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.card,
              padding: spacing.xl,
            },
            layeredShadow,
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />

          <Typography
            variant="cardTitle"
            size={17}
            align="center"
            color={colors.text}
          >
            {t('main.switchDevice.switching')}
          </Typography>

          <Typography
            variant="cardSubtitle"
            align="center"
            color={colors.textSecondary}
          >
            {t('main.switchDevice.switchingBody', { name: thingName ?? '' })}
          </Typography>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '90%',
    alignItems: 'center',
  },
});
