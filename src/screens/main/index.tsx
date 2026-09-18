import React from 'react';
import { useTranslation } from 'react-i18next';

import { BellIcon } from '../../icons';
import { useTheme } from '../../theme';
import { PlaceholderScreen } from './PlaceholderScreen';
import { useEventsTelemetry } from './useEventsTelemetry';

function useTabScreen(key: string) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return {
    title: t(`tabs.${key}`),
    description: t(`screens.${key}`),
    color: colors.primary,
  };
}

export function EventsScreen() {
  const { title, description, color } = useTabScreen('events');
  // Diagnostic only, for now — fetches dtx_tngrama_telemetry and logs the
  // raw rows (tagged "[Events]") so the shape can be inspected before any
  // UI is built on top of it. Doesn't change what renders below.
  useEventsTelemetry();
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<BellIcon size={32} color={color} />}
    />
  );
}

export {
  MainScreen,
  MainStatusProvider,
  StatusCard,
  ZoneDetailsScreen,
} from './home';
export { DialerScreen } from './dialer';
export { ZoneScreen } from './zone';
export {
  findSettingsOption,
  SETTINGS_OPTIONS,
  SettingsDetailScreen,
  SettingsOptionCard,
  SettingsScreen,
} from './settings';
export type { SettingsOption, SettingsOptionId } from './settings';
export { PlaceholderScreen } from './PlaceholderScreen';
