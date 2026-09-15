/**
 * Colour tokens.
 *
 * `light` is the spec handed over by design. `dark` mirrors it key-for-key —
 * every token exists in both themes so components never branch on the mode.
 */

export type ThemeColors = {
  /** Page / screen background */
  background: string;
  /** Raised surfaces: cards, sheets, modals */
  surface: string;
  /** Page behind a grouped card list */
  backgroundGrouped: string;
  /** A settings card sitting on `backgroundGrouped` */
  card: string;
  /**
   * The design uses three distinct page tints; each is its own token so a
   * screen never reaches for a near-miss value.
   * `backgroundGrouped` #EFF1F5 · `backgroundSubtle` #F4F5F8 · `backgroundSoft` #F8FAFC
   */
  backgroundSubtle: string;
  backgroundSoft: string;
  /** Wash behind a chevron / action circle on a card */
  accentWell: string;
  /** Tint of the striped rows in a zebra list; the others keep the card */
  rowStripe: string;
  /** Track of a switch in the off position */
  switchTrackOff: string;
  /** Fill of an unselected chip */
  chipBackground: string;
  /** Flat, borderless surface that sits on the page, e.g. the zone selector */
  surfaceMuted: string;
  /** Colour of the card drop shadow */
  cardShadow: string;

  /** App bar background */
  headerBackground: string;
  /** App bar text and icons */
  headerForeground: string;
  /** Hairline under the app bar */
  headerBorder: string;
  /** Wash behind icon buttons in the app bar */
  headerAccent: string;

  /** Brand colour — filled buttons, focus rings, links */
  primary: string;
  /** Content sitting on top of `primary` */
  onPrimary: string;
  /** Supporting copy on a brand-filled surface */
  onPrimaryMuted: string;
  /** Hairline on a brand-filled surface */
  onPrimaryDivider: string;
  /** Low-opacity brand wash for pressed/selected states */
  primaryMuted: string;

  /** Primary body copy */
  text: string;
  /** Supporting copy, helper text */
  textSecondary: string;
  /** Disabled / tertiary copy */
  textMuted: string;
  /** Inline links and the "Forgot password" action */
  link: string;

  /** Hairlines and dividers */
  border: string;

  inputBackground: string;
  inputBorder: string;
  /** Input border once the field has focus */
  inputBorderFocused: string;
  inputText: string;
  inputPlaceholder: string;
  inputLabel: string;

  error: string;
  /** Solid fill for destructive buttons — always dark enough for white text */
  errorSurface: string;
  /** Content sitting on `errorSurface` */
  onError: string;
  /** Low-opacity red wash for destructive icon wells */
  errorMuted: string;
  /** Subsystem status: healthy / degraded / faulted */
  success: string;
  warning: string;
  failed: string;

  /** Colour used by the elevated-button shadow */
  shadow: string;

  /** Scrim behind modals and sheets */
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  backgroundGrouped: '#EFF1F5',
  card: '#FFFFFF',
  backgroundSubtle: '#F4F5F8',
  backgroundSoft: '#F8FAFC',
  accentWell: '#E5E5F5',
  rowStripe: '#F4F5F8',
  switchTrackOff: '#D1D5DB',
  chipBackground: '#F4F5F8',
  surfaceMuted: '#F3F4F6',
  cardShadow: '#000000',

  headerBackground: '#F8FAFC',
  headerForeground: '#000055',
  headerBorder: '#E5E7EB',
  headerAccent: 'rgba(0, 0, 85, 0.08)',

  primary: '#000055',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#B2B2CC',
  onPrimaryDivider: '#E2E8F0',
  primaryMuted: 'rgba(0, 0, 85, 0.08)',

  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  link: '#3A88E2',

  border: '#E5E7EB',

  inputBackground: '#F4F5F7',
  inputBorder: '#E5E7EB',
  inputBorderFocused: '#000055',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',
  inputLabel: '#000055',

  error: '#D32F2F',
  errorSurface: '#D32F2F',
  onError: '#FFFFFF',
  errorMuted: 'rgba(211, 47, 47, 0.12)',
  success: '#00C853',
  warning: '#F59E0B',
  failed: '#EF4444',

  shadow: '#000055',

  overlay: 'rgba(17, 24, 39, 0.45)',
};

/**
 * Dark theme, built on a navy-leaning slate ramp so it reads as the same
 * product as the light theme (which already uses slate greys: #EFF1F5,
 * #F8FAFC, #E5E7EB) rather than a neutral black.
 *
 * The brand navy #000055 is unusable on a dark canvas, so `primary` is lifted
 * to #4A6CF0 — same family, and it clears 4.5:1 against white text.
 */
export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  // the page sits darker than the cards, mirroring the light theme's
  // grey-page / white-card separation
  backgroundGrouped: '#0B1120',
  card: '#1E293B',
  backgroundSubtle: '#0B1120',
  backgroundSoft: '#0B1120',
  accentWell: 'rgba(74, 108, 240, 0.22)',
  // a tint rather than a fixed colour, so it works on any card surface
  rowStripe: 'rgba(255, 255, 255, 0.04)',
  switchTrackOff: '#334155',
  // sits lighter than the page so an unselected chip stays visible
  chipBackground: '#1E293B',
  surfaceMuted: '#1E293B',
  cardShadow: '#000000',

  // the app bar takes the brand colour on dark, where a near-black bar would
  // disappear into the page
  headerBackground: '#4A6CF0',
  headerForeground: '#FFFFFF',
  headerBorder: 'transparent',
  headerAccent: 'rgba(255, 255, 255, 0.18)',

  primary: '#4A6CF0',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#B2B2CC',
  onPrimaryDivider: '#E2E8F0',
  primaryMuted: 'rgba(74, 108, 240, 0.18)',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  // lifted from #3A88E2 so it still reads as a link on the dark canvas
  link: '#60A5FA',

  border: '#334155',

  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputBorderFocused: '#4A6CF0',
  inputText: '#F1F5F9',
  inputPlaceholder: '#64748B',
  inputLabel: '#CBD5E1',

  // a lighter red reads better as text on the dark canvas, but the button
  // fill stays #D32F2F so white text keeps its 4.9:1 contrast
  error: '#F87171',
  errorSurface: '#D32F2F',
  onError: '#FFFFFF',
  errorMuted: 'rgba(248, 113, 113, 0.16)',
  // mid-tones that read on either canvas, so they do not change by theme
  success: '#00C853',
  warning: '#F59E0B',
  failed: '#EF4444',

  shadow: '#000000',

  overlay: 'rgba(2, 6, 23, 0.7)',
};
