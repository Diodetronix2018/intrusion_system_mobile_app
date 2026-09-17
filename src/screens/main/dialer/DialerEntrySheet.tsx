import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, ChipGroup, Input, Typography } from '../../../components';
import { PhoneIcon } from '../../../icons';
import { useTheme } from '../../../theme';
import { useValidationMessage } from '../../../utils/useValidationMessage';
import {
  INDIAN_MOBILE_LENGTH,
  normalizeIndianMobile,
  validateIndianMobile,
  ValidationError,
} from '../../../utils/validation';
import { useResponsive } from '../../../utils/responsive';
import {
  ALERT_KINDS,
  AlertKind,
  CONTACT_METHODS,
  ContactMethod,
  DialerEntryInput,
} from './types';

const DEFAULTS: DialerEntryInput = {
  phone: '',
  method: 'callAndSms',
  alert: 'burglarAndFire',
};

/** Collects the number, the contact method and the alert kind in one pass. */
export function DialerEntrySheet({
  visible,
  initialValue,
  saving = false,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  /** Prefilled when editing; omit when adding */
  initialValue?: DialerEntryInput;
  /** True while the publish `onSubmit` kicked off is in flight. */
  saving?: boolean;
  onSubmit: (values: DialerEntryInput) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const { gutter, contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const message = useValidationMessage();

  const [values, setValues] = useState<DialerEntryInput>(DEFAULTS);
  const [error, setError] = useState<ValidationError>();

  const isEditing = !!initialValue;

  // reset on every open, so a cancelled edit is not remembered
  useEffect(() => {
    if (visible) {
      setValues(initialValue ?? DEFAULTS);
      setError(undefined);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    if (saving) {
      return;
    }
    const next = validateIndianMobile(values.phone);
    setError(next);
    if (next) {
      return;
    }
    // The caller owns closing: it awaits the publish and only calls onClose
    // once it lands, so a failed save leaves the sheet open (with a toast)
    // instead of silently discarding what the user typed.
    onSubmit({ ...values, phone: normalizeIndianMobile(values.phone) });
  };

  const section = (title: string, content: React.ReactNode) => (
    <View style={{ marginTop: spacing.xl }}>
      <Typography
        variant="label"
        align="left"
        color={colors.textSecondary}
        style={{ marginBottom: spacing.sm }}
      >
        {title}
      </Typography>
      {content}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.overlay }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
      />

      <KeyboardAvoidingView behavior="padding" style={styles.anchor}>
        <View
          style={[
            styles.sheet,
            {
              maxWidth: contentMaxWidth,
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg + 8,
              borderTopRightRadius: radius.lg + 8,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter }}
          >
            <Typography
              variant="cardTitle"
              size={16}
              align="left"
              color={colors.primary}
              style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
            >
              {isEditing ? t('dialer.editNumber') : t('dialer.addNumber')}
            </Typography>

            <Input
              label={t('dialer.phoneLabel')}
              placeholder={t('dialer.phonePlaceholder')}
              value={values.phone}
              onChangeText={text => {
                // keep the field to national digits so the counter is honest
                setValues(prev => ({
                  ...prev,
                  phone: text.replace(/\D/g, '').slice(0, INDIAN_MOBILE_LENGTH),
                }));
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
              autoFocus
              onSubmitEditing={handleSubmit}
            />

            {section(
              t('dialer.type'),
              <ChipGroup<ContactMethod>
                accessibilityLabel={t('dialer.type')}
                selected={values.method}
                onSelect={method => setValues(prev => ({ ...prev, method }))}
                options={CONTACT_METHODS.map(item => ({
                  value: item.value,
                  label: t(item.labelKey),
                }))}
              />,
            )}

            {section(
              t('dialer.alert'),
              <ChipGroup<AlertKind>
                accessibilityLabel={t('dialer.alert')}
                selected={values.alert}
                onSelect={alert => setValues(prev => ({ ...prev, alert }))}
                options={ALERT_KINDS.map(item => ({
                  value: item.value,
                  label: t(item.labelKey),
                }))}
              />,
            )}

            <View
              style={[
                styles.actions,
                { gap: spacing.md, marginTop: spacing['2xl'] },
              ]}
            >
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={onClose}
                disabled={saving}
                style={styles.action}
              />
              <Button
                title={t('common.save')}
                onPress={handleSubmit}
                loading={saving}
                disabled={saving}
                style={styles.action}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    alignSelf: 'center',
    // leaves the page visible above the sheet even with every section open
    maxHeight: '88%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
});
