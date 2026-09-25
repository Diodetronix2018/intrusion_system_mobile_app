import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon } from '../icons';
import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';
import { Typography } from './Typography';

export type SheetOption<T extends string> = {
  value: T;
  label: string;
  /** Optional second line under the label */
  hint?: string;
};

export type OptionSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  options: readonly SheetOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * Bottom sheet with a pick-one list. Selecting an option applies it and
 * closes, so there is no confirm button to get wrong.
 */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  const { colors, radius, spacing } = useTheme();
  const { gutter, contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // caps a long list (e.g. a state's districts) to a scrollable pane instead
  // of pushing off the bottom of the screen; short lists just render smaller
  const listMaxHeight = windowHeight * 0.5;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* tapping the scrim dismisses, matching the hardware back button */}
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.overlay }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={title}
      />

      <View style={styles.anchor} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              maxWidth: contentMaxWidth,
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.lg + 8,
              borderTopRightRadius: radius.lg + 8,
              paddingHorizontal: gutter,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <Typography
            variant="cardTitle"
            size={16}
            align="left"
            color={colors.primary}
            style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
          >
            {title}
          </Typography>

          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {options.map((option, index) => {
              const isSelected = option.value === selected;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    { paddingVertical: spacing.lg, gap: spacing.md },
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.optionText}>
                    <Typography
                      variant="cardTitle"
                      weight={isSelected ? '700' : '400'}
                      align="left"
                      color={colors.text}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Typography>
                    {!!option.hint && (
                      <Typography
                        variant="cardSubtitle"
                        align="left"
                        color={colors.textSecondary}
                        numberOfLines={1}
                        style={{ marginTop: spacing.xs }}
                      >
                        {option.hint}
                      </Typography>
                    )}
                  </View>

                  {isSelected && <CheckIcon size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
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
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
});
