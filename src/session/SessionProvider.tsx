import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { COGNITO, DEVICES_TABLE, USER_DEVICES_TABLE } from '../config/awsConfig';
import { StorageService } from '../storage';
import { queryUserDevices } from '../utils/dynamoDb';
import {
  CognitoError,
  confirmForgotPassword as cognitoConfirmForgotPassword,
  confirmSignUp as cognitoConfirmSignUp,
  decodeJwtClaims,
  forgotPassword as cognitoForgotPassword,
  getCredentials,
  globalSignOut,
  refreshSession,
  resendConfirmationCode,
  signInUserPool,
  signUp as cognitoSignUp,
} from './cognito';
import { claimDeviceInDynamo } from './deviceClaim';

const SESSION_KEY = 'auth_session';
/** Refresh the ID token this many ms before it actually expires. */
const EXPIRY_SKEW_MS = 60_000;

/** The signed-in user as the app's screens want to read them. */
export type User = {
  name: string;
  email: string;
};

/** Everything persisted between launches so the user stays signed in. */
export type AuthSession = {
  email: string;
  /** Full name from the Cognito `name` attribute, if the profile has one. */
  name?: string;
  /**
   * Every IoT Thing this user has claimed, from `dtx_user_devices`. Empty
   * until they have claimed a device — until then the app has no panel to
   * show.
   */
  devices?: string[];
  /** Which of `devices` is currently on screen — switchable via `switchDevice`. */
  activeThingName?: string;
  /** User Pool ID token (JWT) — carries the profile claims. */
  idToken: string;
  /** Access token — used for self-service calls (GlobalSignOut…). */
  accessToken?: string;
  /** Long-lived refresh token used to mint new ID tokens. */
  refreshToken: string;
  /** Epoch ms when the current ID token expires. */
  expiresAt: number;
};

type SessionContextValue = {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  /** False until the signed-in user has claimed a device. */
  hasDevice: boolean;
  /** True while a stale persisted session is being refreshed on launch. */
  restoring: boolean;
  /**
   * False until the device list has been checked at least once for the
   * current account (right after sign-in, or on launch) — lets the app hold
   * on a loader instead of flashing the claim screen for whoever already
   * has a device but whose list hasn't come back from `dtx_user_devices`
   * yet.
   */
  deviceCheckSettled: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ userConfirmed: boolean; destination?: string }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<{ destination?: string }>;
  /** Step 1 of the reset: emails a code to the account's address. */
  forgotPassword: (email: string) => Promise<{ destination?: string }>;
  /** Step 2 of the reset: sets the new password using that code. */
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  /** Returns a non-expired ID token, refreshing it first if needed. */
  getFreshIdToken: () => Promise<string>;
  /**
   * Claim a device from its QR (thing name + code) directly against AWS:
   * validates the code, records ownership in `dtx_user_devices`, and makes
   * it the active device. Throws `ClaimRejectedError` if the thing name or
   * code is wrong; claiming a device already owned is a no-op, not an error.
   */
  claimDevice: (thingName: string, claimCode: string) => Promise<void>;
  /** Switches the active device among the ones this user has already claimed. */
  switchDevice: (thingName: string) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

/** Every Thing name the ID token's account has claimed, from `dtx_user_devices`. */
async function fetchDeviceThingNames(idToken: string): Promise<string[]> {
  const sub = decodeJwtClaims(idToken).sub;
  if (!sub) {
    return [];
  }
  const { credentials } = await getCredentials(COGNITO, idToken);
  const rows = await queryUserDevices({
    region: COGNITO.region,
    table: USER_DEVICES_TABLE,
    owner: sub,
    creds: credentials,
  });
  return rows.map(row => row.thingName).filter(Boolean);
}

/**
 * True only when Cognito itself turned the refresh token down (expired,
 * revoked, or the user is gone) — the one case that really needs a fresh
 * sign-in. Anything else (no network, a timeout, throttling, a 5xx) is
 * transient: the saved session stays and the next call simply tries again.
 */
function isSessionRejected(err: unknown): boolean {
  return (
    err instanceof CognitoError &&
    (err.code === 'NotAuthorizedException' || err.code === 'UserNotFoundException')
  );
}

function persist(session: AuthSession | null) {
  if (session) {
    StorageService.setString(SESSION_KEY, JSON.stringify(session));
  } else {
    StorageService.remove(SESSION_KEY);
  }
}

/** Reads the session saved by the last launch. MMKV is synchronous, so this
 *  runs before the first render and the sign-in screen never flashes. */
function readPersistedSession(): AuthSession | null {
  const raw = StorageService.getString(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const saved = JSON.parse(raw) as AuthSession;
    return saved?.refreshToken ? saved : null;
  } catch {
    StorageService.remove(SESSION_KEY);
    return null;
  }
}

const sessionFromTokens = (
  tokens: { idToken: string; accessToken?: string; refreshToken: string; expiresIn: number },
  fallbackEmail: string,
): AuthSession => {
  const claims = decodeJwtClaims(tokens.idToken);
  return {
    email: claims.email || fallbackEmail,
    name: claims.name,
    idToken: tokens.idToken,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
};

/**
 * Holds the Cognito session for the app and keeps it alive across launches.
 *
 * A session restored from storage is used as-is while its ID token is still
 * good; once it is close to expiry the refresh token mints a new one, so the
 * user only signs in again when that refresh token itself expires (30 days by
 * default) or they log out. A refresh that fails for any other reason — the
 * app opened offline, say — keeps the session and retries on the next call
 * instead of signing the user out.
 */
type Restore = {
  /** Good enough to render with immediately. */
  live: AuthSession | null;
  /** Needs a fresh token before it can be trusted. */
  recheck: AuthSession | null;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Work out once, before the first render, what the last launch left behind.
  const initial = useRef<Restore>(undefined as unknown as Restore);
  if (!initial.current) {
    const saved = readPersistedSession();
    const tokenFresh = !!saved && Date.now() < saved.expiresAt - EXPIRY_SKEW_MS;
    // The device list itself is re-verified separately (see the
    // `refreshDevices` effect below) regardless of token freshness — a
    // device claimed elsewhere shows up without waiting on this.
    initial.current = {
      live: tokenFresh ? saved : null,
      recheck: tokenFresh ? null : saved,
    };
  }

  const [session, setSession] = useState<AuthSession | null>(initial.current.live);
  // Only block on the splash when there is nothing usable to show meanwhile.
  const [restoring, setRestoring] = useState(
    initial.current.recheck !== null && initial.current.live === null,
  );

  // Lets async callbacks read the latest session without stale closures.
  const sessionRef = useRef<AuthSession | null>(session);

  const applySession = useCallback((next: AuthSession | null) => {
    sessionRef.current = next;
    setSession(next);
    persist(next);
  }, []);

  // One refresh at a time: the IoT connection, device list and Events all
  // ask for a token together once it expires, and with refresh-token
  // rotation on, parallel refreshes would race to replace the same token.
  const refreshInFlight = useRef<Promise<AuthSession> | null>(null);

  /**
   * Mints a new ID token from `base`'s refresh token and saves the result —
   * keeping the rotated refresh token when Cognito sends one. Signs out only
   * if Cognito rejects the refresh token; any other failure is re-thrown
   * with the saved session left untouched.
   */
  const refreshNow = useCallback(
    (base: AuthSession): Promise<AuthSession> => {
      if (!refreshInFlight.current) {
        refreshInFlight.current = (async () => {
          try {
            const tokens = await refreshSession(COGNITO, base.refreshToken);
            const claims = decodeJwtClaims(tokens.idToken);
            // Anything else may have changed the session meanwhile (a device
            // switch, say) — build on the latest copy, not the one we started from.
            const latest = sessionRef.current ?? base;
            const next: AuthSession = {
              ...latest,
              idToken: tokens.idToken,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken ?? latest.refreshToken,
              email: claims.email || latest.email,
              name: claims.name ?? latest.name,
              expiresAt: Date.now() + tokens.expiresIn * 1000,
            };
            applySession(next);
            return next;
          } catch (err: any) {
            if (isSessionRejected(err)) {
              console.warn('[auth] refresh token rejected — signing out:', err?.message);
              applySession(null);
            } else {
              console.warn('[auth] refresh failed, keeping session:', err?.message);
            }
            throw err;
          } finally {
            refreshInFlight.current = null;
          }
        })();
      }
      return refreshInFlight.current;
    },
    [applySession],
  );

  // Bring the persisted session up to date on launch.
  useEffect(() => {
    const { recheck } = initial.current;
    if (!recheck) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Keeps devices/activeThingName from the saved session; the device
        // list itself is re-verified separately, below.
        await refreshNow(recheck);
      } catch (err) {
        // `refreshNow` already signed out if the refresh token was rejected.
        // Otherwise (e.g. opened offline) carry on with the saved session —
        // the next token request retries the refresh.
        if (!cancelled && !isSessionRejected(err)) {
          applySession(recheck);
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, refreshNow]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const username = identifier.trim();
      const tokens = await signInUserPool(COGNITO, username, password);
      applySession(sessionFromTokens(tokens, username));
    },
    [applySession],
  );

  const signOut = useCallback(() => {
    const current = sessionRef.current;
    // Drop the local session first so the UI returns to sign-in immediately.
    applySession(null);
    if (current?.accessToken) {
      // Best-effort: revokes the refresh token server-side so a stolen copy of
      // the one we just deleted is useless. Failure changes nothing locally.
      globalSignOut(COGNITO, current.accessToken).catch(() => {});
    }
  }, [applySession]);

  // Return a valid ID token, transparently refreshing when it's expired/near-expiry.
  const getFreshIdToken = useCallback(async (): Promise<string> => {
    const current = sessionRef.current;
    if (!current) {
      throw new Error('Not signed in.');
    }
    if (Date.now() < current.expiresAt - EXPIRY_SKEW_MS) {
      return current.idToken;
    }
    const refreshed = await refreshNow(current);
    return refreshed.idToken;
  }, [refreshNow]);

  // Independently keeps the device list current: right after sign-in, after
  // the launch-time token recheck above, and after claiming a device (see
  // `claimDevice`). Runs once per signed-in account (guarded by sub) rather
  // than on every token refresh, since a plain refresh never changes
  // ownership.
  const devicesFetchedForSub = useRef<string | null>(null);
  // False from the moment an account signs in / restores until its device
  // list has been fetched at least once — see `deviceCheckSettled` above.
  const [deviceCheckSettled, setDeviceCheckSettled] = useState(false);
  const refreshDevices = useCallback(async (): Promise<void> => {
    const idToken = await getFreshIdToken();
    const devices = await fetchDeviceThingNames(idToken);
    const current = sessionRef.current;
    if (!current) {
      return;
    }
    const activeThingName =
      current.activeThingName && devices.includes(current.activeThingName)
        ? current.activeThingName
        : devices[0];
    applySession({ ...current, devices, activeThingName });
  }, [getFreshIdToken, applySession]);

  useEffect(() => {
    if (!session) {
      devicesFetchedForSub.current = null;
      setDeviceCheckSettled(false);
      return;
    }
    let sub: string | undefined;
    try {
      sub = decodeJwtClaims(session.idToken).sub;
    } catch {
      return;
    }
    if (!sub || devicesFetchedForSub.current === sub) {
      return;
    }
    devicesFetchedForSub.current = sub;
    refreshDevices()
      .catch((err: any) => {
        console.warn('[auth] device list refresh failed:', err?.message);
      })
      .finally(() => setDeviceCheckSettled(true));
  }, [session, refreshDevices]);

  const claimDevice = useCallback(
    async (thingName: string, claimCode: string): Promise<void> => {
      const idToken = await getFreshIdToken();
      const owner = decodeJwtClaims(idToken).sub;
      if (!owner) {
        throw new Error('Could not read your account id from the session.');
      }

      const { credentials } = await getCredentials(COGNITO, idToken);
      // Validates the code and records ownership — a no-op if this user
      // already owns this device, never an error for other owners.
      await claimDeviceInDynamo({
        region: COGNITO.region,
        devicesTable: DEVICES_TABLE,
        userDevicesTable: USER_DEVICES_TABLE,
        thingName,
        claimCode,
        owner,
        creds: credentials,
      });

      // Refresh the device list so the newly claimed thing shows up, and
      // switch straight to it.
      const devices = await fetchDeviceThingNames(idToken);
      const current = sessionRef.current;
      if (!current) {
        throw new Error('Not signed in.');
      }
      applySession({ ...current, devices, activeThingName: thingName });
    },
    [getFreshIdToken, applySession],
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) =>
      cognitoSignUp(COGNITO, email.trim(), password, name.trim()),
    [],
  );

  const confirmSignUp = useCallback(
    (email: string, code: string) =>
      cognitoConfirmSignUp(COGNITO, email.trim(), code.trim()),
    [],
  );

  const resendCode = useCallback(
    (email: string) => resendConfirmationCode(COGNITO, email.trim()),
    [],
  );

  const forgotPassword = useCallback(
    (email: string) => cognitoForgotPassword(COGNITO, email.trim()),
    [],
  );

  const confirmForgotPassword = useCallback(
    (email: string, code: string, newPassword: string) =>
      cognitoConfirmForgotPassword(COGNITO, email.trim(), code.trim(), newPassword),
    [],
  );

  const switchDevice = useCallback(
    (thingName: string) => {
      const current = sessionRef.current;
      if (!current || !current.devices?.includes(thingName)) {
        return;
      }
      applySession({ ...current, activeThingName: thingName });
    },
    [applySession],
  );

  const user = useMemo<User | null>(
    () =>
      session
        ? { name: session.name || session.email.split('@')[0], email: session.email }
        : null,
    [session],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      session,
      isAuthenticated: session !== null,
      hasDevice: Boolean(session?.activeThingName),
      restoring,
      deviceCheckSettled,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      forgotPassword,
      confirmForgotPassword,
      getFreshIdToken,
      claimDevice,
      switchDevice,
      signOut,
    }),
    [
      user,
      session,
      restoring,
      deviceCheckSettled,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      forgotPassword,
      confirmForgotPassword,
      getFreshIdToken,
      claimDevice,
      switchDevice,
      signOut,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside a <SessionProvider>');
  }
  return ctx;
}
