import {
  buildNtyValue,
  parseNtyValue,
} from '../src/screens/main/settings/detail/useSpecialNotify';

test('nty round-trips with AC restore before the user group', () => {
  const settings = {
    acFail: false,
    batteryFail: false,
    lowBattery: true,
    acRestore: true,
    userGroup: 'upTo5' as const,
  };
  expect(buildNtyValue(settings)).toBe('0,0,1,1,2');
  expect(parseNtyValue('0,0,1,1,2')).toEqual(settings);
});

test('older nty forms fill missing fields with defaults', () => {
  expect(parseNtyValue('1,0,1,3')).toMatchObject({
    lowBattery: true,
    acRestore: false,
    userGroup: 'all',
  });
  expect(parseNtyValue('1,1,0')).toMatchObject({
    lowBattery: true,
    acRestore: false,
    userGroup: 'admin',
  });
  expect(parseNtyValue('1,1')).toBeUndefined();
});
