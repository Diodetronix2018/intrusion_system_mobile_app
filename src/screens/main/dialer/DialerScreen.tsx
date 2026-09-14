import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen, Typography } from '../../../components';
import { PlusIcon } from '../../../icons';
import { useTheme } from '../../../theme';
import { DialerCard } from './DialerCard';
import { DialerEntrySheet } from './DialerEntrySheet';
import { MAX_DIALER_ENTRIES } from './types';
import { useDialerEntries } from './useDialerEntries';

export function DialerScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const {
    entries,
    isFull,
    add,
    update,
    setMethod,
    setAlert,
    remove,
    removeAll,
  } = useDialerEntries();

  // null = the sheet is closed; a string id = editing that entry; '' = adding
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = entries.find(entry => entry.id === editingId);

  const confirmDelete = (id: string, phone: string) => {
    Alert.alert(t('dialer.deleteNumber'), t('dialer.confirmDelete', { phone }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove(id),
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(t('dialer.deleteAll'), t('dialer.confirmDeleteAll'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: removeAll },
    ]);
  };

  return (
    <Screen
      edges={['left', 'right']}
      background={colors.backgroundSubtle}
      contentContainerStyle={{ gap: spacing.md }}
    >
      <Typography
        variant="heading"
        size={22}
        align="left"
        color={colors.primary}
        style={{ marginBottom: spacing.xs }}
      >
        {t('dialer.title')}
      </Typography>

      {entries.length === 0 && (
        <Typography
          variant="cardSubtitle"
          align="left"
          color={colors.textSecondary}
        >
          {t('dialer.empty')}
        </Typography>
      )}

      {entries.map((entry, index) => (
        <DialerCard
          key={entry.id}
          entry={entry}
          index={index + 1}
          onEdit={() => setEditingId(entry.id)}
          onDelete={() => confirmDelete(entry.id, entry.phone)}
          onMethodChange={method => setMethod(entry.id, method)}
          onAlertChange={alert => setAlert(entry.id, alert)}
        />
      ))}

      {isFull ? (
        <Typography
          variant="cardSubtitle"
          align="left"
          color={colors.textSecondary}
        >
          {t('dialer.maxReached', { count: MAX_DIALER_ENTRIES })}
        </Typography>
      ) : (
        <Pressable
          onPress={() => setEditingId('')}
          accessibilityRole="button"
          accessibilityLabel={t('dialer.addNumber')}
          style={({ pressed }) => [
            styles.addCard,
            {
              borderRadius: radius.md,
              borderColor: colors.primary,
              backgroundColor: colors.card,
              gap: spacing.sm + 2,
              opacity: pressed ? 0.7 : 1,
            },
            layeredShadow,
          ]}
        >
          <PlusIcon size={18} color={colors.primary} />
          <Typography
            variant="cardTitle"
            size={14}
            color={colors.primary}
            numberOfLines={1}
          >
            {t('dialer.addNumber')}
          </Typography>
        </Pressable>
      )}

      {entries.length > 0 && (
        <Pressable
          onPress={confirmDeleteAll}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.deleteAll,
            { paddingVertical: spacing.lg, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Typography variant="cardTitle" size={14} color={colors.error}>
            {t('dialer.deleteAll')}
          </Typography>
        </Pressable>
      )}

      <DialerEntrySheet
        visible={editingId !== null}
        initialValue={
          editing
            ? {
                phone: editing.phone,
                method: editing.method,
                alert: editing.alert,
              }
            : undefined
        }
        onClose={() => setEditingId(null)}
        onSubmit={values => {
          if (editing) {
            update(editing.id, values);
          } else {
            add(values);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    // RN renders its own dash pattern; the 6,4 spacing in the spec is not
    // configurable on Android
    borderStyle: 'dashed',
  },
  deleteAll: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
