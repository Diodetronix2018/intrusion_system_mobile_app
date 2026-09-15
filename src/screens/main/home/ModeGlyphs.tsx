import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * The mode glyphs from home.svg / home-away.svg.
 *
 * Both were Figma exports that wrapped 90x90 rasters in <pattern>/<use>
 * chains, so the rasters were extracted and the geometry reproduced here.
 * They are drawn as white shapes on transparency, so `color` recolours them
 * through `tintColor` — that is what lets the same asset sit on the navy
 * active card and the light inactive one.
 */

/** Source canvas of home-away.svg, used to scale its two layers together. */
const AWAY_W = 56;
const AWAY_H = 38;

export function HomeGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Image
      source={require('../../../assets/images/mode-home.png')}
      style={{ width: size, height: size }}
      tintColor={color}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export function HomeAwayGlyph({
  size,
  color,
}: {
  /** Height; the width follows the source's 56:38 canvas */
  size: number;
  color: string;
}) {
  const scale = size / AWAY_H;

  return (
    <View style={{ width: AWAY_W * scale, height: size }}>
      {/* house: 37.8 square at x 7.6 in the source canvas */}
      <Image
        source={require('../../../assets/images/mode-away-house.png')}
        style={[
          styles.layer,
          styles.top,
          {
            left: 7.6 * scale,
            width: 37.8 * scale,
            height: 37.8 * scale,
          },
        ]}
        tintColor={color}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      {/* badge: 18.9 square at (36.55, 15.12) */}
      <Image
        source={require('../../../assets/images/mode-away-badge.png')}
        style={[
          styles.layer,
          {
            left: 36.55 * scale,
            top: 15.12 * scale,
            width: 18.9 * scale,
            height: 18.9 * scale,
          },
        ]}
        tintColor={color}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
  top: {
    top: 0,
  },
});
