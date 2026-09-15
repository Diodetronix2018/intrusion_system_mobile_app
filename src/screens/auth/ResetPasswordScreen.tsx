import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Input, Screen } from '../../components';
import { CheckIcon, EyeIcon, EyeOffIcon, LockIcon } from '../../icons';
import type { RootStackScreenProps } from '../../navigation/types';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  validateMatch,
  validatePassword,
  validateRequired,
  ValidationError,
} from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';
import { AuthPrompt } from './AuthPrompt';

type Field = 'code' | 'password' | 'confirmPassword';
type Errors = Partial<Record<Field, ValidationError>>;

/** Step 2 of the password reset: the emailed code plus the new password. */
export function ResetPasswordScreen({
  navigation,
  route,
}: RootStackScreenProps<'ResetPassword'>) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const message = useValidationMessage();
  const { confirmForgotPassword } = useSession();
  const { email, destination } = route.params;

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: Field) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = useCallback(async () => {
    const next: Errors = {
      code: validateRequired(code, t('auth.fields.code.label')),
      password: validatePassword(password, t('auth.fields.newPassword.label')),
      confirmPassword: validateMatch(confirmPassword, password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    try {
      await confirmForgotPassword(email, code, password);
      Toast.show({
        type: 'success',
        text1: t('auth.reset.done'),
        text2: t('auth.reset.doneBody'),
      });
      navigation.navigate('SignIn');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('auth.errors.resetFailed'),
        text2: err?.message || t('auth.errors.tryAgain'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [code, password, confirmPassword, email, confirmForgotPassword, navigation, t]);

  const secureLabel = (hidden: boolean) =>
    hidden ? t('a11y.showPassword') : t('a11y.hidePassword');

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('auth.reset.submit')}
            onPress={handleSubmit}
            loading={submitting}
          />
          <AuthFooter
            prompt={t('auth.forgot.footerPrompt')}
            action={t('auth.forgot.footerAction')}
            onPress={() => navigation.navigate('SignIn')}
          />
        </>
      }
    >
      <AuthHeader />

      <AuthPrompt
        title={t('auth.reset.title')}
        subtitle={t('auth.reset.subtitle', { email: destination || email })}
      />

      <View style={{ gap: spacing.xl }}>
        <Input
          label={t('auth.fields.code.label')}
          placeholder={t('auth.fields.code.placeholder')}
          value={code}
          onChangeText={text => {
            setCode(text);
            clear('code');
          }}
          error={message(errors.code)}
          leftIcon={<CheckIcon size={20} />}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />

        <Input
          label={t('auth.fields.newPassword.label')}
          placeholder={t('auth.fields.newPassword.placeholder')}
          value={password}
          onChangeText={text => {
            setPassword(text);
            clear('password');
          }}
          error={message(errors.password)}
          leftIcon={<LockIcon size={20} />}
          rightIcon={
            securePassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />
          }
          onRightIconPress={() => setSecurePassword(value => !value)}
          rightIconLabel={secureLabel(securePassword)}
          secureTextEntry={securePassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Input
          label={t('auth.fields.confirmPassword.label')}
          placeholder={t('auth.fields.confirmPassword.placeholder')}
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            clear('confirmPassword');
          }}
          error={message(errors.confirmPassword)}
          leftIcon={<LockIcon size={20} />}
          rightIcon={
            secureConfirm ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />
          }
          onRightIconPress={() => setSecureConfirm(value => !value)}
          rightIconLabel={secureLabel(secureConfirm)}
          secureTextEntry={secureConfirm}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>
    </Screen>
  );
}
