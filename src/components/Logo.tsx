import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme';

/**
 * Brand mark.
 *
 * The Figma export wrapped a raster logo in a <pattern>/<use>/<image> chain,
 * which react-native-svg renders unreliably and would have shipped ~300KB of
 * base64 in the JS bundle. The raster was extracted to
 * src/assets/images/logo@{1,2,3}x.png and the two rings around it — a 3%
 * brand-tinted fill and a 12% brand stroke — are reproduced here as views.
 *
 * The 110 / 90 numbers are the outer and inner diameters from the export;
 * `size` scales both together.
 */
export function Logo({
  size = 110,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, isDark } = useTheme();
  const scale = size / 110;
  const inner = 90 * scale;

  // 3% brand-tinted fill and a 12% brand stroke, per the export
  const ringColors = {
    backgroundColor: isDark ? colors.surface : 'rgba(0, 0, 85, 0.031)',
    borderColor: isDark ? colors.border : 'rgba(0, 0, 85, 0.122)',
  };

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        ringColors,
        style,
      ]}
    >
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: inner, height: inner, borderRadius: inner / 2 }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
