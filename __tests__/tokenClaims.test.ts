/**
 * Guards the claim decode end to end — the path that silently returned `{}` and
 * stranded signed-in users on the claim screen with no `custom:thingName`.
 *
 * @format
 */

import { Buffer } from 'buffer';

import { decodeJwtClaims } from '../src/session/cognito';

const b64url = (s: string) =>
  Buffer.from(s, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]+$/, '');
const jwt = (claims: object) => `hdr.${b64url(JSON.stringify(claims))}.sig`;

test('decodes a realistic Cognito ID token', () => {
  const claims = {
    sub: '5f9c1a2e-7b3d-4c8a-9e1f-2a6b8d0c4e77',
    'cognito:groups': ['installers'],
    email_verified: true,
    iss: 'https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_Ouw2NoGHo',
    'custom:thingName': 'DTX867409070337741',
    'cognito:username': 'ann@example.com',
    origin_jti: 'b1d2c3e4-aaaa-bbbb-cccc-ddddeeeeffff',
    aud: '1cj7c2v86ntt0h07dg846j6tsd',
    event_id: '9f8e7d6c-5b4a-3210-fedc-ba9876543210',
    token_use: 'id',
    auth_time: 1773648000,
    name: 'Ann Lee',
    exp: 1773651600,
    iat: 1773648000,
    jti: '11112222-3333-4444-5555-666677778888',
    email: 'ann@example.com',
  };
  expect(decodeJwtClaims(jwt(claims))).toEqual(claims);
  expect(decodeJwtClaims(jwt(claims))['custom:thingName']).toBe('DTX867409070337741');
});

test('matches Buffer decoding across every padding length and unicode', () => {
  const names = ['Ann', 'Saddäm Hüsain', '日本語の名前', 'Ann ☂ Lee', 'नाम', '𝕬stral 😀'];
  for (const name of names) {
    for (let pad = 0; pad < 40; pad++) {
      const claims = { name, 'custom:thingName': 'DTX' + '9'.repeat(pad), email: 'a@b.co' };
      expect(decodeJwtClaims(jwt(claims))).toEqual(claims);
    }
  }
});

test('bad input returns empty claims instead of throwing', () => {
  expect(decodeJwtClaims('')).toEqual({});
  expect(decodeJwtClaims('only-one-segment')).toEqual({});
  expect(decodeJwtClaims('hdr.@@@not-base64@@@.sig')).toEqual({});
});
