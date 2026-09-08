/**
 * Authoritative September 2026 Hierarchical Regional Geospatial Data for FindLostPuppy
 * Government of India Local Government Directory (LGD) Validated Hierarchy:
 * State -> District -> Mandal / Taluk -> City / Village / Locality
 */

import { locationService } from '../services/locationService';
import districtsData from '../data/location/districts.json';
import subdistrictsData from '../data/location/subdistricts.json';

export const SUPPORTED_STATES = ['Andhra Pradesh', 'Telangana', 'Karnataka'] as const;
export type SupportedState = (typeof SUPPORTED_STATES)[number];

export interface StateGeoData {
  [district: string]: string[];
}

/**
 * Returns list of official districts for a state, strictly sorted in alphabetical order (A-Z)
 */
export function getDistrictsForState(stateName: string): string[] {
  const districts = locationService.getDistricts(stateName);
  return districts.map((d) => d.districtName).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns list of official mandals/taluks for a district, strictly sorted in alphabetical order (A-Z)
 */
export function getMandalsForDistrict(stateName: string, districtName: string): string[] {
  const mandals = locationService.getSubDistricts(districtName, stateName);
  return mandals.map((m) => m.subDistrictName).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns list of official villages/localities for a mandal, strictly sorted in alphabetical order (A-Z)
 */
export function getVillagesForMandal(
  stateName: string,
  districtName: string,
  mandalName: string
): string[] {
  if (!mandalName || mandalName === 'CUSTOM') return [];

  const district = locationService.getDistrict(stateName, districtName);
  if (!district) return [];

  const subdistrict = locationService.getSubDistrict(district.districtCode, mandalName);
  if (!subdistrict) return [];

  const localities = locationService.getLocalitiesSync(
    district.districtCode,
    subdistrict.subDistrictCode
  );

  if (localities.length > 0) {
    return localities.map((l) => l.localityName).sort((a, b) => a.localeCompare(b));
  }

  // If not yet synchronously loaded in cache, provide clean subdistrict name as fallback
  const cleanName = mandalName.replace(/\s*\([^)]*\)/g, '').trim();
  return [cleanName];
}

/**
 * Normalize state name against supported states
 */
export function normalizeSupportedState(rawState?: string): SupportedState {
  if (!rawState) return 'Andhra Pradesh';
  const lower = rawState.toLowerCase();
  if (lower.includes('telangana')) return 'Telangana';
  if (lower.includes('karnataka')) return 'Karnataka';
  return 'Andhra Pradesh';
}

/**
 * Pre-computed lookup dictionary for quick compatibility
 */
export const REGIONAL_GEO_DATA: Record<SupportedState, StateGeoData> = {
  'Andhra Pradesh': {},
  'Telangana': {},
  'Karnataka': {},
};

for (const d of districtsData) {
  const stName = d.stateName as SupportedState;
  if (REGIONAL_GEO_DATA[stName]) {
    const subs = subdistrictsData
      .filter((s) => s.districtCode === d.districtCode)
      .map((s) => s.subDistrictName)
      .sort((a, b) => a.localeCompare(b));
    REGIONAL_GEO_DATA[stName][d.districtName] = subs;
  }
}
