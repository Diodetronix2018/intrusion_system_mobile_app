/**
 * Single source of truth for AWS configuration, read from the `.env` file at
 * build time (via react-native-dotenv). Nothing here is shown to the user; the
 * pool/client/endpoint IDs are non-secret identifiers meant to ship in the app.
 *
 * Values match the ones used by the sibling 3-phase app, so both products sign
 * users into the same Cognito User Pool.
 */
import {
  AWS_REGION,
  COGNITO_USER_POOL_ID,
  COGNITO_APP_CLIENT_ID,
  COGNITO_IDENTITY_POOL_ID,
  IOT_ENDPOINT as ENV_IOT_ENDPOINT,
  IOT_POLICY_NAME as ENV_IOT_POLICY_NAME,
} from '@env';
import type { CognitoConfig } from '../session/cognito';

export const COGNITO: CognitoConfig = {
  region: AWS_REGION,
  userPoolId: COGNITO_USER_POOL_ID,
  appClientId: COGNITO_APP_CLIENT_ID,
  identityPoolId: COGNITO_IDENTITY_POOL_ID,
};

// Not used by the auth flow — kept here so the IoT work has the same single
// source of configuration to reach for.
export const IOT_ENDPOINT = ENV_IOT_ENDPOINT;
export const IOT_POLICY_NAME = ENV_IOT_POLICY_NAME;

// Named device shadow the settings screens (Special Notify, Part Setting,
// Silence, Repeat, Auto ARM, Relay, Dialer, Zone) publish their config to:
// `$aws/things/<thing>/shadow/name/sba_config_v01/update`.
export const SBA_CONFIG_SHADOW = 'sba_config_v01';

// Named device shadow the Main (home) screen's live controls publish to —
// arm mode, mute, reset, all/part: `$aws/things/<thing>/shadow/name/sba_control_v01/update`.
export const SBA_CONTROL_SHADOW = 'sba_control_v01';

// DynamoDB table the provisioner writes each device + claim code into
// (partition key: thingName). Read-only from the app — claiming validates a
// scanned/typed code against this table but never writes to it.
export const DEVICES_TABLE = 'dtx_devices';

// DynamoDB table recording which users have claimed which devices (partition
// key: owner — the Cognito sub; sort key: thingName). Many users can claim
// the same device, and one user can hold several — this is the list the app
// lets them switch between.
export const USER_DEVICES_TABLE = 'dtx_user_devices';

// DynamoDB table holding each device's event/telemetry history, read for the
// Events tab (partition key assumed to be `thingName`, matching every other
// table in this app — confirm once real rows come back).
export const TELEMETRY_TABLE = 'dtx_tngrama_telemetry';
