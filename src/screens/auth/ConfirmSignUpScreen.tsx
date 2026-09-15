import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Input, Screen } from '../../components';
import { CheckIcon } from '../../icons';
import type { RootStackScreenProps } from '../../navigation/types';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import { validateRequired, ValidationError } from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';
import { AuthPrompt } from './AuthPrompt';

/**
 * Second half of sign-up: Cognito emails a six-digit code, and the account
 * cannot sign in until it is confirmed here.
 */
export function ConfirmSignUpScreen({
  navigation,
  route,
}: RootStackScreenProps<'ConfirmSignUp'>) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const message = useValidationMessage();
  const { confirmSignUp, resendCode } = useSession();
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [error, setError] = useState<ValidationError>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = useCallback(async () => {
    const next = validateRequired(code, t('auth.fields.code.label'));
    setError(next);
    if (next) {
      return;
    }

    setSubmitting(true);
    try {
      await confirmSignUp(email, code);
      Toast.show({
        type: 'success',
        text1: t('auth.verify.verified'),
        text2: t('auth.signUp.canSignIn'),
      });
      navigation.navigate('SignIn');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('auth.errors.verificationFailed'),
        text2: err?.message || t('auth.errors.tryAgain'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [code, email, confirmSignUp, navigation, t]);

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await resendCode(email);
      Toast.show({
        type: 'success',
        text1: t('auth.verify.codeResent'),
        text2: t('auth.verify.sentTo', { email }),
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('auth.errors.resendFailed'),
        text2: err?.message || t('auth.errors.tryAgain'),
      });
    } finally {
      setResending(false);
    }
  }, [email, resendCode, t]);

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('auth.verify.submit')}
            onPress={handleSubmit}
            loading={submitting}
          />
          <AuthFooter
            prompt={t('auth.verify.noCode')}
            action={resending ? t('auth.verify.sending') : t('auth.verify.resend')}
            onPress={resending ? undefined : handleResend}
          />
        </>
      }
    >
      <AuthHeader />

      <AuthPrompt
        title={t('auth.verify.title')}
        subtitle={t('auth.verify.subtitle', { email })}
      />

      <View style={{ gap: spacing.xl }}>
        <Input
          label={t('auth.fields.code.label')}
          placeholder={t('auth.fields.code.placeholder')}
          value={code}
          onChangeText={text => {
            setCode(text);
            setError(undefined);
          }}
          error={message(error)}
          leftIcon={<CheckIcon size={20} />}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>
    </Screen>
  );
}
