import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Typography } from '../../../components';
import { useTheme } from '../../../theme';
import { useIotConnection } from '../../../utils/IotConnection';

/**
 * Shown on the main screen whenever the device connection has dropped:
 * a spinner while a reconnect attempt is running, otherwise a Reconnect
 * button that skips the automatic back-off and tries straight away.
 * Hidden while connected and during the very first connect after launch.
 */
export function ConnectionBanner({
  style,
}: {
  /** Outer spacing — applied only when the banner actually renders. */
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { status, reconnect } = useIotConnection();

  if (status === 'connected' || status === 'connecting') {
    return null;
  }

  const reconnecting = status === 'reconnecting';

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        style,
        {
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingLeft: spacing.md,
          paddingRight: spacing.sm,
          backgroundColor: reconnecting
            ? colors.primaryMuted
            : colors.errorMuted,
        },
      ]}
    >
      <Icon
        name={reconnecting ? 'sync-outline' : 'cloud-offline-outline'}
        size={20}
        color={reconnecting ? colors.primary : colors.error}
      />

      <Typography
        variant="caption"
        weight="600"
        size={13}
        align="left"
        color={colors.text}
        numberOfLines={2}
        style={styles.message}
      >
        {t(
          reconnecting
            ? 'main.connection.bannerReconnecting'
            : 'main.connection.bannerOffline',
        )}
      </Typography>

      {reconnecting ? (
        <ActivityIndicator
          color={colors.primary}
          size="small"
          style={{ marginRight: spacing.sm }}
        />
      ) : (
        <Pressable
          onPress={reconnect}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('main.connection.reconnect')}
          style={({ pressed }) => [
            styles.button,
            {
              paddingHorizontal: spacing.md,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Typography variant="captionBold" size={12} color={colors.onPrimary}>
            {t('main.connection.reconnect')}
          </Typography>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    minHeight: 48,
  },
  message: {
    flex: 1,
    minWidth: 0,
  },
  button: {
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
