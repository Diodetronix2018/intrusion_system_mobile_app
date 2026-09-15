/**
 * Session persistence: a signed-in user should not have to log in again the
 * next time the app is launched.
 *
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CryptoJS from 'crypto-js';

import { StorageService } from '../src/storage';
import { SessionProvider, useSession } from '../src/session/SessionProvider';

jest.mock('../src/session/cognito', () => ({
  ...jest.requireActual('../src/session/cognito'),
  refreshSession: jest.fn(),
  signInUserPool: jest.fn(),
  globalSignOut: jest.fn(() => Promise.resolve()),
}));

const cognito = require('../src/session/cognito');

const SESSION_KEY = 'auth_session';
const HOUR = 60 * 60 * 1000;

/** A JWT the provider can decode — signature is never checked. */
function fakeIdToken(claims: Record<string, unknown>) {
  const payload = CryptoJS.enc.Utf8.parse(JSON.stringify(claims))
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]+$/, '');
  return `header.${payload}.signature`;
}

const THING = 'DTX867409070337741';

// `null` means "this account has not claimed a device yet". It cannot be
// `undefined` — that would fall through to the default parameter.
function persisted(expiresAt: number, thing: string | null = THING) {
  const thingName = thing ?? undefined;
  const claims = {
    email: 'ann@example.com',
    name: 'Ann Lee',
    ...(thingName ? { 'custom:thingName': thingName } : null),
  };
  return {
    email: 'ann@example.com',
    name: 'Ann Lee',
    thingName,
    idToken: fakeIdToken(claims),
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt,
  };
}

type Session = ReturnType<typeof useSession>;

/** Mounts the provider and hands back its context value. */
async function mount() {
  const seen: { current: Session | null } = { current: null };
  function Probe() {
    seen.current = useSession();
    return null;
  }
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  // async so the launch-time refresh settles inside act()
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
  });
  return {
    seen,
    unmount: async () => {
      await ReactTestRenderer.act(() => tree!.unmount());
    },
  };
}

beforeEach(() => {
  StorageService.clear();
  jest.clearAllMocks();
});

test('starts signed out with nothing persisted', async () => {
  const { seen, unmount } = await mount();

  expect(seen.current!.isAuthenticated).toBe(false);
  expect(seen.current!.restoring).toBe(false);
  expect(cognito.refreshSession).not.toHaveBeenCalled();

  await unmount();
});

test('restores a still-valid session without a network round trip', async () => {
  StorageService.setString(SESSION_KEY, JSON.stringify(persisted(Date.now() + HOUR)));

  const { seen, unmount } = await mount();

  // Signed in on the very first render — no splash, no sign-in flash.
  expect(seen.current!.isAuthenticated).toBe(true);
  expect(seen.current!.restoring).toBe(false);
  expect(seen.current!.user).toEqual({ name: 'Ann Lee', email: 'ann@example.com' });
  expect(cognito.refreshSession).not.toHaveBeenCalled();

  await unmount();
});

test('refreshes an expired ID token on launch and stays signed in', async () => {
  StorageService.setString(SESSION_KEY, JSON.stringify(persisted(Date.now() - HOUR)));
  cognito.refreshSession.mockResolvedValue({
    idToken: fakeIdToken({
      email: 'ann@example.com',
      name: 'Ann Lee',
      'custom:thingName': THING,
    }),
    accessToken: 'new-access-token',
    expiresIn: 3600,
  });

  const { seen, unmount } = await mount();

  expect(cognito.refreshSession).toHaveBeenCalledWith(
    expect.anything(),
    'refresh-token',
  );
  expect(seen.current!.restoring).toBe(false);
  expect(seen.current!.isAuthenticated).toBe(true);
  // The refresh token is not rotated, so it must survive the refresh.
  expect(seen.current!.session!.refreshToken).toBe('refresh-token');
  expect(seen.current!.session!.accessToken).toBe('new-access-token');

  await unmount();
});

test('re-checks a device-less session and picks up a device claimed elsewhere', async () => {
  // Valid token, but it predates the claim — the attribute only appears in a
  // freshly minted one.
  StorageService.setString(
    SESSION_KEY,
    JSON.stringify(persisted(Date.now() + HOUR, null)),
  );
  cognito.refreshSession.mockResolvedValue({
    idToken: fakeIdToken({
      email: 'ann@example.com',
      name: 'Ann Lee',
      'custom:thingName': THING,
    }),
    accessToken: 'new-access-token',
    expiresIn: 3600,
  });

  const { seen, unmount } = await mount();

  expect(cognito.refreshSession).toHaveBeenCalled();
  expect(seen.current!.hasDevice).toBe(true);
  expect(seen.current!.session!.thingName).toBe(THING);

  await unmount();
});

test('keeps a valid device-less session when the launch re-check fails', async () => {
  StorageService.setString(
    SESSION_KEY,
    JSON.stringify(persisted(Date.now() + HOUR, null)),
  );
  cognito.refreshSession.mockRejectedValue(new Error('Network request failed'));

  const { seen, unmount } = await mount();

  // Offline is not a reason to sign someone out of a still-valid session.
  expect(seen.current!.isAuthenticated).toBe(true);
  expect(seen.current!.hasDevice).toBe(false);

  await unmount();
});

test('drops the persisted session when the refresh token is rejected', async () => {
  StorageService.setString(SESSION_KEY, JSON.stringify(persisted(Date.now() - HOUR)));
  cognito.refreshSession.mockRejectedValue(new Error('Refresh Token has expired'));

  const { seen, unmount } = await mount();

  expect(seen.current!.isAuthenticated).toBe(false);
  expect(seen.current!.restoring).toBe(false);
  expect(StorageService.getString(SESSION_KEY)).toBeNull();

  await unmount();
});

test('ignores a corrupt persisted session', async () => {
  StorageService.setString(SESSION_KEY, 'not json');

  const { seen, unmount } = await mount();

  expect(seen.current!.isAuthenticated).toBe(false);
  expect(seen.current!.restoring).toBe(false);

  await unmount();
});

test('signing in persists the session, and logging out clears it', async () => {
  cognito.signInUserPool.mockResolvedValue({
    idToken: fakeIdToken({
      email: 'ann@example.com',
      name: 'Ann Lee',
      'custom:thingName': THING,
    }),
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  });

  const { seen, unmount } = await mount();

  await ReactTestRenderer.act(async () => {
    await seen.current!.signIn('ann@example.com', 'hunter2hunter2');
  });
  expect(seen.current!.isAuthenticated).toBe(true);
  // The claimed device must come straight off the ID token, or the app strands
  // the user on the claim screen.
  expect(seen.current!.session!.thingName).toBe(THING);
  expect(seen.current!.hasDevice).toBe(true);
  expect(StorageService.getString(SESSION_KEY)).toBeTruthy();

  await ReactTestRenderer.act(async () => {
    seen.current!.signOut();
  });
  expect(seen.current!.isAuthenticated).toBe(false);
  expect(StorageService.getString(SESSION_KEY)).toBeNull();
  // Best-effort revoke so the deleted refresh token is useless if copied.
  expect(cognito.globalSignOut).toHaveBeenCalledWith(
    expect.anything(),
    'access-token',
  );

  await unmount();
});
