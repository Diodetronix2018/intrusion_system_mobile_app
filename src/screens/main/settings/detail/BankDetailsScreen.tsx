import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Button, Icon, Input, Screen, ScreenHeader } from '../../../../components';
import { LocationPinIcon, MailIcon, PhoneIcon, UserIcon } from '../../../../icons';
import { useTheme } from '../../../../theme';
import {
  INDIAN_MOBILE_LENGTH,
  validateEmail,
  validateIndianMobile,
  validateRequired,
  ValidationError,
} from '../../../../utils/validation';
import { useValidationMessage } from '../../../../utils/useValidationMessage';
import {
  BRANCH_CODE_MAX_LENGTH,
  BRANCH_NAME_MAX_LENGTH,
  DISTRICT_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  MANAGER_NAME_MAX_LENGTH,
  useBankDetails,
} from './useBankDetails';

type Field =
  | 'branchCode'
  | 'district'
  | 'branchName'
  | 'managerName'
  | 'mobile'
  | 'email';
type Errors = Partial<Record<Field, ValidationError>>;

export function BankDetailsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const message = useValidationMessage();
  const { details, update, save, saving } = useBankDetails();
  const [errors, setErrors] = useState<Errors>({});

  const clear = (field: Field) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSave = useCallback(async () => {
    const next: Errors = {
      branchCode: validateRequired(
        details.branchCode,
        t('bankDetails.branchCode.label'),
      ),
      district: validateRequired(details.district, t('bankDetails.district.label')),
      branchName: validateRequired(
        details.branchName,
        t('bankDetails.branchName.label'),
      ),
      managerName: validateRequired(
        details.managerName,
        t('bankDetails.managerName.label'),
      ),
      mobile: validateIndianMobile(details.mobile),
      email: validateEmail(details.email, t('bankDetails.email.label')),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      return;
    }

    try {
      await save();
      Toast.show({ type: 'success', text1: t('common.configurationSaved') });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.configurationFailed'),
        text2: err?.message,
      });
    }
  }, [details, save, t]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSubtle }]}>
      <ScreenHeader
        title={t('settings.options.bankDetails.title')}
        background={colors.backgroundSubtle}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSubtle}
        contentContainerStyle={{ gap: spacing.lg }}
        footer={
          <Button
            title={t('common.saveConfiguration')}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        }
      >
        <Input
          label={t('bankDetails.branchCode.label')}
          placeholder={t('bankDetails.branchCode.placeholder')}
          value={details.branchCode}
          onChangeText={text => {
            update({ branchCode: text });
            clear('branchCode');
          }}
          error={message(errors.branchCode)}
          leftIcon={
            <Icon name="business-outline" size={20} color={colors.textSecondary} />
          }
          maxLength={BRANCH_CODE_MAX_LENGTH}
          autoCapitalize="characters"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />

        <Input
          label={t('bankDetails.district.label')}
          placeholder={t('bankDetails.district.placeholder')}
          value={details.district}
          onChangeText={text => {
            update({ district: text });
            clear('district');
          }}
          error={message(errors.district)}
          leftIcon={<LocationPinIcon size={20} color={colors.textSecondary} />}
          maxLength={DISTRICT_MAX_LENGTH}
          autoCapitalize="words"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />

        <Input
          label={t('bankDetails.branchName.label')}
          placeholder={t('bankDetails.branchName.placeholder')}
          value={details.branchName}
          onChangeText={text => {
            update({ branchName: text });
            clear('branchName');
          }}
          error={message(errors.branchName)}
          leftIcon={
            <Icon name="business-outline" size={20} color={colors.textSecondary} />
          }
          maxLength={BRANCH_NAME_MAX_LENGTH}
          autoCapitalize="words"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />

        <Input
          label={t('bankDetails.managerName.label')}
          placeholder={t('bankDetails.managerName.placeholder')}
          value={details.managerName}
          onChangeText={text => {
            update({ managerName: text });
            clear('managerName');
          }}
          error={message(errors.managerName)}
          leftIcon={<UserIcon size={20} color={colors.textSecondary} />}
          maxLength={MANAGER_NAME_MAX_LENGTH}
          autoCapitalize="words"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />

        <Input
          label={t('bankDetails.mobile.label')}
          placeholder={t('dialer.phonePlaceholder')}
          value={details.mobile}
          onChangeText={text => {
            update({ mobile: text.replace(/\D/g, '').slice(0, INDIAN_MOBILE_LENGTH) });
            clear('mobile');
          }}
          error={message(errors.mobile)}
          hint={t('dialer.phoneHint', { count: INDIAN_MOBILE_LENGTH })}
          leftIcon={<PhoneIcon size={20} color={colors.textSecondary} />}
          keyboardType="number-pad"
          maxLength={INDIAN_MOBILE_LENGTH}
          autoComplete="tel"
          textContentType="telephoneNumber"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />

        <Input
          label={t('bankDetails.email.label')}
          placeholder={t('bankDetails.email.placeholder')}
          value={details.email}
          onChangeText={text => {
            update({ email: text });
            clear('email');
          }}
          error={message(errors.email)}
          leftIcon={<MailIcon size={20} color={colors.textSecondary} />}
          maxLength={EMAIL_MAX_LENGTH}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          fieldStyle={{ backgroundColor: colors.card }}
          required
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
