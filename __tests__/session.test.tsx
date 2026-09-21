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
  getCredentials: jest.fn(() =>
    Promise.resolve({
      identityId: 'identity-1',
      credentials: {
        accessKeyId: 'AKIA',
        secretKey: 'secret',
        sessionToken: 'token',
      },
    }),
  ),
}));

jest.mock('../src/utils/dynamoDb', () => ({
  ...jest.requireActual('../src/utils/dynamoDb'),
  queryUserDevices: jest.fn(() => Promise.resolve([])),
}));

// The claim itself (validating against `dtx_devices`, writing to
// `dtx_user_devices`) is exercised directly against real DynamoDB request
// shapes elsewhere — here it's stubbed so `claimDevice` tests only cover
// what SessionProvider does with the result.
jest.mock('../src/session/deviceClaim', () => ({
  ...jest.requireActual('../src/session/deviceClaim'),
  claimDeviceInDynamo: jest.fn(() => Promise.resolve()),
}));

const cognito = require('../src/session/cognito');
const dynamoDb = require('../src/utils/dynamoDb');

const SESSION_KEY = 'auth_session';
const HOUR = 60 * 60 * 1000;
const SUB = 'user-1';
const THING = 'DTX867409070337741';

/** A JWT the provider can decode — signature is never checked. */
function fakeIdToken(claims: Record<string, unknown>) {
  const payload = CryptoJS.enc.Utf8.parse(JSON.stringify(claims))
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]+$/, '');
  return `header.${payload}.signature`;
}

const claims = { sub: SUB, email: 'ann@example.com', name: 'Ann Lee' };

// `null` means "this account has not claimed a device yet" as far as the
// persisted session goes. It cannot be `undefined` — that would fall through
// to the default parameter.
function persisted(expiresAt: number, thing: string | null = THING) {
  const activeThingName = thing ?? undefined;
  return {
    email: 'ann@example.com',
    name: 'Ann Lee',
    devices: activeThingName ? [activeThingName] : [],
    activeThingName,
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
  // async so the launch-time refresh (and the background device fetch it
  // triggers) settles inside act()
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
  dynamoDb.queryUserDevices.mockResolvedValue([]);
});

test('starts signed out with nothing persisted', async () => {
  const { seen, unmount } = await mount();

  expect(seen.current!.isAuthenticated).toBe(false);
  expect(seen.current!.restoring).toBe(false);
  expect(cognito.refreshSession).not.toHaveBeenCalled();

  await unmount();
});

test('restores a still-valid session without a token refresh', async () => {
  StorageService.setString(SESSION_KEY, JSON.stringify(persisted(Date.now() + HOUR)));
  dynamoDb.queryUserDevices.mockResolvedValue([{ thingName: THING }]);

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
    idToken: fakeIdToken(claims),
    accessToken: 'new-access-token',
    expiresIn: 3600,
  });
  dynamoDb.queryUserDevices.mockResolvedValue([{ thingName: THING }]);

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
  // The device the session already had survives the token refresh too.
  expect(seen.current!.session!.activeThingName).toBe(THING);

  await unmount();
});

test('picks up a device claimed elsewhere, on a still-valid token', async () => {
  // Valid token, but no device yet as far as the persisted session knows —
  // it was claimed from another phone since.
  StorageService.setString(
    SESSION_KEY,
    JSON.stringify(persisted(Date.now() + HOUR, null)),
  );
  dynamoDb.queryUserDevices.mockResolvedValue([{ thingName: THING }]);

  const { seen, unmount } = await mount();

  // A device-list refresh is a plain DynamoDB Query — it never needs to mint
  // a new ID token to pick up a device claimed elsewhere.
  expect(cognito.refreshSession).not.toHaveBeenCalled();
  expect(dynamoDb.queryUserDevices).toHaveBeenCalledWith(
    expect.objectContaining({ owner: SUB }),
  );
  expect(seen.current!.hasDevice).toBe(true);
  expect(seen.current!.session!.activeThingName).toBe(THING);
  expect(seen.current!.deviceCheckSettled).toBe(true);

  await unmount();
});

test('keeps a valid device-less session when the device-list fetch fails', async () => {
  StorageService.setString(
    SESSION_KEY,
    JSON.stringify(persisted(Date.now() + HOUR, null)),
  );
  dynamoDb.queryUserDevices.mockRejectedValue(new Error('Network request failed'));

  const { seen, unmount } = await mount();

  // Offline is not a reason to sign someone out of a still-valid session.
  expect(seen.current!.isAuthenticated).toBe(true);
  expect(seen.current!.hasDevice).toBe(false);
  // A failed check still counts as "checked" — otherwise the UI would spin
  // on a loader forever instead of falling through to the claim screen.
  expect(seen.current!.deviceCheckSettled).toBe(true);

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
    idToken: fakeIdToken(claims),
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  });
  dynamoDb.queryUserDevices.mockResolvedValue([{ thingName: THING }]);

  const { seen, unmount } = await mount();

  await ReactTestRenderer.act(async () => {
    await seen.current!.signIn('ann@example.com', 'hunter2hunter2');
  });
  expect(seen.current!.isAuthenticated).toBe(true);
  // The claimed device comes from a `dtx_user_devices` query straight after
  // sign-in, or the app strands the user on the claim screen.
  expect(seen.current!.session!.activeThingName).toBe(THING);
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

test('does not settle until the device list resolves, so the UI can hold a loader instead of flashing the claim screen', async () => {
  cognito.signInUserPool.mockResolvedValue({
    idToken: fakeIdToken(claims),
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  });

  // Controlled by hand, rather than resolving immediately, so the assertions
  // below can observe the state a real slow network call would leave the
  // app in — the exact window the reported bug flashed the claim screen in.
  let resolveDevices!: (rows: { thingName: string }[]) => void;
  dynamoDb.queryUserDevices.mockReturnValue(
    new Promise(resolve => {
      resolveDevices = resolve;
    }),
  );

  const { seen, unmount } = await mount();

  let signInSettled = false;
  ReactTestRenderer.act(() => {
    seen.current!.signIn('ann@example.com', 'hunter2hunter2').then(() => {
      signInSettled = true;
    });
  });
  // Let signIn's own microtasks (not the still-pending device query) drain.
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });

  expect(signInSettled).toBe(true);
  expect(seen.current!.isAuthenticated).toBe(true);
  // The device list hasn't come back yet: neither "has a device" nor
  // "confirmed no device" is known — the UI must hold a loader here, not
  // show the claim screen (which is what `hasDevice: false` alone used to
  // trigger before `deviceCheckSettled` existed).
  expect(seen.current!.hasDevice).toBe(false);
  expect(seen.current!.deviceCheckSettled).toBe(false);

  await ReactTestRenderer.act(async () => {
    resolveDevices([{ thingName: THING }]);
    await Promise.resolve();
  });

  expect(seen.current!.hasDevice).toBe(true);
  expect(seen.current!.deviceCheckSettled).toBe(true);
  expect(seen.current!.session!.activeThingName).toBe(THING);

  await unmount();
});

test('claiming a second device adds it without dropping the first, and switchDevice moves between them', async () => {
  StorageService.setString(SESSION_KEY, JSON.stringify(persisted(Date.now() + HOUR)));
  dynamoDb.queryUserDevices.mockResolvedValue([{ thingName: THING }]);

  const { seen, unmount } = await mount();
  expect(seen.current!.session!.devices).toEqual([THING]);

  const SECOND = 'DTX999999999999999';
  dynamoDb.queryUserDevices.mockResolvedValue([
    { thingName: THING },
    { thingName: SECOND },
  ]);

  await ReactTestRenderer.act(async () => {
    await seen.current!.claimDevice(SECOND, 'CODE-1234');
  });
  expect(seen.current!.session!.devices).toEqual([THING, SECOND]);
  // Claiming makes the newly claimed device the active one.
  expect(seen.current!.session!.activeThingName).toBe(SECOND);

  ReactTestRenderer.act(() => {
    seen.current!.switchDevice(THING);
  });
  expect(seen.current!.session!.activeThingName).toBe(THING);

  await unmount();
});
