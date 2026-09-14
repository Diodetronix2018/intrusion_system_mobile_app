import React from 'react';
import { StatusBar, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { useResponsive } from '../utils/responsive';

/** Vertical page padding from the design. Horizontal comes from the gutter. */
export const PAGE_PADDING_VERTICAL = 20;

export type ScreenProps = {
  children: React.ReactNode;
  /**
   * Pinned to the bottom of the screen, outside the scroll area, and lifted
   * with the keyboard. Use it for the primary action button.
   */
  footer?: React.ReactNode;
  /** Wraps the content in a scroll view — turn off for full-height layouts */
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Applies the horizontal gutter; off for edge-to-edge screens */
  padded?: boolean;
  /** Overrides the page colour, e.g. the grouped background behind cards */
  background?: string;
  /**
   * Safe-area edges to pad. Screens rendered under <AppHeader> should drop
   * 'top', since the header already consumes that inset.
   */
  edges?: readonly Edge[];
};

export function Screen({
  children,
  footer,
  scrollable = true,
  style,
  contentContainerStyle,
  padded = true,
  background,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { colors, isDark, spacing } = useTheme();
  const { gutter, contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const horizontal = padded ? gutter : 0;

  const pagePadding: ViewStyle = {
    paddingHorizontal: horizontal,
    paddingTop: PAGE_PADDING_VERTICAL,
    // with a pinned footer the bottom padding lives on the footer instead
    paddingBottom: footer ? spacing.lg : PAGE_PADDING_VERTICAL + insets.bottom,
  };

  const measure: ViewStyle = { maxWidth: contentMaxWidth };

  const content = (
    <View style={[styles.measured, measure, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.flex,
        { backgroundColor: background ?? colors.background },
        style,
      ]}
    >
      {/* Android is edge-to-edge in RN 0.87, so only the bar style is set */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {scrollable ? (
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, pagePadding]}
          bottomOffset={PAGE_PADDING_VERTICAL * 2}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.flex, pagePadding]}>{content}</View>
      )}

      {!!footer && (
        // rides up with the keyboard; the safe-area inset is only needed while
        // the keyboard is closed, so it is cancelled out when open
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
          <View
            style={[
              styles.footer,
              {
                paddingHorizontal: horizontal,
                paddingTop: spacing.md,
                paddingBottom: PAGE_PADDING_VERTICAL + insets.bottom,
                backgroundColor: background ?? colors.background,
              },
            ]}
          >
            <View style={[styles.measured, measure]}>{footer}</View>
          </View>
        </KeyboardStickyView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  measured: {
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  footer: {
    width: '100%',
  },
});
