import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { loadModule } from './test_harness.mjs';

function fixture(address = {}, boundary = { stateName: 'Boundary State', districtName: 'Boundary District', subDistrictName: 'Boundary Mandal' }) {
  const console = { log: mock.fn(), warn: mock.fn(), error: mock.fn() };
  const fetch = mock.fn(async () => Response.json({}));
  const geolocation = {
    checkPermissions: async () => ({ location: 'granted' }),
    getCurrentPosition: async () => ({ coords: { latitude: 1.25, longitude: 2.5, accuracy: 10 }, timestamp: 1000 }),
  };
  const module = loadModule('src/utils/geolocationHelper.ts', {
    mocks: {
      '@capacitor/core': { Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' } },
      '@capacitor/geolocation': { Geolocation: geolocation },
      '@capgo/capacitor-nativegeocoder': { NativeGeocoder: { reverseGeocode: async () => ({ addresses: [address] }) } },
      './boundaryLookup': { findMandalByCoordinates: async () => boundary },
    }, globals: { fetch, console },
  });
  return { ...module, fetch, console };
}

test('missing village stays unresolved instead of reusing the boundary mandal', async () => {
  const result = await fixture({ administrativeArea: 'Native State', subAdministrativeArea: 'Native District', subLocality: 'Native Mandal' }).detectResilientLocation();
  assert.equal(result.mandal, 'Boundary Mandal');
  assert.equal(result.city, undefined);
  assert.equal(result.diagnostic.finalResult.village, undefined);
  assert.equal(result.street, 'Boundary Mandal Main Road');
  assert.equal(result.state, 'Boundary State');
  assert.equal(result.district, 'Boundary District');
});

test('a detected village remains distinct and supplies the fallback street', async () => {
  const result = await fixture({ locality: 'Synthetic Village' }).detectResilientLocation();
  assert.equal(result.city, 'Synthetic Village');
  assert.equal(result.street, 'Synthetic Village Main Road');
  assert.equal(result.mandal, 'Boundary Mandal');
});

test('no village or mandal leaves the street unresolved', async () => {
  const result = await fixture({}, null).detectResilientLocation();
  assert.equal(result.city, undefined);
  assert.equal(result.mandal, undefined);
  assert.equal(result.street, undefined);
});

for (const code of ['QMCX+3RF', 'vx5j+q3', '8FW4+RX Synthetic Village']) {
  test(`native geocoder skips plus code ${code} and uses the next real street`, async () => {
    const f = fixture({ subAdministrativeArea: 'Native District', locality: 'Synthetic Village', thoroughfare: ` ${code} `, subThoroughfare: ' Synthetic Lane ' });
    const result = await f.detectResilientLocation();
    assert.equal(result.street, 'Synthetic Lane');
    assert.equal(result.city, 'Synthetic Village');
    assert.equal(f.fetch.mock.callCount(), 0);
  });
}

test('plus codes in all three native street sources never become the displayed street', async () => {
  const result = await fixture({ locality: 'Synthetic Village', thoroughfare: 'QMCX+3RF', subThoroughfare: 'VX5J+Q3', areasOfInterest: ['8FW4+RX'] }).detectResilientLocation();
  assert.equal(result.street, 'Synthetic Village Main Road');
});

test('area of interest is used when both street fields are plus codes', async () => {
  const result = await fixture({ thoroughfare: 'QMCX+3RF', subThoroughfare: 'VX5J+Q3', areasOfInterest: [' Synthetic Park '] }).detectResilientLocation();
  assert.equal(result.street, 'Synthetic Park');
});

test('real thoroughfare has priority over other native street sources', async () => {
  const result = await fixture({ thoroughfare: ' Synthetic Road ', subThoroughfare: 'Synthetic Lane', areasOfInterest: ['Synthetic Park'] }).detectResilientLocation();
  assert.equal(result.street, 'Synthetic Road');
});

test('production diagnostic printer does not inspect or log private diagnostics', () => {
  const f = fixture();
  const diagnostic = new Proxy({}, { get() { throw new Error('must not inspect production diagnostics'); } });
  assert.doesNotThrow(() => f.printLocationDiagnostic(diagnostic));
  assert.equal(f.console.log.mock.callCount(), 0);
});
