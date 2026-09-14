import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { SettingsOptionId } from '../screens/main/settings/options';

/** Screens pushed on the root stack. */
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Tabs: undefined;
  Profile: undefined;
  Help: undefined;
  SettingsDetail: { optionId: SettingsOptionId };
};

/** Tabs inside the `Tabs` route. */
export type TabParamList = {
  Main: undefined;
  Zone: undefined;
  Dialer: undefined;
  Events: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    // makes useNavigation() typed without a generic at every call site
    interface RootParamList extends RootStackParamList {}
  }
}
