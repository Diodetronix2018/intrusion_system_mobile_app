import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  ConfirmModal,
  OptionSheet,
  Screen,
  ScreenHeader,
  Typography,
} from '../../components';
import { LockIcon, LogOutIcon } from '../../icons';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';
import { PanelPasswordForm } from './PanelPasswordForm';

const ICON_SIZE = 72;

/**
 * The gate in front of the dashboard on every launch: the active device's
 * panel password must be entered before anything connects to it. Someone
 * who can't (forgot it, or it changed) can pick another of their devices
 * or log out — there's no dead end.
 */
export function PanelPasswordScreen() {
  const { t } = useTranslation();
  const { colors, spacing, sizing } = useTheme();
  const { session, switchDevice, signOut } = useSession();
  const thingName = session?.activeThingName ?? '';
  const devices = session?.devices ?? [];

  const [picking, setPicking] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t('panelPassword.title')}
        right={
          <Pressable
            onPress={() => setConfirmingSignOut(true)}
            hitSlop={sizing.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout')}
          >
            <LogOutIcon size={22} color={colors.error} />
          </Pressable>
        }
      />

      <Screen edges={['left', 'right']}>
        <View style={[styles.center, { gap: spacing.md, marginTop: spacing.xl }]}>
          <View
            style={[
              styles.iconWell,
              { borderRadius: ICON_SIZE / 2, backgroundColor: colors.primaryMuted },
            ]}
          >
            <LockIcon size={32} color={colors.primary} />
          </View>
          <Typography variant="cardSubtitle" align="center" color={colors.textSecondary}>
            {t('panelPassword.subtitle', { name: thingName })}
          </Typography>
        </View>

        <View style={{ gap: spacing.lg, marginTop: spacing['2xl'] }}>
          <PanelPasswordForm key={thingName} thingName={thingName} />
          {devices.length > 1 && (
            <Button
              title={t('panelPassword.changeDevice')}
              variant="outline"
              onPress={() => setPicking(true)}
            />
          )}
        </View>
      </Screen>

      <OptionSheet
        visible={picking}
        title={t('main.switchDevice.title')}
        options={devices.map(name => ({ value: name, label: name }))}
        selected={thingName}
        // only changes which device is being unlocked — still gated
        onSelect={switchDevice}
        onClose={() => setPicking(false)}
      />

      <ConfirmModal
        visible={confirmingSignOut}
        icon={LogOutIcon}
        title={t('profile.logout')}
        message={t('profile.logoutConfirm')}
        confirmLabel={t('profile.logout')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false);
          signOut();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
  },
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
