import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadModule } from './test_harness.mjs';

function fixture() {
  return loadModule('src/services/locationService.ts', {
    mocks: {
      '../data/location/states.json': [{ code: 28, name: 'Andhra Pradesh', shortCode: 'AP' }],
      '../data/location/districts.json': [
        { districtCode: 1, districtName: 'First District', stateCode: 28 },
        { districtCode: 2, districtName: 'Second District', stateCode: 28 },
      ],
      '../data/location/subdistricts.json': [
        { subDistrictCode: 11, subDistrictName: 'First Mandal', districtCode: 1, stateCode: 28 },
        { subDistrictCode: 12, subDistrictName: 'Second Mandal', districtCode: 1, stateCode: 28 },
        { subDistrictCode: 21, subDistrictName: 'Foreign Mandal', districtCode: 2, stateCode: 28 },
      ],
    },
    globals: {
      __testImportMeta: { env: {}, glob: () => ({
        '../data/location/localities/1.json': async () => [{
          localityCode: 111, localityName: 'First Mandal', subDistrictCode: 11,
        }, { localityCode: 112, localityName: 'Actual Village', subDistrictCode: 11 }],
      }) },
    },
  }).locationService;
}

test('empty district and mandal inputs do not match the first available entry', () => {
  const service = fixture();
  assert.equal(service.getDistrict(28, ''), undefined);
  assert.equal(service.getSubDistrict(1, ''), undefined);
});

test('a state-only detection does not manufacture a district', async () => {
  assert.equal(await fixture().matchLocation({ state: 'Andhra Pradesh' }), null);
});

test('a known district does not manufacture a mandal or home base', async () => {
  const match = await fixture().matchLocation({ state: 'Andhra Pradesh', district: 'First District' });
  assert.equal(match.district.districtCode, 1);
  assert.equal(match.subDistrict, undefined);
  assert.equal(match.locality, undefined);
});

test('authoritative subdistrict codes take precedence over conflicting names', async () => {
  const match = await fixture().matchLocation({ stateCode: 28, districtCode: 1, subDistrictCode: 11, mandal: 'Second Mandal' });
  assert.equal(match.subDistrict.subDistrictCode, 11);
  assert.equal(match.locality, undefined);
});

test('home base must be actually resolved and distinct from the matched mandal', async () => {
  const service = fixture();
  const params = { stateCode: 28, districtCode: 1, subDistrictCode: 11 };
  assert.equal((await service.matchLocation(params)).locality, undefined);
  assert.equal((await service.matchLocation({ ...params, locality: 'First Mandal' })).locality, undefined);
  assert.equal((await service.matchLocation({ ...params, locality: 'Actual Village' })).locality.localityCode, 112);
});
