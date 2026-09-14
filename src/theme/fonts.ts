import { TextStyle } from 'react-native';

export type FontWeightToken = '400' | '500' | '600' | '700' | '800';

/** Families the design uses. Add a face map below to introduce another. */
export type FontFamilyToken = 'openSansHebrew' | 'poppins';

export const FONT_FAMILY_NAMES: Record<FontFamilyToken, string> = {
  openSansHebrew: 'Open Sans Hebrew',
  poppins: 'Poppins',
};

/**
 * PostScript names of the individual faces, per family and weight.
 *
 * iOS resolves fonts by PostScript name, not family + weight, so each weight
 * maps to its own face. Drop the matching .ttf files into src/assets/fonts,
 * run `npx react-native-asset`, and rebuild.
 *
 * Verify the real PostScript names before shipping — open the .ttf in Font
 * Book (⌘I) or run `fc-scan --format "%{postscriptname}\n" <file>.ttf`. Until
 * the files are linked, React Native falls back to the system font and the
 * `fontWeight` below keeps the intended weight.
 */
export const fontFaces: Record<
  FontFamilyToken,
  Record<FontWeightToken, string>
> = {
  openSansHebrew: {
    '400': 'OpenSansHebrew-Regular',
    '500': 'OpenSansHebrew-Regular',
    '600': 'OpenSansHebrew-Bold',
    '700': 'OpenSansHebrew-Bold',
    '800': 'OpenSansHebrew-ExtraBold',
  },
  poppins: {
    '400': 'Poppins-Regular',
    '500': 'Poppins-Medium',
    '600': 'Poppins-SemiBold',
    '700': 'Poppins-Bold',
    '800': 'Poppins-ExtraBold',
  },
};

export const DEFAULT_FONT_FAMILY: FontFamilyToken = 'openSansHebrew';

export function fontFor(
  weight: FontWeightToken,
  family: FontFamilyToken = DEFAULT_FONT_FAMILY,
): TextStyle {
  return { fontFamily: fontFaces[family][weight], fontWeight: weight };
}
