import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { Screen, Typography } from '../../../components';
import { PlusIcon } from '../../../icons';
import { useTheme } from '../../../theme';
import { DialerCard } from './DialerCard';
import { DialerEntrySheet } from './DialerEntrySheet';
import { DialerEntryInput, MAX_DIALER_ENTRIES } from './types';
import { useDialerEntries } from './useDialerEntries';

/** Sentinel `editingSlot` value that opens the sheet in "add" rather than "edit" mode. */
const ADDING = -1;

export function DialerScreen() {
  const { t } = useTranslation();
  const { colors, radius, spacing, layeredShadow } = useTheme();
  const {
    entries,
    isFull,
    saving,
    add,
    update,
    setMethod,
    setAlert,
    remove,
    removeAll,
  } = useDialerEntries();

  // null = the sheet is closed; ADDING = adding; any other number = editing that slot
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const editing =
    editingSlot !== null && editingSlot !== ADDING
      ? entries.find(entry => entry.slot === editingSlot)
      : undefined;

  const reportError = (err: unknown) => {
    Toast.show({
      type: 'error',
      text1: t('common.configurationFailed'),
      text2: (err as any)?.message,
    });
  };

  const handleSheetSubmit = async (values: DialerEntryInput) => {
    try {
      if (editing) {
        await update(editing.slot, values);
      } else {
        await add(values);
      }
      // Only close once the publish actually landed — a failure leaves the
      // sheet open (with an error toast) so the user's input isn't lost.
      setEditingSlot(null);
    } catch (err) {
      reportError(err);
    }
  };

  const confirmDelete = (slot: number, phone: string) => {
    Alert.alert(t('dialer.deleteNumber'), t('dialer.confirmDelete', { phone }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove(slot).catch(reportError),
      },
    ]);
  };

  const confirmDeleteAll = () => {
    Alert.alert(t('dialer.deleteAll'), t('dialer.confirmDeleteAll'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => removeAll().catch(reportError),
      },
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

      {entries.map(entry => (
        <DialerCard
          key={entry.slot}
          entry={entry}
          index={entry.slot + 1}
          disabled={saving}
          onEdit={() => setEditingSlot(entry.slot)}
          onDelete={() => confirmDelete(entry.slot, entry.phone)}
          onMethodChange={method =>
            setMethod(entry.slot, method).catch(reportError)
          }
          onAlertChange={alert =>
            setAlert(entry.slot, alert).catch(reportError)
          }
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
          onPress={() => setEditingSlot(ADDING)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t('dialer.addNumber')}
          style={({ pressed }) => [
            styles.addCard,
            {
              borderRadius: radius.md,
              borderColor: colors.primary,
              backgroundColor: colors.card,
              gap: spacing.sm + 2,
              opacity: pressed || saving ? 0.6 : 1,
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
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.deleteAll,
            { paddingVertical: spacing.lg, opacity: pressed || saving ? 0.6 : 1 },
          ]}
        >
          <Typography variant="cardTitle" size={14} color={colors.error}>
            {t('dialer.deleteAll')}
          </Typography>
        </Pressable>
      )}

      <DialerEntrySheet
        visible={editingSlot !== null}
        initialValue={
          editing
            ? {
                phone: editing.phone,
                method: editing.method,
                alert: editing.alert,
              }
            : undefined
        }
        saving={saving}
        onClose={() => setEditingSlot(null)}
        onSubmit={handleSheetSubmit}
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
