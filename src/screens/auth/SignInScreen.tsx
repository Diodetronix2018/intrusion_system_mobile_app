import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Input, Screen, Typography } from '../../components';
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../icons';
import { useSession } from '../../session/SessionProvider';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  validatePassword,
  validateRequired,
  ValidationError,
} from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';

type Errors = { identifier?: ValidationError; password?: ValidationError };

export function SignInScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors, spacing } = useTheme();
  const message = useValidationMessage();
  const { signIn } = useSession();

  // Cognito's username is the sign-up email, but the pool also accepts a
  // username alias — so this is not validated as an email address.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const next: Errors = {
      identifier: validateRequired(
        identifier,
        t('auth.fields.identifier.label'),
      ),
      password: validatePassword(password, t('auth.fields.password.label')),
    };
    setErrors(next);
    if (next.identifier || next.password) {
      return;
    }

    setSubmitting(true);
    try {
      // On success the session updates and the root navigator swaps to the app.
      await signIn(identifier, password);
    } catch (err: any) {
      // An account that never verified its email can't sign in — send them
      // straight to the code screen instead of a dead-end error.
      if (err?.code === 'UserNotConfirmedException') {
        Toast.show({
          type: 'info',
          text1: t('auth.verify.title'),
          text2: t('auth.verify.needed'),
        });
        navigation.navigate('ConfirmSignUp', { email: identifier.trim() });
        return;
      }
      Toast.show({
        type: 'error',
        text1: t('auth.errors.signInFailed'),
        text2: err?.message || t('auth.errors.tryAgain'),
      });
    } finally {
      setSubmitting(false);
    }
  }, [identifier, password, signIn, navigation, t]);

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('auth.signIn.submit')}
            onPress={handleSubmit}
            loading={submitting}
          />
          <AuthFooter
            prompt={t('auth.signIn.footerPrompt')}
            action={t('auth.signIn.footerAction')}
            onPress={() => navigation.navigate('SignUp')}
          />
        </>
      }
    >
      <AuthHeader />

      <View style={{ gap: spacing.xl }}>
        <Input
          label={t('auth.fields.identifier.label')}
          placeholder={t('auth.fields.identifier.placeholder')}
          value={identifier}
          onChangeText={text => {
            setIdentifier(text);
            setErrors(prev => ({ ...prev, identifier: undefined }));
          }}
          error={message(errors.identifier)}
          leftIcon={<UserIcon size={20} />}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
        />

        <Input
          label={t('auth.fields.password.label')}
          placeholder={t('auth.fields.password.placeholder')}
          value={password}
          onChangeText={text => {
            setPassword(text);
            setErrors(prev => ({ ...prev, password: undefined }));
          }}
          error={message(errors.password)}
          leftIcon={<LockIcon size={20} />}
          rightIcon={secure ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          onRightIconPress={() => setSecure(value => !value)}
          rightIconLabel={
            secure ? t('a11y.showPassword') : t('a11y.hidePassword')
          }
          secureTextEntry={secure}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Typography
        variant="caption"
        color={colors.link}
        align="right"
        onPress={() =>
          navigation.navigate('ForgotPassword', {
            // Carry whatever they already typed over to the reset form.
            email: identifier.includes('@') ? identifier.trim() : undefined,
          })
        }
        accessibilityRole="link"
        style={[styles.forgot, { marginTop: spacing.lg }]}
      >
        {t('auth.signIn.forgotPassword')}
      </Typography>

    </Screen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
  },
});
