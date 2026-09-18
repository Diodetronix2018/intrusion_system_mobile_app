import type React from 'react';
import type { SvgProps } from 'react-native-svg';

import type { IconFamily } from '../../../components';
import VolumeMuteIcon from '../../../icons/svg/volume-mute.svg';

export type SettingsOptionId =
  | 'specialNotify'
  | 'partSetting'
  | 'silence'
  | 'repeat'
  | 'autoArm'
  | 'relay'
  | 'hooterNotify'
  | 'recordPlay';

export type SettingsOption = {
  id: SettingsOptionId;
  /** Font glyph name. Ignored when `Svg` is set. */
  icon?: string;
  /** Most glyphs are Ionicons; the toggle only exists in Material Design */
  family?: IconFamily;
  /**
   * An SVG dropped into src/icons/svg, used where no font family carries the
   * right glyph. It ships its own white stroke, which is what the navy icon
   * circle needs in both themes.
   */
  Svg?: React.FC<SvgProps>;
};

export const SETTINGS_OPTIONS: SettingsOption[] = [
  { id: 'specialNotify', icon: 'notifications-outline', family: 'ionicons' },
  { id: 'partSetting', icon: 'shield-outline', family: 'ionicons' },
  { id: 'silence', Svg: VolumeMuteIcon },
  { id: 'repeat', icon: 'repeat', family: 'ionicons' },
  { id: 'autoArm', icon: 'time-outline', family: 'ionicons' },
  { id: 'relay', icon: 'toggle-switch-off-outline', family: 'material' },
  { id: 'hooterNotify', icon: 'megaphone-outline', family: 'ionicons' },
  { id: 'recordPlay', icon: 'mic-outline', family: 'ionicons' },
];

export const findSettingsOption = (id: SettingsOptionId) =>
  SETTINGS_OPTIONS.find(option => option.id === id) ?? SETTINGS_OPTIONS[0];
