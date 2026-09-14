import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  BellIcon,
  HomeIcon,
  LocationPinIcon,
  PhoneIcon,
  SettingsIcon,
} from '../../icons';
import { useTheme } from '../../theme';
import { PlaceholderScreen } from './PlaceholderScreen';

function useTabScreen(key: string) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return {
    title: t(`tabs.${key}`),
    description: t(`screens.${key}`),
    color: colors.primary,
  };
}

export function MainScreen() {
  const { title, description, color } = useTabScreen('main');
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<HomeIcon size={32} color={color} />}
    />
  );
}

export function ZoneScreen() {
  const { title, description, color } = useTabScreen('zone');
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<LocationPinIcon size={32} color={color} />}
    />
  );
}

export function DialerScreen() {
  const { title, description, color } = useTabScreen('dialer');
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<PhoneIcon size={32} color={color} />}
    />
  );
}

export function EventsScreen() {
  const { title, description, color } = useTabScreen('events');
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<BellIcon size={32} color={color} />}
    />
  );
}

export function SettingsScreen() {
  const { title, description, color } = useTabScreen('settings');
  return (
    <PlaceholderScreen
      title={title}
      description={description}
      icon={<SettingsIcon size={32} color={color} />}
    />
  );
}

export { PlaceholderScreen } from './PlaceholderScreen';
