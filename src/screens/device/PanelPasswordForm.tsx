import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Input } from '../../components';
import { EyeIcon, EyeOffIcon, LockIcon } from '../../icons';
import { useSession } from '../../session/SessionProvider';
import { DevicePasswordError } from '../../session/deviceClaim';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  MAX_PANEL_PASSWORD_LENGTH,
  validatePanelPassword,
  ValidationError,
} from '../../utils/validation';

/**
 * Panel password field + submit, checked against the device's reported
 * `pwd`. A wrong password is shown under the field; anything else (no `pwd`
 * to compare, offline, AWS error) is a toast, since it isn't the user's typo.
 * Render with `key={thingName}` so switching device starts a blank form.
 */
export function PanelPasswordForm({
  thingName,
  onUnlocked,
  onCancel,
}: {
  thingName: string;
  onUnlocked?: () => void;
  /** Shows a Cancel beside the submit button. */
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const message = useValidationMessage();
  const { verifyPanelPassword } = useSession();

  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState<ValidationError>();
  const [verifying, setVerifying] = useState(false);

  const submit = async () => {
    if (verifying) {
      return;
    }
    const value = password.trim();
    const invalid = validatePanelPassword(value, t('claim.passwordLabel'));
    setError(invalid);
    if (invalid) {
      return;
    }
    setVerifying(true);
    try {
      await verifyPanelPassword(thingName, value);
      onUnlocked?.();
    } catch (err: any) {
      if (err instanceof DevicePasswordError && !err.unavailable) {
        setError({ key: 'panelPassword.invalid' });
      } else {
        Toast.show({
          type: 'error',
          text1: t('claim.failedTitle'),
          text2:
            err instanceof DevicePasswordError
              ? t('claim.passwordUnavailableBody')
              : err?.message || t('auth.errors.tryAgain'),
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={[styles.stretch, { gap: spacing.lg }]}>
      <Input
        label={t('claim.passwordLabel')}
        placeholder={t('claim.passwordPlaceholder')}
        value={password}
        onChangeText={text => {
          setPassword(text);
          setError(undefined);
        }}
        error={message(error)}
        leftIcon={<LockIcon size={20} />}
        rightIcon={secure ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        onRightIconPress={() => setSecure(value => !value)}
        rightIconLabel={
          secure ? t('a11y.showPassword') : t('a11y.hidePassword')
        }
        secureTextEntry={secure}
        keyboardType="number-pad"
        maxLength={MAX_PANEL_PASSWORD_LENGTH}
        autoCorrect={false}
        editable={!verifying}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <View style={[styles.actions, { gap: spacing.md }]}>
        {onCancel && (
          <Button
            title={t('common.cancel')}
            variant="outline"
            onPress={onCancel}
            disabled={verifying}
            style={styles.action}
          />
        )}
        <Button
          title={verifying ? t('panelPassword.verifying') : t('panelPassword.submit')}
          onPress={submit}
          loading={verifying}
          disabled={verifying}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stretch: {
    alignSelf: 'stretch',
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
});
