import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type User = {
  name: string;
  email: string;
};

type SessionContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

/**
 * Holds the signed-in user for the session.
 *
 * There is no auth backend yet, so `signIn` just records whatever the auth
 * screens collected. Swap the body for a real token exchange when the API
 * lands — the rest of the app only reads `user`.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = useCallback((next: User) => setUser(next), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, isAuthenticated: user !== null, signIn, signOut }),
    [user, signIn, signOut],
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
