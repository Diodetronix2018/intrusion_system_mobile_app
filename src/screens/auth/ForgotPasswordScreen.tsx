import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Input, Screen } from '../../components';
import { MailIcon } from '../../icons';
import type { RootStackScreenProps } from '../../navigation/types';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import { validateEmail, ValidationError } from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';
import { AuthPrompt } from './AuthPrompt';

/**
 * Step 1 of the password reset: asks Cognito to email a code, then hands the
 * address (and where the code went) to the reset form.
 */
export function ForgotPasswordScreen({
  navigation,
  route,
}: RootStackScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const message = useValidationMessage();
  const { forgotPassword } = useSession();

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState<ValidationError>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const next = validateEmail(email, t('auth.fields.email.label'));
    setError(next);
    if (next) {
      return;
    }

    setSubmitting(true);
    try {
      const { destination } = await forgotPassword(email);
      Toast.show({
        type: 'success',
        text1: t('auth.forgot.codeSent'),
        text2: t('auth.verify.sentTo', { email: destination || email.trim() }),
      });
      navigation.navigate('ResetPassword', { email: email.trim(), destination });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('auth.errors.resetFailed'),
        text2: err?.message || t('auth.errors.tryAgain'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [email, forgotPassword, navigation, t]);

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('auth.forgot.submit')}
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
        title={t('auth.forgot.title')}
        subtitle={t('auth.forgot.subtitle')}
      />

      <View style={{ gap: spacing.xl }}>
        <Input
          label={t('auth.fields.email.label')}
          placeholder={t('auth.fields.email.placeholder')}
          value={email}
          onChangeText={text => {
            setEmail(text);
            setError(undefined);
          }}
          error={message(error)}
          leftIcon={<MailIcon size={20} />}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>
    </Screen>
  );
}
