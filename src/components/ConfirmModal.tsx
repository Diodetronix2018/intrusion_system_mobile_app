import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import type { IconProps } from '../icons';
import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';
import { Button } from './Button';
import { Typography } from './Typography';

const ICON_SIZE = 56;

/**
 * Centred confirmation card — icon, title, message, then Cancel and the
 * action side by side. Same card language as `BankDetailsReminderModal`.
 * `destructive` tints the icon and the action button red (e.g. Logout).
 */
export function ConfirmModal({
  visible,
  icon: IconComponent,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  icon: React.ComponentType<IconProps>;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const { contentMaxWidth } = useResponsive();

  const tint = destructive ? colors.error : colors.primary;
  const well = destructive ? colors.errorMuted : colors.primaryMuted;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={[styles.anchor, { backgroundColor: colors.overlay }]}>
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
              { borderRadius: ICON_SIZE / 2, backgroundColor: well },
            ]}
          >
            <IconComponent size={26} color={tint} />
          </View>

          <Typography
            variant="cardTitle"
            size={17}
            align="center"
            color={colors.text}
          >
            {title}
          </Typography>

          <Typography
            variant="cardSubtitle"
            align="center"
            color={colors.textSecondary}
          >
            {message}
          </Typography>

          <View
            style={[styles.actions, { gap: spacing.md, marginTop: spacing.sm }]}
          >
            <Button
              title={cancelLabel}
              variant="outline"
              onPress={onCancel}
              style={styles.action}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? 'error' : 'contained'}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
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
    // 5% either side, so it reads as a card rather than a full-width sheet
    width: '90%',
    alignItems: 'center',
  },
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  action: {
    flex: 1,
  },
});
