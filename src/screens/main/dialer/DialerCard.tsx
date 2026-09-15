import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChipGroup, Typography } from '../../../components';
import { EditIcon, TrashIcon } from '../../../icons';
import { useTheme } from '../../../theme';
import {
  ALERT_KINDS,
  AlertKind,
  CONTACT_METHODS,
  ContactMethod,
  DialerEntry,
} from './types';

export function DialerCard({
  entry,
  index,
  onEdit,
  onDelete,
  onMethodChange,
  onAlertChange,
}: {
  entry: DialerEntry;
  /** 1-based position, shown in the circle */
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMethodChange: (method: ContactMethod) => void;
  onAlertChange: (alert: AlertKind) => void;
}) {
  const { t } = useTranslation();
  const { colors, radius, sizing, spacing, layeredShadow } = useTheme();

  const section = (title: string, content: React.ReactNode) => (
    <View style={{ marginTop: spacing.lg }}>
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
    <View
      style={[
        styles.card,
        {
          padding: spacing.lg,
          borderRadius: radius.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
        layeredShadow,
      ]}
    >
      <View style={[styles.headerRow, { gap: spacing.md }]}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Typography
            variant="captionBold"
            size={13}
            color={colors.onPrimary}
            numberOfLines={1}
          >
            {String(index)}
          </Typography>
        </View>

        <Typography
          variant="captionBold"
          size={18}
          align="left"
          color={colors.primary}
          numberOfLines={1}
          style={styles.phone}
        >
          {entry.phone}
        </Typography>

        <Pressable
          onPress={onEdit}
          hitSlop={sizing.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('dialer.editNumber')}
        >
          <EditIcon size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          onPress={onDelete}
          hitSlop={sizing.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t('dialer.deleteNumber')}
        >
          <TrashIcon size={18} color={colors.error} />
        </Pressable>
      </View>

      {section(
        t('dialer.type'),
        <ChipGroup<ContactMethod>
          accessibilityLabel={t('dialer.type')}
          selected={entry.method}
          onSelect={onMethodChange}
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
          selected={entry.alert}
          onSelect={onAlertChange}
          options={ALERT_KINDS.map(item => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
        />,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    flex: 1,
    minWidth: 0,
  },
});
