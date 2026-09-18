import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import {
  Button,
  Icon,
  Input,
  Screen,
  ScreenHeader,
  Typography,
} from '../../../../components';
import { PhoneIcon } from '../../../../icons';
import { useTheme } from '../../../../theme';
import {
  INDIAN_MOBILE_LENGTH,
  normalizeIndianMobile,
  validateIndianMobile,
  ValidationError,
} from '../../../../utils/validation';
import { useValidationMessage } from '../../../../utils/useValidationMessage';
import { useRecordPlay } from './useRecordPlay';

export function RecordPlayScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const message = useValidationMessage();
  const { record, play, pendingAction, saving } = useRecordPlay();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<ValidationError>();

  const runAction = async (action: (phone: string) => Promise<void>) => {
    const next = validateIndianMobile(phone);
    setError(next);
    if (next) {
      return;
    }

    try {
      await action(normalizeIndianMobile(phone));
      Toast.show({ type: 'success', text1: t('common.commandSent') });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('common.configurationFailed'),
        text2: err?.message,
      });
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.backgroundSubtle }]}>
      <ScreenHeader
        title={t('settings.options.recordPlay.title')}
        background={colors.backgroundSubtle}
      />

      <Screen
        edges={['left', 'right']}
        background={colors.backgroundSubtle}
        contentContainerStyle={{ gap: spacing.md }}
      >
        <Typography
          variant="caption"
          size={13}
          align="left"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.xs }}
        >
          {t('settings.options.recordPlay.subtitle')}
        </Typography>

        <Input
          label={t('dialer.phoneLabel')}
          placeholder={t('dialer.phonePlaceholder')}
          value={phone}
          onChangeText={text => {
            // keep the field to national digits so the counter/validation is honest
            setPhone(text.replace(/\D/g, '').slice(0, INDIAN_MOBILE_LENGTH));
            setError(undefined);
          }}
          error={message(error)}
          hint={t('dialer.phoneHint', { count: INDIAN_MOBILE_LENGTH })}
          leftIcon={<PhoneIcon size={20} />}
          keyboardType="number-pad"
          maxLength={INDIAN_MOBILE_LENGTH}
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="done"
        />

        <View style={[styles.row, { gap: spacing.md, marginTop: spacing.md }]}>
          <Button
            title={t('recordPlay.record')}
            leftIcon={
              <Icon name="mic-outline" size={18} color={colors.onPrimary} />
            }
            loading={pendingAction === 'record'}
            disabled={saving}
            onPress={() => runAction(record)}
            style={styles.action}
          />
          <Button
            title={t('recordPlay.play')}
            leftIcon={
              <Icon name="play-outline" size={18} color={colors.onPrimary} />
            }
            loading={pendingAction === 'play'}
            disabled={saving}
            onPress={() => runAction(play)}
            style={styles.action}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
});
