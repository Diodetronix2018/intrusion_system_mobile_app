import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, Input, Screen, Typography } from '../../components';
import { EyeIcon, EyeOffIcon, LockIcon, UserIcon } from '../../icons';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  validatePassword,
  validateRequired,
  ValidationError,
} from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';

export type SignInScreenProps = {
  onSignIn?: (credentials: { identifier: string; password: string }) => void;
  onForgotPassword?: () => void;
  onNavigateToSignUp?: () => void;
};

type Errors = { identifier?: ValidationError; password?: ValidationError };

export function SignInScreen({
  onSignIn,
  onForgotPassword,
  onNavigateToSignUp,
}: SignInScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const goToSignUp = onNavigateToSignUp ?? (() => navigation.navigate('SignUp'));
  const { colors, spacing } = useTheme();
  const message = useValidationMessage();

  // accepts either an email or a username, so it is not validated as an email
  const [identifier, setIdentifier] = useState('dfsdfsdfdsv');
  const [password, setPassword] = useState('dfgdfgdfdsfg');
  const [secure, setSecure] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
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
      onSignIn?.({ identifier: identifier.trim(), password });
    } finally {
      setSubmitting(false);
    }
  }, [identifier, password, onSignIn, t]);

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
            onPress={goToSignUp}
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
        onPress={onForgotPassword}
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
