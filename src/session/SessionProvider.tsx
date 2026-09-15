import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { COGNITO } from '../config/awsConfig';
import { StorageService } from '../storage';
import {
  confirmForgotPassword as cognitoConfirmForgotPassword,
  confirmSignUp as cognitoConfirmSignUp,
  decodeJwtClaims,
  forgotPassword as cognitoForgotPassword,
  globalSignOut,
  refreshSession,
  resendConfirmationCode,
  signInUserPool,
  signUp as cognitoSignUp,
} from './cognito';

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
  /** True while a stale persisted session is being refreshed on launch. */
  restoring: boolean;
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
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

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
 * default) or they log out.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Split what was persisted into "usable now" and "needs a refresh first",
  // once, before the first render.
  const initial = useRef<{ live: AuthSession | null; stale: AuthSession | null }>(
    undefined as unknown as { live: AuthSession | null; stale: AuthSession | null },
  );
  if (!initial.current) {
    const saved = readPersistedSession();
    const usable = !!saved && Date.now() < saved.expiresAt - EXPIRY_SKEW_MS;
    initial.current = {
      live: usable ? saved : null,
      stale: saved && !usable ? saved : null,
    };
  }

  const [session, setSession] = useState<AuthSession | null>(initial.current.live);
  const [restoring, setRestoring] = useState(initial.current.stale !== null);

  // Lets async callbacks read the latest session without stale closures.
  const sessionRef = useRef<AuthSession | null>(session);

  const applySession = useCallback((next: AuthSession | null) => {
    sessionRef.current = next;
    setSession(next);
    persist(next);
  }, []);

  // A persisted session whose ID token had already expired: refresh it before
  // showing the app, and fall back to signed-out if the refresh token is gone.
  useEffect(() => {
    const stale = initial.current.stale;
    if (!stale) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const tokens = await refreshSession(COGNITO, stale.refreshToken);
        if (!cancelled) {
          const refreshed = sessionFromTokens(
            { ...tokens, refreshToken: stale.refreshToken },
            stale.email,
          );
          // Keep the name we already had if this token happens to omit it.
          applySession({ ...refreshed, name: refreshed.name ?? stale.name });
        }
      } catch {
        // Refresh token expired or revoked → start signed out.
        if (!cancelled) {
          applySession(null);
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
  }, [applySession]);

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
    try {
      const tokens = await refreshSession(COGNITO, current.refreshToken);
      const claims = decodeJwtClaims(tokens.idToken);
      applySession({
        ...current,
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        email: claims.email || current.email,
        name: claims.name ?? current.name,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
      });
      return tokens.idToken;
    } catch (err) {
      // Refresh token expired/revoked → force a fresh sign-in.
      applySession(null);
      throw err;
    }
  }, [applySession]);

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
      restoring,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      forgotPassword,
      confirmForgotPassword,
      getFreshIdToken,
      signOut,
    }),
    [
      user,
      session,
      restoring,
      signIn,
      signUp,
      confirmSignUp,
      resendCode,
      forgotPassword,
      confirmForgotPassword,
      getFreshIdToken,
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
