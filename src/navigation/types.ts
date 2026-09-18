import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { SettingsOptionId } from '../screens/main/settings/options';

/** Screens pushed on the root stack. */
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  /** Sign-up verification: the address Cognito emailed the code to. */
  ConfirmSignUp: { email: string };
  /** Password reset step 1; pre-filled when sign-in already had an address. */
  ForgotPassword: { email?: string } | undefined;
  /** Password reset step 2; `destination` is Cognito's masked address. */
  ResetPassword: { email: string; destination?: string };
  /** The only screen a signed-in user sees until they have claimed a device. */
  ClaimDevice: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Profile: undefined;
  Help: undefined;
  SettingsDetail: { optionId: SettingsOptionId };
  ZoneDetails: undefined;
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
