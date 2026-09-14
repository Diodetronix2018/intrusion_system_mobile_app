import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { useTheme } from '../theme';
import {
  FontFamilyToken,
  fontFor,
  FontWeightToken,
} from '../theme/fonts';
import {
  percentOf,
  typographyVariants,
  TypographyVariant,
} from '../theme/typography';

/** `'5%'` is read as a percentage of the font size, matching Figma. */
export type Measure = number | `${number}%`;

export type TypographyProps = Omit<TextProps, 'style'> & {
  children: React.ReactNode;
  /** Base style to start from. Every prop below overrides it. */
  variant?: TypographyVariant;
  size?: number;
  weight?: FontWeightToken;
  /** Switches face family, e.g. 'poppins' */
  family?: FontFamilyToken;
  /** Absolute points, or a percentage of the font size. Off by default. */
  lineHeight?: Measure;
  letterSpacing?: Measure;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  align?: TextStyle['textAlign'];
  color?: string;
  underline?: boolean;
  italic?: boolean;
  style?: StyleProp<TextStyle>;
};

const resolve = (value: Measure | undefined, fontSize: number) => {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === 'number'
    ? value
    : percentOf(fontSize, parseFloat(value));
};

export function Typography({
  children,
  variant = 'body',
  size,
  weight,
  family,
  lineHeight,
  letterSpacing,
  uppercase,
  lowercase,
  capitalize,
  align,
  color,
  underline,
  italic,
  style,
  ...textProps
}: TypographyProps) {
  const { colors, typography } = useTheme();
  const base = typography[variant];

  const fontSize = size ?? (base.fontSize as number);
  // a `weight` override must keep the variant's family, or overriding the
  // weight on a Poppins variant would silently fall back to the default family
  const resolvedFamily = family ?? typographyVariants[variant].family;

  const transform: TextStyle['textTransform'] | undefined = uppercase
    ? 'uppercase'
    : lowercase
    ? 'lowercase'
    : capitalize
    ? 'capitalize'
    : undefined;

  const override: TextStyle = {
    ...(weight || family
      ? fontFor(weight ?? typographyVariants[variant].weight, resolvedFamily)
      : null),
    ...(size !== undefined ? { fontSize } : null),
    ...(lineHeight !== undefined
      ? { lineHeight: resolve(lineHeight, fontSize) }
      : null),
    ...(letterSpacing !== undefined
      ? { letterSpacing: resolve(letterSpacing, fontSize) }
      : null),
    ...(transform ? { textTransform: transform } : null),
    ...(align ? { textAlign: align } : null),
    ...(underline ? { textDecorationLine: 'underline' as const } : null),
    ...(italic ? { fontStyle: 'italic' as const } : null),
    color: color ?? colors.text,
  };

  return (
    <Text style={[base, override, style]} {...textProps}>
      {children}
    </Text>
  );
}
