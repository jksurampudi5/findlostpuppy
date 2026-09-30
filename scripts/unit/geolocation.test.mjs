import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule } from './test-support.mjs';

function setup(address, boundary = null) {
  const log = mock.fn();
  const fetch = mock.fn(async () => new Response(null, { status: 503 }));
  const api = loadModule('src/utils/geolocationHelper.ts', {
    dependencies: {
      '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' } },
      '@capacitor/geolocation': { Geolocation: { checkPermissions: async () => ({ location: 'granted' }), getCurrentPosition: async () => ({ coords: { latitude: 1.25, longitude: 2.5, accuracy: 10 }, timestamp: 100 }) } },
      '@capgo/capacitor-nativegeocoder': { NativeGeocoder: { reverseGeocode: async () => ({ addresses: [address] }) } },
      './boundaryLookup': { findMandalByCoordinates: async () => boundary },
    }, globals: { fetch, console: { log, warn() {}, error() {} } }, env: { DEV: false },
  });
  return { ...api, fetch, log };
}
const address = { administrativeArea: 'Test state', subAdministrativeArea: 'Test district', subLocality: 'Test mandal', locality: 'Test village' };

for (const [fields, expected] of [
  [{ thoroughfare: ' QMCX+3RF ', subThoroughfare: ' Test street ' }, 'Test street'],
  [{ thoroughfare: 'vx5j+q3', subThoroughfare: '8FW4+RX Test village', areasOfInterest: ['Test park'] }, 'Test park'],
  [{ thoroughfare: 'Test road', subThoroughfare: 'Other street', areasOfInterest: ['Other park'] }, 'Test road'],
  [{ thoroughfare: 'QMCX+3RF', subThoroughfare: 'VX5J+Q3', areasOfInterest: ['8FW4+RX Test village'] }, 'Test village Main Road'],
]) {
  test(`native geocoding filters Plus Codes while preserving readable streets: ${JSON.stringify(fields)}`, async () => {
    const h = setup({ ...address, ...fields });
    const result = await h.detectResilientLocation();
    assert.equal(result.street, expected);
    assert.equal(result.city, 'Test village');
    assert.equal(result.mandal, 'Test mandal');
  });
}

test('missing village stays unresolved instead of copying the mandal into the village field', async () => {
  const h = setup({ ...address, locality: undefined });
  const result = await h.detectResilientLocation();
  assert.equal(result.city, undefined);
  assert.equal(result.mandal, 'Test mandal');
  assert.equal(result.street, 'Test mandal Main Road');
  assert.ok(h.fetch.mock.callCount() > 0, 'incomplete native results try web geocoding');
});

test('boundary authority is preserved while the village and street come from the native geocoder', async () => {
  const h = setup({ ...address, thoroughfare: 'Test street' }, { stateName: 'Boundary state', districtName: 'Boundary district', subDistrictName: 'Boundary mandal', stateCode: 1, districtCode: 2, subDistrictCode: 3 });
  const result = await h.detectResilientLocation();
  assert.equal(result.state, 'Boundary state');
  assert.equal(result.district, 'Boundary district');
  assert.equal(result.mandal, 'Boundary mandal');
  assert.equal(result.city, 'Test village');
  assert.equal(result.street, 'Test street');
  assert.equal(h.fetch.mock.callCount(), 0);
});

test('detailed location diagnostics are silent in production', () => {
  const h = setup(address);
  h.printLocationDiagnostic({ coordinates: { latitude: 1.25, longitude: 2.5 } });
  assert.equal(h.log.mock.callCount(), 0);
});
