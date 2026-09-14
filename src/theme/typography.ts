import { TextStyle } from 'react-native';

import { FontFamilyToken, fontFor, FontWeightToken } from './fonts';

/**
 * Figma expresses line-height and letter-spacing as a percentage of the font
 * size; React Native wants absolute points. Used when either is passed
 * explicitly, e.g. <Typography letterSpacing="5%" />.
 */
export const percentOf = (fontSize: number, percent: number) =>
  (fontSize * percent) / 100;

export type TypographyVariant =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'label'
  | 'caption'
  | 'captionBold'
  | 'button'
  | 'cardTitle'
  | 'cardSubtitle'
  | 'screenTitle';

/**
 * Variants deliberately set no lineHeight or letterSpacing — the platform
 * defaults read better than the design file's 100% leading and 50–200%
 * tracking. Pass either prop on <Typography> where a specific value is wanted.
 */
type VariantSpec = {
  fontSize: number;
  weight: FontWeightToken;
  family?: FontFamilyToken;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
};

const specs: Record<TypographyVariant, VariantSpec> = {
  /** Screen title */
  heading: { fontSize: 26, weight: '800', align: 'center' },
  /** Screen subtitle */
  subheading: {
    fontSize: 20,
    weight: '700',
    align: 'center',
    uppercase: true,
  },
  /** Input text and placeholders */
  body: { fontSize: 15, weight: '400' },
  /** Field labels */
  label: { fontSize: 13, weight: '700', uppercase: true },
  /** Helper and footer copy */
  caption: { fontSize: 13, weight: '400', align: 'center' },
  /** Emphasis inside footer copy (the "Register" / "Sign in" span) */
  captionBold: { fontSize: 13, weight: '700', align: 'center' },
  /** Button labels */
  button: { fontSize: 15, weight: '700', align: 'center' },
  /** Settings card title — Poppins 15/700 */
  cardTitle: { fontSize: 15, weight: '700', family: 'poppins' },
  /** Settings card supporting line — Poppins 12/400 */
  cardSubtitle: { fontSize: 12, weight: '400', family: 'poppins' },
  /** Page heading inside a tab — Poppins 22/800 */
  screenTitle: { fontSize: 22, weight: '800', family: 'poppins' },
};

function toTextStyle(spec: VariantSpec): TextStyle {
  return {
    ...fontFor(spec.weight, spec.family),
    fontSize: spec.fontSize,
    ...(spec.align ? { textAlign: spec.align } : null),
    ...(spec.uppercase ? { textTransform: 'uppercase' as const } : null),
  };
}

export const typographyVariants = specs;

/** Ready-made styles, for components that style a plain <Text> directly. */
export const typography = Object.fromEntries(
  Object.entries(specs).map(([name, spec]) => [name, toTextStyle(spec)]),
) as Record<TypographyVariant, TextStyle>;

export { toTextStyle };
