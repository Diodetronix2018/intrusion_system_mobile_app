import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectionStatus from '../icons/svg/connection-status.svg';
import { UserIcon } from '../icons';
import { useTheme } from '../theme';
import {
  useIotConnection,
  type IotConnectionStatus,
} from '../utils/IotConnection';
import { useResponsive } from '../utils/responsive';
import { Typography } from './Typography';

/** Maps the shared MQTT connection's status to the header mark's colour. */
function connectionStatusColor(
  status: IotConnectionStatus,
  colors: { success: string; warning: string; failed: string },
): string {
  switch (status) {
    case 'connected':
      return colors.success;
    case 'connecting':
    case 'reconnecting':
      return colors.warning;
    case 'disconnected':
    case 'error':
      return colors.failed;
    default:
      return colors.failed;
  }
}

/**
 * Sits above the bottom tabs: app name, connection status, profile.
 * Owns the top safe-area inset, so the screens below it use
 * `edges={['left', 'right']}`.
 */
export function AppHeader() {
  const { t } = useTranslation();
  const { colors, spacing, sizing } = useTheme();
  const { gutter } = useResponsive();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { status: connectionStatus, reconnect } = useIotConnection();
  const canReconnect =
    connectionStatus === 'disconnected' || connectionStatus === 'error';
  const connectionColor = connectionStatusColor(connectionStatus, colors);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md,
          paddingHorizontal: gutter,
          backgroundColor: colors.headerBackground,
          borderBottomColor: colors.headerBorder,
        },
      ]}
    >
      <Typography
        variant="subheading"
        size={20}
        align="left"
        color={colors.headerForeground}
        numberOfLines={1}
        style={styles.name}
      >
        DTX SECURE
      </Typography>

      <View style={[styles.actions, { gap: spacing.md }]}>
        {/* Colour follows the live MQTT connection — green once connected,
            amber while (re)connecting, red once it's actually dropped —
            rather than the fixed green the mark used to ship with. */}
        {/* Tappable only while the connection is actually down, to
            reconnect straight away instead of waiting on the back-off. */}
        <Pressable
          onPress={reconnect}
          disabled={!canReconnect}
          hitSlop={sizing.hitSlop}
          accessibilityRole={canReconnect ? 'button' : undefined}
          accessibilityLabel={t(`main.connection.${connectionStatus}`)}
          accessibilityHint={
            canReconnect ? t('main.connection.tapToReconnect') : undefined
          }
        >
          <ConnectionStatus width={34} height={34} color={connectionColor} />
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Profile')}
          hitSlop={sizing.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('profile.title')}
          style={[
            styles.avatar,
            {
              backgroundColor: colors.headerAccent,
              borderColor: colors.headerBorder,
            },
          ]}
        >
          <UserIcon size={20} color={colors.headerForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
