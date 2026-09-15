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
