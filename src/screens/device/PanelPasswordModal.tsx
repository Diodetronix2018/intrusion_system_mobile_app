import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../components';
import { LockIcon } from '../../icons';
import { useTheme } from '../../theme';
import { useResponsive } from '../../utils/responsive';
import { PanelPasswordForm } from './PanelPasswordForm';

const ICON_SIZE = 56;

/**
 * Asks for a device's panel password before switching to it — once per app
 * run per device. Same card language as `ConfirmModal`.
 */
export function PanelPasswordModal({
  thingName,
  onUnlocked,
  onCancel,
}: {
  /** The device to unlock; null hides the modal. */
  thingName: string | null;
  onUnlocked: () => void;
  onCancel: () => void;
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
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.anchor, { backgroundColor: colors.overlay }]}
      >
        <View
          accessibilityViewIsModal
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
          <View
            style={[
              styles.iconWell,
              { borderRadius: ICON_SIZE / 2, backgroundColor: colors.primaryMuted },
            ]}
          >
            <LockIcon size={26} color={colors.primary} />
          </View>

          <Typography variant="cardTitle" size={17} align="center" color={colors.text}>
            {t('panelPassword.title')}
          </Typography>

          <Typography variant="cardSubtitle" align="center" color={colors.textSecondary}>
            {t('panelPassword.subtitle', { name: thingName ?? '' })}
          </Typography>

          {thingName !== null && (
            <PanelPasswordForm
              key={thingName}
              thingName={thingName}
              onUnlocked={onUnlocked}
              onCancel={onCancel}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
