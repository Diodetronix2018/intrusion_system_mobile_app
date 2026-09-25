import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  type CameraRuntimeError,
} from 'react-native-vision-camera';

import { Button, Icon, Typography } from '../../components';
import { useTheme } from '../../theme';

/**
 * The live camera + QR reader.
 *
 * Kept in its own component so the vision-camera hooks only run while the user
 * is actually scanning, and never on the manual-entry path.
 */
export function QrScanner({
  onScanned,
  paused,
}: {
  onScanned: (value: string) => void;
  /** Stops reading while a claim is in flight. */
  paused: boolean;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const { hasPermission, requestPermission } = useCameraPermission();

  // Ask as soon as the screen opens — scanning is the whole point of being
  // here, so making the user tap a button first is one tap of nothing.
  const asked = useRef(false);
  useEffect(() => {
    if (hasPermission || asked.current) {
      return;
    }
    asked.current = true;
    requestPermission().catch(() => {
      /* the hook still reflects the resulting state */
    });
  }, [hasPermission, requestPermission]);

  // By the time this button is reachable the OS has already been asked once.
  // A second request re-opens the dialog while that is still allowed, and
  // resolves false once the denial is permanent — then only Settings can undo it.
  const onGrant = useCallback(async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        Linking.openSettings();
      }
    } catch {
      Linking.openSettings();
    }
  }, [requestPermission]);

  const frame = {
    borderRadius: radius.lg,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  };
  const statePadding = { padding: spacing['2xl'], gap: spacing.sm };

  if (!hasPermission) {
    return (
      <View style={[styles.state, frame, statePadding]}>
        <Icon name="camera-outline" size={30} color={colors.textSecondary} />
        <Typography variant="cardTitle" color={colors.text}>
          {t('claim.permissionTitle')}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          {t('claim.permissionBody')}
        </Typography>
        <Button
          title={t('claim.grantPermission')}
          size="sm"
          fullWidth={false}
          onPress={onGrant}
          leftIcon={<Icon name="camera" size={18} color={colors.onPrimary} />}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    );
  }

  // Only mounted once permission is granted, so the device lookup and the
  // native session are created fresh — exactly as when the screen is reopened.
  return <ScannerCamera onScanned={onScanned} paused={paused} />;
}

function ScannerCamera({
  onScanned,
  paused,
}: {
  onScanned: (value: string) => void;
  paused: boolean;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();

  // Right after the permission dialog closes the app is not yet `active` again
  // (Android resumes the activity a moment later). Starting the session in that
  // window leaves a black preview, so wait for the app to be in the foreground.
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', state =>
      setAppActive(state === 'active'),
    );
    return () => sub.remove();
  }, []);

  // vision-camera can render a black preview if the <Camera> becomes active in
  // the same frame it first mounts. So we mount it inactive and flip `isActive`
  // a tick later, once the native preview surface is laid out — only while
  // focused, in the foreground and not paused.
  const [active, setActive] = useState(false);
  // The preview is only really up once the native side says so; until then a
  // cover hides the surface, which is black while the session is configuring.
  const [previewStarted, setPreviewStarted] = useState(false);
  const [error, setError] = useState<CameraRuntimeError | null>(null);
  // Bumped to remount the <Camera> on retry, so the session is rebuilt.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isFocused || !appActive || !device || paused) {
      setActive(false);
      setPreviewStarted(false);
      return;
    }
    const id = setTimeout(() => setActive(true), 300);
    return () => clearTimeout(id);
  }, [isFocused, appActive, device, paused]);

  const onCameraError = useCallback((err: CameraRuntimeError) => {
    // Without this the session just fails silently and the user stares at a
    // black square, so surface it and offer a retry.
    console.warn('[claim] camera error', err.code, err.message);
    setError(err);
    setPreviewStarted(false);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setPreviewStarted(false);
    setAttempt(value => value + 1);
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const value = codes[0]?.value;
      if (value) {
        onScanned(value);
      }
    },
  });

  const frame = {
    borderRadius: radius.lg,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  };
  const statePadding = { padding: spacing['2xl'], gap: spacing.sm };

  if (!device) {
    return (
      <View style={[styles.state, frame, statePadding]}>
        <Icon name="videocam-off-outline" size={30} color={colors.textSecondary} />
        <Typography variant="caption" color={colors.textSecondary}>
          {t('claim.noCamera')}
        </Typography>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.state, frame, statePadding]}>
        <Icon name="alert-circle-outline" size={30} color={colors.error} />
        <Typography variant="cardTitle" color={colors.text}>
          {t('claim.cameraErrorTitle')}
        </Typography>
        <Typography variant="caption" color={colors.textSecondary}>
          {error.message}
        </Typography>
        <Button
          title={t('claim.retry')}
          size="sm"
          fullWidth={false}
          onPress={retry}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.cameraWrap, { borderRadius: radius.lg }]}>
      <Camera
        key={attempt}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={active}
        codeScanner={codeScanner}
        // The wrapper rounds its corners and clips, which a SurfaceView (the
        // default) cannot do — it renders black instead. TextureView composites
        // normally, at a cost that does not matter for a QR scan.
        androidPreviewViewType="texture-view"
        onPreviewStarted={() => setPreviewStarted(true)}
        onError={onCameraError}
      />

      {/* Framing reticle so the user knows where to aim. */}
      <View style={styles.reticle} pointerEvents="none">
        <View style={[styles.reticleBox, { borderColor: colors.primary }]} />
      </View>

      {/* Cover the warm-up so the preview never flashes black. */}
      {!previewStarted && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.warmup,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  state: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  reticle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: '62%',
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: 20,
    opacity: 0.9,
  },
  warmup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
