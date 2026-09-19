import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  Icon,
  Input,
  Screen,
  ScreenHeader,
  Typography,
} from '../../components';
import { useSession } from '../../session/SessionProvider';
import {
  ClaimRejectedError,
  normalizeThingName,
  parseClaimQr,
} from '../../session/deviceClaim';
import { useTheme } from '../../theme';
import { QrScanner } from './QrScanner';

type Mode = 'scan' | 'manual';

/**
 * Links a physical panel to the signed-in account — the whole app until one is
 * claimed. Scanning is the default path; typing the details in is the fallback
 * behind "Enter manually".
 */
export function ClaimDeviceScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const { claimDevice } = useSession();
  const navigation = useNavigation();
  // Whether there's somewhere to go back to: false when this is the
  // mandatory gate for a first-ever claim (nothing before it on the stack),
  // true when it was opened from Profile to add another device.
  const canGoBack = navigation.canGoBack();

  const [mode, setMode] = useState<Mode>('scan');
  const [deviceId, setDeviceId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  // Blocks repeat scans (the reader fires continuously) while a claim runs.
  const claimingRef = useRef(false);

  const runClaim = useCallback(
    async (thingName: string, code: string) => {
      if (claimingRef.current) {
        return;
      }
      claimingRef.current = true;
      setClaiming(true);
      try {
        await claimDevice(thingName, code);
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
        Toast.show({
          type: 'error',
          text1: rejected ? t('claim.rejectedTitle') : t('claim.failedTitle'),
          text2: rejected
            ? t('claim.rejectedBody')
            : err?.message || t('auth.errors.tryAgain'),
        });
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
      runClaim(parsed.thingName, parsed.claimCode);
    },
    [runClaim, t],
  );

  const onManualSubmit = useCallback(() => {
    // Normalize the same way as a scan, so a typed "DTX_867…" also matches the
    // device's registered "DTX867…" IoT thing name.
    const thing = normalizeThingName(deviceId);
    const code = claimCode.trim();
    if (!thing || !code) {
      Toast.show({ type: 'error', text1: t('claim.missingFields') });
      return;
    }
    runClaim(thing, code);
  }, [deviceId, claimCode, runClaim, t]);

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
              onChangeText={setDeviceId}
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
              onChangeText={setClaimCode}
              leftIcon={
                <Icon name="key-outline" size={20} color={colors.textSecondary} />
              }
              autoCapitalize="characters"
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
});
