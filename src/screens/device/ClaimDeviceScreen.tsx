import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  ConfirmModal,
  Icon,
  Input,
  Screen,
  ScreenHeader,
  Typography,
} from '../../components';
import { useSession } from '../../session/SessionProvider';
import {
  ClaimRejectedError,
  DeviceLimitError,
  DevicePasswordError,
  normalizeThingName,
  parseClaimQr,
} from '../../session/deviceClaim';
import { EyeIcon, EyeOffIcon, LockIcon, LogOutIcon } from '../../icons';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  MAX_PANEL_PASSWORD_LENGTH,
  validatePanelPassword,
  validateRequired,
  ValidationError,
} from '../../utils/validation';
import { QrScanner } from './QrScanner';

type Mode = 'scan' | 'manual';
type Errors = {
  deviceId?: ValidationError;
  claimCode?: ValidationError;
  password?: ValidationError;
};

/**
 * Links a physical panel to the signed-in account — the whole app until one is
 * claimed. Scanning is the default path; typing the details in is the fallback
 * behind "Enter manually". Either way the device password is typed in — a scan
 * fills the device ID and claim code, then lands on the form for it.
 */
export function ClaimDeviceScreen() {
  const { colors, spacing, sizing } = useTheme();
  const { t } = useTranslation();
  const message = useValidationMessage();
  const { claimDevice, signOut } = useSession();
  const navigation = useNavigation();
  // Whether there's somewhere to go back to: false when this is the
  // mandatory gate for a first-ever claim (nothing before it on the stack),
  // true when it was opened from Profile to add another device.
  const canGoBack = navigation.canGoBack();

  // The first-claim gate is the whole app until a device is linked, so its
  // header carries a logout (e.g. to try another account) — same
  // confirmation as Profile's Logout.
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const [mode, setMode] = useState<Mode>('scan');
  const [deviceId, setDeviceId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [claiming, setClaiming] = useState(false);
  // Blocks repeat scans (the reader fires continuously) while a claim runs.
  const claimingRef = useRef(false);

  const runClaim = useCallback(
    async (thingName: string, code: string, devicePassword: string) => {
      if (claimingRef.current) {
        return;
      }
      claimingRef.current = true;
      setClaiming(true);
      try {
        await claimDevice(thingName, code, devicePassword);
        Toast.show({
          type: 'success',
          text1: t('claim.successTitle'),
          text2: t('claim.successBody'),
        });
        // First-ever claim: `hasDevice` flips true and the root navigator
        // swaps this screen out for the app itself, nothing to do here.
        // Adding another device on top of one already owned: `hasDevice`
        // was already true, so that swap doesn't happen — leave explicitly.
        if (canGoBack) {
          navigation.goBack();
        }
      } catch (err: any) {
        const rejected = err instanceof ClaimRejectedError;
        const badPassword = err instanceof DevicePasswordError;
        if (badPassword && !err.unavailable) {
          // A wrong password is a field error, shown under the password input.
          setErrors({ password: { key: 'claim.wrongPasswordBody' } });
        } else if (err instanceof DeviceLimitError) {
          Toast.show({
            type: 'error',
            text1: t('claim.limitTitle'),
            text2: t('claim.limitBody', { count: err.max }),
          });
        } else {
          Toast.show({
            type: 'error',
            text1: badPassword
              ? t('claim.wrongPasswordTitle')
              : rejected
              ? t('claim.rejectedTitle')
              : t('claim.failedTitle'),
            text2: badPassword
              ? t('claim.passwordUnavailableBody')
              : rejected
              ? t('claim.rejectedBody')
              : err?.message || t('auth.errors.tryAgain'),
          });
        }
        // Let them try again (rescan / re-enter).
        claimingRef.current = false;
        setClaiming(false);
      }
    },
    [claimDevice, t, canGoBack, navigation],
  );

  const onScanned = useCallback(
    (value: string) => {
      const parsed = parseClaimQr(value);
      if (!parsed) {
        // The reader fires on every frame, so stay quiet once a claim started.
        if (!claimingRef.current) {
          Toast.show({ type: 'error', text1: t('claim.invalidQr') });
        }
        return;
      }
      // The QR has no password — prefill the form and let them type it.
      setDeviceId(parsed.thingName);
      setClaimCode(parsed.claimCode);
      setErrors({});
      setMode('manual');
    },
    [t],
  );

  const onManualSubmit = useCallback(() => {
    // Normalize the same way as a scan, so a typed "DTX_867…" also matches the
    // device's registered "DTX867…" IoT thing name.
    const thing = normalizeThingName(deviceId);
    const code = claimCode.trim();
    const devicePassword = password.trim();
    const next: Errors = {
      deviceId: validateRequired(thing, t('claim.thingLabel')),
      claimCode: validateRequired(code, t('claim.codeLabel')),
      password: validatePanelPassword(devicePassword, t('claim.passwordLabel')),
    };
    setErrors(next);
    if (next.deviceId || next.claimCode || next.password) {
      return;
    }
    runClaim(thing, code, devicePassword);
  }, [deviceId, claimCode, password, runClaim, t]);

  const scanning = mode === 'scan';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={scanning ? t('claim.title') : t('claim.manualTitle')}
        // In manual entry, back always drops to scan mode first. Scanning
        // itself only gets a back button when there's somewhere to return to
        // (opened from Profile) — the mandatory first-claim gate has none.
        onBack={
          !scanning
            ? () => setMode('scan')
            : canGoBack
            ? () => navigation.goBack()
            : undefined
        }
        // Only on the mandatory first-claim gate — opened from Profile,
        // Profile's own Logout is one back-tap away.
        right={
          !canGoBack ? (
            <Pressable
              onPress={() => setConfirmingSignOut(true)}
              disabled={claiming}
              hitSlop={sizing.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={t('profile.logout')}
              style={claiming ? styles.disabled : undefined}
            >
              <LogOutIcon size={22} color={colors.error} />
            </Pressable>
          ) : undefined
        }
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

      <Screen
        edges={['left', 'right']}
        footer={
          scanning ? undefined : (
            <Button
              title={claiming ? t('claim.linking') : t('claim.linkButton')}
              onPress={onManualSubmit}
              loading={claiming}
              disabled={claiming}
            />
          )
        }
      >
        {scanning ? (
          <>
            <QrScanner onScanned={onScanned} paused={claiming} />

            <Typography
              size={16}
              weight="700"
              lineHeight="100%"
              letterSpacing="0%"
              align="center"
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            >
              {t('claim.scanInstruction')}
            </Typography>

            <Button
              title={t('claim.enterManually')}
              variant="outline"
              onPress={() => setMode('manual')}
              style={{ marginTop: spacing['2xl'] }}
            />
          </>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <Input
              label={t('claim.thingLabel')}
              placeholder={t('claim.thingPlaceholder')}
              value={deviceId}
              onChangeText={text => {
                setDeviceId(text);
                setErrors(prev => ({ ...prev, deviceId: undefined }));
              }}
              error={message(errors.deviceId)}
              // hint={t('claim.thingHint')}
              leftIcon={
                <Icon
                  name="hardware-chip-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!claiming}
            />
            <Input
              label={t('claim.codeLabel')}
              placeholder={t('claim.codePlaceholder')}
              value={claimCode}
              onChangeText={text => {
                setClaimCode(text);
                setErrors(prev => ({ ...prev, claimCode: undefined }));
              }}
              error={message(errors.claimCode)}
              leftIcon={
                <Icon name="key-outline" size={20} color={colors.textSecondary} />
              }
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!claiming}
              returnKeyType="next"
            />
            <Input
              label={t('claim.passwordLabel')}
              placeholder={t('claim.passwordPlaceholder')}
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: undefined }));
              }}
              error={message(errors.password)}
              keyboardType="number-pad"
              maxLength={MAX_PANEL_PASSWORD_LENGTH}
              leftIcon={<LockIcon size={20} />}
              rightIcon={
                secure ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />
              }
              onRightIconPress={() => setSecure(value => !value)}
              rightIconLabel={
                secure ? t('a11y.showPassword') : t('a11y.hidePassword')
              }
              secureTextEntry={secure}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!claiming}
              returnKeyType="go"
              onSubmitEditing={onManualSubmit}
            />
          </View>
        )}
      </Screen>

      {/* Claim in progress — covers the screen so a second scan can't slip in. */}
      {claiming && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { backgroundColor: colors.background + 'CC' },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Typography
            variant="cardTitle"
            color={colors.text}
            style={{ marginTop: spacing.md }}
          >
            {t('claim.linking')}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
