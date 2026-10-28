import {
  ClaimRejectedError,
  DeviceLimitError,
  DevicePasswordError,
  claimDeviceInDynamo,
} from '../src/session/deviceClaim';
import * as dynamoDb from '../src/utils/dynamoDb';

jest.mock('../src/utils/dynamoDb', () => ({
  ...jest.requireActual('../src/utils/dynamoDb'),
  getDynamoItem: jest.fn(),
  queryTelemetry: jest.fn(),
  queryDeviceOwners: jest.fn(),
  putDynamoItem: jest.fn(() => Promise.resolve()),
}));

const mocked = dynamoDb as jest.Mocked<typeof dynamoDb>;

const claim = (password: string) =>
  claimDeviceInDynamo({
    region: 'ap-south-1',
    devicesTable: 'dtx_devices',
    userDevicesTable: 'dtx_user_devices',
    userDevicesThingIndex: 'thingName-index',
    maxUsers: 5,
    telemetryTable: 'dtx_tngrama_telemetry',
    thingName: 'DTX1',
    claimCode: 'CODE',
    password,
    owner: 'sub-1',
    creds: {} as any,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getDynamoItem.mockResolvedValue({ claimCode: 'CODE' });
  mocked.queryDeviceOwners.mockResolvedValue(['a', 'b']);
  // newest first; the newest row has no pwd, so the next one's is used
  mocked.queryTelemetry.mockResolvedValue([{ zon: '1' }, { pwd: 1234 }, { pwd: '9999' }]);
});

test('maps the device when the password matches the latest pwd', async () => {
  await claim('1234');
  expect(mocked.putDynamoItem).toHaveBeenCalledTimes(1);
});

test('rejects a wrong password without mapping', async () => {
  await expect(claim('9999')).rejects.toBeInstanceOf(DevicePasswordError);
  expect(mocked.putDynamoItem).not.toHaveBeenCalled();
});

test('rejects when no row carries a pwd', async () => {
  mocked.queryTelemetry.mockResolvedValue([{ zon: '1' }]);
  await expect(claim('1234')).rejects.toMatchObject({ unavailable: true });
  expect(mocked.putDynamoItem).not.toHaveBeenCalled();
});

test('a wrong claim code is still rejected before the password check', async () => {
  mocked.getDynamoItem.mockResolvedValue({ claimCode: 'OTHER' });
  await expect(claim('1234')).rejects.toBeInstanceOf(ClaimRejectedError);
  expect(mocked.queryTelemetry).not.toHaveBeenCalled();
});

test('panel password must be exactly 4 digits', () => {
  const { validatePanelPassword } = require('../src/utils/validation');
  expect(validatePanelPassword('', 'P')).toMatchObject({ key: 'validation.required' });
  expect(validatePanelPassword('12a4', 'P')).toMatchObject({ key: 'validation.digitsOnly' });
  expect(validatePanelPassword('123', 'P')).toMatchObject({ key: 'validation.exactDigits' });
  expect(validatePanelPassword('12345', 'P')).toMatchObject({ key: 'validation.exactDigits' });
  expect(validatePanelPassword('1234', 'P')).toBeUndefined();
});

test('a device with 5 other users is full — checked before the password', async () => {
  mocked.queryDeviceOwners.mockResolvedValue(['a', 'b', 'c', 'd', 'e']);
  await expect(claim('1234')).rejects.toBeInstanceOf(DeviceLimitError);
  expect(mocked.queryTelemetry).not.toHaveBeenCalled();
  expect(mocked.putDynamoItem).not.toHaveBeenCalled();
});

test('re-claiming as one of the 5 owners is not blocked by the limit', async () => {
  mocked.queryDeviceOwners.mockResolvedValue(['a', 'b', 'c', 'd', 'sub-1']);
  await claim('1234');
  expect(mocked.putDynamoItem).toHaveBeenCalledTimes(1);
});
