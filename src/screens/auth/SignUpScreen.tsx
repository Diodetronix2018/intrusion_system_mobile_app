import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, Input, Screen } from '../../components';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from '../../icons';
import { useTheme } from '../../theme';
import { useValidationMessage } from '../../utils/useValidationMessage';
import {
  validateEmail,
  validateMatch,
  validatePassword,
  validateRequired,
  ValidationError,
} from '../../utils/validation';
import { AuthFooter } from './AuthFooter';
import { AuthHeader } from './AuthHeader';

export type SignUpValues = {
  fullName: string;
  email: string;
  password: string;
};

export type SignUpScreenProps = {
  onSignUp?: (values: SignUpValues) => void;
  onNavigateToSignIn?: () => void;
};

type Errors = Partial<
  Record<keyof SignUpValues | 'confirmPassword', ValidationError>
>;

export function SignUpScreen({
  onSignUp,
  onNavigateToSignIn,
}: SignUpScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const goToSignIn = onNavigateToSignIn ?? (() => navigation.goBack());
  const { spacing } = useTheme();
  const message = useValidationMessage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: keyof Errors) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = useCallback(() => {
    const next: Errors = {
      fullName: validateRequired(fullName, t('auth.fields.fullName.label')),
      email: validateEmail(email, t('auth.fields.email.label')),
      password: validatePassword(password, t('auth.fields.newPassword.label')),
      confirmPassword: validateMatch(confirmPassword, password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    try {
      onSignUp?.({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
    } finally {
      setSubmitting(false);
    }
  }, [fullName, email, password, confirmPassword, onSignUp, t]);

  const secureLabel = (hidden: boolean) =>
    hidden ? t('a11y.showPassword') : t('a11y.hidePassword');

  return (
    <Screen
      footer={
        <>
          <Button
            title={t('auth.signUp.submit')}
            onPress={handleSubmit}
            loading={submitting}
          />
          <AuthFooter
            prompt={t('auth.signUp.footerPrompt')}
            action={t('auth.signUp.footerAction')}
            onPress={goToSignIn}
          />
        </>
      }
    >
      <AuthHeader />

      <View style={{ gap: spacing.xl }}>
        <Input
          label={t('auth.fields.fullName.label')}
          placeholder={t('auth.fields.fullName.placeholder')}
          value={fullName}
          onChangeText={text => {
            setFullName(text);
            clear('fullName');
          }}
          error={message(errors.fullName)}
          leftIcon={<UserIcon size={20} />}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />

        <Input
          label={t('auth.fields.email.label')}
          placeholder={t('auth.fields.email.placeholder')}
          value={email}
          onChangeText={text => {
            setEmail(text);
            clear('email');
          }}
          error={message(errors.email)}
          leftIcon={<MailIcon size={20} />}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
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
