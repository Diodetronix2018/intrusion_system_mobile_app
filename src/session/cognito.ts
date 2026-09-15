/**
 * Cognito User Pool client — sign in, sign up, verification and password reset.
 *
 * Ported from the sibling 3-phase app so both products talk to the same pool
 * the same way: plain `fetch` against the public `cognito-idp` endpoints plus
 * `crypto-js` for the SRP maths. No Amplify, no native SDK.
 *
 * The app client only allows USER_SRP_AUTH (USER_PASSWORD_AUTH is disabled), so
 * the password never leaves the device — only a zero-knowledge proof of it does.
 */
import CryptoJS from 'crypto-js';

export interface CognitoConfig {
  region: string;
  userPoolId: string;
  appClientId: string;
  identityPoolId: string;
}

export interface AuthTokens {
  idToken: string;
  /** Cognito access token — required by self-service calls (GlobalSignOut…). */
  accessToken: string;
  refreshToken: string;
  /** Lifetime of the ID/access tokens in seconds (typically 3600). */
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// Transport — the Cognito JSON 1.1 protocol over plain fetch.
// ---------------------------------------------------------------------------

async function cognitoCall(
  region: string,
  target: string,
  body: object,
): Promise<any> {
  const res = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': target,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* leave json empty; error handling below */
  }
  if (!res.ok) {
    const message =
      json?.message || json?.Message || json?.__type || text || `HTTP ${res.status}`;
    const err = new CognitoError(message, json?.__type);
    throw err;
  }
  return json;
}

/** Carries Cognito's error code (e.g. `UserNotConfirmedException`) alongside the message. */
export class CognitoError extends Error {
  /** The `__type` Cognito returned, without its namespace prefix. */
  readonly code?: string;

  constructor(message: string, type?: string) {
    super(message);
    this.name = 'CognitoError';
    this.code = type ? String(type).split('#').pop() : undefined;
  }
}

// ---------------------------------------------------------------------------
// SRP (Secure Remote Password) — Cognito USER_SRP_AUTH
//
// A faithful port of the math in `amazon-cognito-identity-js`
// (AuthenticationHelper), kept dependency-free with native BigInt for modular
// exponentiation + crypto-js for SHA256/HMAC.
//
// Handshake:
//   InitiateAuth(USER_SRP_AUTH, SRP_A)            → PASSWORD_VERIFIER challenge
//   RespondToAuthChallenge(PASSWORD_VERIFIER, …)  → AuthenticationResult.IdToken
// ---------------------------------------------------------------------------

// 3072-bit group (RFC 5054) used by Cognito, and generator g = 2.
const SRP_N_HEX =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74' +
  '020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437' +
  '4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF05' +
  '98DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB' +
  '9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
  'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF695581718' +
  '3995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33' +
  'A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7' +
  'ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864' +
  'D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E2' +
  '08E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF';
const SRP_N = BigInt('0x' + SRP_N_HEX);
const SRP_G = 2n;
const HKDF_INFO = 'Caldera Derived Key';

/** Modular exponentiation, normalising a possibly-negative base into [0, mod). */
/* eslint-disable no-bitwise -- square-and-multiply is defined in terms of bits */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let b = base % mod;
  if (b < 0n) b += mod;
  let result = 1n;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
}
/* eslint-enable no-bitwise */

/** Hex string of a BigInt, padded the way Cognito's SRP expects (even length, sign-safe). */
function padHex(bn: bigint): string {
  let hex = bn.toString(16);
  if (hex.length % 2 === 1) hex = '0' + hex;
  else if ('89abcdef'.indexOf(hex[0]) !== -1) hex = '00' + hex;
  return hex;
}

/** SHA256 of the bytes encoded by a hex string, returned as 64-char hex. */
function hexHash(hexStr: string): string {
  return CryptoJS.SHA256(CryptoJS.enc.Hex.parse(hexStr))
    .toString(CryptoJS.enc.Hex)
    .padStart(64, '0');
}

/** SHA256 of a UTF-8 string, returned as 64-char hex. */
function utf8Hash(str: string): string {
  return CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(str))
    .toString(CryptoJS.enc.Hex)
    .padStart(64, '0');
}

/**
 * Random ephemeral `a`. No secure RNG is available under Hermes without a native
 * module, so we seed from Math.random — acceptable for a per-login ephemeral SRP
 * secret that is never persisted or reused.
 */
function generateSmallA(): bigint {
  let hex = '';
  for (let i = 0; i < 128; i++) {
    hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return BigInt('0x' + hex) % SRP_N;
}

/** HKDF as Cognito uses it: first 16 bytes, info = "Caldera Derived Key" + 0x01. */
function computeHkdf(
  ikm: CryptoJS.lib.WordArray,
  salt: CryptoJS.lib.WordArray,
): CryptoJS.lib.WordArray {
  const prk = CryptoJS.HmacSHA256(ikm, salt);
  const info = CryptoJS.enc.Utf8.parse(HKDF_INFO).concat(
    CryptoJS.lib.WordArray.create([0x01000000], 1),
  );
  const okm = CryptoJS.HmacSHA256(info, prk);
  return CryptoJS.lib.WordArray.create(okm.words.slice(0, 4), 16);
}

/** Cognito SRP timestamp, e.g. "Tue Jun 25 16:45:30 UTC 2026" (day not zero-padded). */
function srpTimestamp(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const now = new Date();
  const p = (n: number) => (n < 10 ? '0' : '') + n;
  return (
    `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${now.getUTCDate()} ` +
    `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())} ` +
    `UTC ${now.getUTCFullYear()}`
  );
}

/** Cognito User Pool sign-in via SRP (USER_SRP_AUTH). Returns the issued tokens. */
export async function signInUserPool(
  cfg: CognitoConfig,
  username: string,
  password: string,
): Promise<AuthTokens> {
  const poolName = cfg.userPoolId.split('_')[1];

  // --- Round 1: send the client public value A and request the challenge. ---
  const smallA = generateSmallA();
  const largeA = modPow(SRP_G, smallA, SRP_N);

  const init = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.InitiateAuth',
    {
      AuthFlow: 'USER_SRP_AUTH',
      ClientId: cfg.appClientId,
      AuthParameters: { USERNAME: username, SRP_A: largeA.toString(16) },
    },
  );

  if (init?.ChallengeName !== 'PASSWORD_VERIFIER') {
    if (init?.ChallengeName) {
      throw new Error(`Sign-in challenge "${init.ChallengeName}" is not supported here.`);
    }
    throw new Error('Sign-in did not return the expected SRP challenge.');
  }

  const params = init.ChallengeParameters || {};
  const userIdForSrp: string = params.USER_ID_FOR_SRP || username;
  const salt = BigInt('0x' + params.SALT);
  const srpB = BigInt('0x' + params.SRP_B);
  const secretBlock: string = params.SECRET_BLOCK;

  if (srpB % SRP_N === 0n) throw new Error('Invalid server SRP value (B mod N == 0).');

  // --- Derive the shared secret and the password proof. ---
  const k = BigInt('0x' + hexHash(padHex(SRP_N) + padHex(SRP_G)));
  const u = BigInt('0x' + hexHash(padHex(largeA) + padHex(srpB)));
  if (u === 0n) throw new Error('Invalid SRP U value (U == 0).');

  const usernamePasswordHash = utf8Hash(`${poolName}${userIdForSrp}:${password}`);
  const x = BigInt('0x' + hexHash(padHex(salt) + usernamePasswordHash));

  // S = (B - k * g^x) ^ (a + u*x) mod N
  const sValue = modPow(srpB - k * modPow(SRP_G, x, SRP_N), smallA + u * x, SRP_N);
  const hkdf = computeHkdf(
    CryptoJS.enc.Hex.parse(padHex(sValue)),
    CryptoJS.enc.Hex.parse(padHex(u)),
  );

  const timestamp = srpTimestamp();
  const message = CryptoJS.enc.Utf8.parse(poolName)
    .concat(CryptoJS.enc.Utf8.parse(userIdForSrp))
    .concat(CryptoJS.enc.Base64.parse(secretBlock))
    .concat(CryptoJS.enc.Utf8.parse(timestamp));
  const signature = CryptoJS.HmacSHA256(message, hkdf).toString(CryptoJS.enc.Base64);

  // --- Round 2: send the password proof. ---
  const verify = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
    {
      ChallengeName: 'PASSWORD_VERIFIER',
      ClientId: cfg.appClientId,
      ChallengeResponses: {
        USERNAME: userIdForSrp,
        PASSWORD_CLAIM_SECRET_BLOCK: secretBlock,
        PASSWORD_CLAIM_SIGNATURE: signature,
        TIMESTAMP: timestamp,
      },
    },
  );

  const result = verify?.AuthenticationResult;
  if (!result?.IdToken) {
    if (verify?.ChallengeName) {
      throw new Error(`Sign-in challenge "${verify.ChallengeName}" is not supported here.`);
    }
    throw new Error('Sign-in succeeded but no ID token was returned.');
  }
  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken,
    expiresIn: result.ExpiresIn ?? 3600,
  };
}

/**
 * Exchange a refresh token for a fresh ID/access token (REFRESH_TOKEN_AUTH).
 * The refresh token itself is not rotated, so the caller keeps reusing it until
 * it expires (default 30 days), at which point this throws and the user must
 * sign in again.
 */
export async function refreshSession(
  cfg: CognitoConfig,
  refreshToken: string,
): Promise<{ idToken: string; accessToken: string; expiresIn: number }> {
  const json = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.InitiateAuth',
    {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: cfg.appClientId,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    },
  );
  const result = json?.AuthenticationResult;
  if (!result?.IdToken) {
    throw new Error('Could not refresh the session. Please sign in again.');
  }
  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    expiresIn: result.ExpiresIn ?? 3600,
  };
}

// ---------------------------------------------------------------------------
// Sign-up (self-registration into the User Pool) — public client, no secret.
// ---------------------------------------------------------------------------

/**
 * Register a new user in the Cognito User Pool. Returns `userConfirmed`:
 *  - false → a verification code was emailed; call `confirmSignUp` next.
 *  - true  → the pool auto-confirms; the user can sign in immediately.
 */
export async function signUp(
  cfg: CognitoConfig,
  email: string,
  password: string,
  name: string,
): Promise<{ userConfirmed: boolean; destination?: string }> {
  const json = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.SignUp',
    {
      ClientId: cfg.appClientId,
      Username: email,
      Password: password,
      // The pool requires the standard `name` attribute, so it's always sent.
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
      ],
    },
  );
  return {
    userConfirmed: Boolean(json?.UserConfirmed),
    destination: json?.CodeDeliveryDetails?.Destination,
  };
}

/** Confirm a sign-up with the emailed verification code. */
export async function confirmSignUp(
  cfg: CognitoConfig,
  email: string,
  code: string,
): Promise<void> {
  await cognitoCall(cfg.region, 'AWSCognitoIdentityProviderService.ConfirmSignUp', {
    ClientId: cfg.appClientId,
    Username: email,
    ConfirmationCode: code,
  });
}

/** Re-send the sign-up verification code. */
export async function resendConfirmationCode(
  cfg: CognitoConfig,
  email: string,
): Promise<{ destination?: string }> {
  const json = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.ResendConfirmationCode',
    {
      ClientId: cfg.appClientId,
      Username: email,
    },
  );
  return { destination: json?.CodeDeliveryDetails?.Destination };
}

// ---------------------------------------------------------------------------
// Password reset — the two-step "forgot password" flow.
// ---------------------------------------------------------------------------

/**
 * Step 1 — ask Cognito to email a reset code. Returns where it went (a masked
 * address, e.g. `j***@e***.com`) so the next screen can say so.
 *
 * Cognito deliberately does not reveal whether the account exists unless the
 * pool is configured to; treat a success here as "a code was sent if we know
 * that address".
 */
export async function forgotPassword(
  cfg: CognitoConfig,
  email: string,
): Promise<{ destination?: string }> {
  const json = await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.ForgotPassword',
    {
      ClientId: cfg.appClientId,
      Username: email,
    },
  );
  return { destination: json?.CodeDeliveryDetails?.Destination };
}

/** Step 2 — set a new password using the emailed reset code. */
export async function confirmForgotPassword(
  cfg: CognitoConfig,
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await cognitoCall(
    cfg.region,
    'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
    {
      ClientId: cfg.appClientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    },
  );
}

// ---------------------------------------------------------------------------
// Sign-out
// ---------------------------------------------------------------------------

/**
 * Revoke every refresh token issued to this user, so a stolen copy of the one
 * we just deleted locally is useless. Best-effort: the local session is cleared
 * whether or not this succeeds.
 */
export async function globalSignOut(
  cfg: CognitoConfig,
  accessToken: string,
): Promise<void> {
  await cognitoCall(cfg.region, 'AWSCognitoIdentityProviderService.GlobalSignOut', {
    AccessToken: accessToken,
  });
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/** Decode a base64url segment to a UTF-8 string, without needing Buffer/atob. */
function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return CryptoJS.enc.Base64.parse(padded).toString(CryptoJS.enc.Utf8);
}

/**
 * Decode the (unverified) claims out of a Cognito JWT — used only to read the
 * signed-in user's profile attributes (name, email) for display. The token was
 * already obtained over TLS from Cognito, so we don't re-verify the signature.
 */
export function decodeJwtClaims(token: string): Record<string, any> {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return {};
  }
}
