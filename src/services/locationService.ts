import statesData from '../data/location/states.json';
import districtsData from '../data/location/districts.json';
import subdistrictsData from '../data/location/subdistricts.json';
import type {
  LocationState,
  LocationDistrict,
  LocationSubDistrict,
  LocationLocality,
} from '../types';

export interface LocationMatchResult {
  state: LocationState;
  district: LocationDistrict;
  subDistrict: LocationSubDistrict;
  locality?: LocationLocality;
}

// Vite glob loader for code-split district locality files
const localityModules = import.meta.glob<LocationLocality[] | { default: LocationLocality[] }>(
  '../data/location/localities/*.json'
);

class LocationService {
  private states: LocationState[] = statesData as LocationState[];
  private districts: LocationDistrict[] = districtsData as LocationDistrict[];
  private subdistricts: LocationSubDistrict[] = subdistrictsData as LocationSubDistrict[];
  private localityCache: Map<number, LocationLocality[]> = new Map();

  /**
   * Get all supported states (Andhra Pradesh, Telangana, Karnataka)
   */
  getStates(): LocationState[] {
    return [...this.states].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get state by code or name
   */
  getState(stateCodeOrName: number | string): LocationState | undefined {
    if (typeof stateCodeOrName === 'number') {
      return this.states.find((s) => s.code === stateCodeOrName);
    }
    const clean = stateCodeOrName.trim().toLowerCase();
    return this.states.find(
      (s) =>
        s.name.toLowerCase() === clean ||
        s.shortCode.toLowerCase() === clean ||
        (clean.includes('andhra') && s.code === 28) ||
        (clean.includes('telangana') && s.code === 36) ||
        (clean.includes('karnataka') && s.code === 29)
    );
  }

  /**
   * Get all districts for a given state
   */
  getDistricts(stateCodeOrName: number | string): LocationDistrict[] {
    const st = this.getState(stateCodeOrName);
    if (!st) return [];
    return this.districts
      .filter((d) => d.stateCode === st.code)
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  }

  /**
   * Find district by code or name
   */
  getDistrict(
    stateCodeOrName: number | string,
    districtCodeOrName: number | string
  ): LocationDistrict | undefined {
    const districts = this.getDistricts(stateCodeOrName);
    if (typeof districtCodeOrName === 'number') {
      return districts.find((d) => d.districtCode === districtCodeOrName);
    }
    const clean = districtCodeOrName.trim().toLowerCase().replace(/\s*district/i, '');
    // Exact match first
    const exact = districts.find(
      (d) => d.districtName.toLowerCase() === clean
    );
    if (exact) return exact;

    // Substring / fuzzy match
    return districts.find(
      (d) =>
        d.districtName.toLowerCase().includes(clean) ||
        clean.includes(d.districtName.toLowerCase())
    );
  }

  /**
   * Get all mandals/taluks for a given district
   */
  getSubDistricts(districtCodeOrName: number | string, stateCodeOrName?: number | string): LocationSubDistrict[] {
    let targetDistrictCode: number | undefined;

    if (typeof districtCodeOrName === 'number') {
      targetDistrictCode = districtCodeOrName;
    } else if (stateCodeOrName) {
      const d = this.getDistrict(stateCodeOrName, districtCodeOrName);
      targetDistrictCode = d?.districtCode;
    } else {
      const clean = districtCodeOrName.trim().toLowerCase().replace(/\s*district/i, '');
      const d = this.districts.find(
        (item) =>
          item.districtName.toLowerCase() === clean ||
          item.districtName.toLowerCase().includes(clean)
      );
      targetDistrictCode = d?.districtCode;
    }

    if (!targetDistrictCode) return [];

    return this.subdistricts
      .filter((s) => s.districtCode === targetDistrictCode)
      .sort((a, b) => a.subDistrictName.localeCompare(b.subDistrictName));
  }

  /**
   * Find subdistrict by code or name within a district
   */
  getSubDistrict(
    districtCode: number,
    subDistrictCodeOrName: number | string
  ): LocationSubDistrict | undefined {
    const list = this.getSubDistricts(districtCode);
    if (typeof subDistrictCodeOrName === 'number') {
      return list.find((s) => s.subDistrictCode === subDistrictCodeOrName);
    }
    const clean = subDistrictCodeOrName
      .trim()
      .toLowerCase()
      .replace(/\s*\(mdl\)/i, '')
      .replace(/\s*mandal/i, '')
      .replace(/\s*taluk/i, '')
      .trim();

    const exact = list.find((s) => s.subDistrictName.toLowerCase() === clean);
    if (exact) return exact;

    return list.find(
      (s) =>
        s.subDistrictName.toLowerCase().includes(clean) ||
        clean.includes(s.subDistrictName.toLowerCase())
    );
  }

  /**
   * Asynchronously load and cache localities for a district
   */
  async loadDistrictLocalities(districtCode: number): Promise<LocationLocality[]> {
    if (this.localityCache.has(districtCode)) {
      return this.localityCache.get(districtCode)!;
    }

    try {
      let data: LocationLocality[] = [];

      if (localityModules) {
        const matchingKey = Object.keys(localityModules).find((k) =>
          k.endsWith(`/${districtCode}.json`)
        );
        if (matchingKey) {
          const mod = await localityModules[matchingKey]();
          data = Array.isArray(mod) ? mod : (mod as any).default || (mod as any);
        }
      }

      this.localityCache.set(districtCode, data);
      return data;
    } catch (err) {
      console.error(`Failed to load localities for district ${districtCode}`, err);
      return [];
    }
  }

  /**
   * Get localities for a given mandal/subdistrict
   */
  async getLocalities(
    districtCode: number,
    subDistrictCode?: number
  ): Promise<LocationLocality[]> {
    const districtLocalities = await this.loadDistrictLocalities(districtCode);
    if (!subDistrictCode) {
      return districtLocalities;
    }
    return districtLocalities
      .filter((l) => l.subDistrictCode === subDistrictCode)
      .sort((a, b) => a.localityName.localeCompare(b.localityName));
  }

  /**
   * Synchronously get already-cached localities (or empty array if not loaded yet)
   */
  getLocalitiesSync(
    districtCode: number,
    subDistrictCode?: number
  ): LocationLocality[] {
    const cached = this.localityCache.get(districtCode);
    if (!cached) return [];
    if (!subDistrictCode) return cached;
    return cached
      .filter((l) => l.subDistrictCode === subDistrictCode)
      .sort((a, b) => a.localityName.localeCompare(b.localityName));
  }

  /**
   * Match location from reverse geocoding or PIN code against authoritative LGD hierarchy
   */
  async matchLocation(params: {
    state?: string;
    district?: string;
    mandal?: string;
    locality?: string;
    pinCode?: string;
  }): Promise<LocationMatchResult | null> {
    const { state: rawState, district: rawDistrict, mandal: rawMandal, locality: rawLocality } = params;

    if (!rawState && !rawDistrict) return null;

    // 1. Match State
    const matchedState = this.getState(rawState || '');
    if (!matchedState) return null;

    // 2. Match District
    const districts = this.getDistricts(matchedState.code);
    let matchedDistrict: LocationDistrict | undefined;

    if (rawDistrict) {
      const cleanDist = rawDistrict.trim().toLowerCase().replace(/\s*district/i, '');
      matchedDistrict = districts.find(
        (d) =>
          d.districtName.toLowerCase() === cleanDist ||
          d.districtName.toLowerCase().includes(cleanDist) ||
          cleanDist.includes(d.districtName.toLowerCase())
      );
    }

    // Special recent reorganization heuristics (e.g. NTR, West Godavari, East Godavari)
    if (!matchedDistrict && rawDistrict) {
      const hint = `${rawDistrict} ${rawMandal || ''} ${rawLocality || ''}`.toLowerCase();
      if (hint.includes('undrajavaram')) {
        matchedDistrict = districts.find((d) => d.districtName.toLowerCase() === 'east godavari');
      } else if (hint.includes('vikarabad')) {
        matchedDistrict = districts.find((d) => d.districtName.toLowerCase() === 'vikarabad');
      }
    }

    if (!matchedDistrict) {
      // Return state only or first district fallback? Strict rule: return null if district can't be matched
      return null;
    }

    // 3. Match Mandal
    const mandals = this.getSubDistricts(matchedDistrict.districtCode);
    let matchedSubDistrict: LocationSubDistrict | undefined;

    if (rawMandal) {
      const cleanMandal = rawMandal
        .trim()
        .toLowerCase()
        .replace(/\s*\(mdl\)/i, '')
        .replace(/\s*mandal/i, '')
        .replace(/\s*taluk/i, '')
        .trim();

      matchedSubDistrict = mandals.find(
        (m) =>
          m.subDistrictName.toLowerCase() === cleanMandal ||
          m.subDistrictName.toLowerCase().includes(cleanMandal) ||
          cleanMandal.includes(m.subDistrictName.toLowerCase())
      );
    }

    // If mandal not matched yet, check if locality matches a mandal name
    if (!matchedSubDistrict && rawLocality) {
      const cleanLoc = rawLocality.trim().toLowerCase();
      matchedSubDistrict = mandals.find(
        (m) =>
          m.subDistrictName.toLowerCase() === cleanLoc ||
          m.subDistrictName.toLowerCase().includes(cleanLoc) ||
          cleanLoc.includes(m.subDistrictName.toLowerCase())
      );
    }

    if (!matchedSubDistrict) {
      matchedSubDistrict = mandals[0];
    }

    if (!matchedSubDistrict) {
      return null;
    }

    // 4. Match Locality inside the matched SubDistrict
    let matchedLocality: LocationLocality | undefined;
    const localities = await this.getLocalities(
      matchedDistrict.districtCode,
      matchedSubDistrict.subDistrictCode
    );

    if (rawLocality) {
      const cleanLoc = rawLocality.trim().toLowerCase();
      matchedLocality = localities.find(
        (l) =>
          l.localityName.toLowerCase() === cleanLoc ||
          l.localityName.toLowerCase().includes(cleanLoc) ||
          cleanLoc.includes(l.localityName.toLowerCase())
      );
    }

    // If still no locality match, default to first locality in mandal (often mandal HQ / primary town)
    if (!matchedLocality && localities.length > 0) {
      // Find locality named same as mandal if exists
      matchedLocality =
        localities.find(
          (l) =>
            l.localityName.toLowerCase() ===
            matchedSubDistrict?.subDistrictName.toLowerCase()
        ) || localities[0];
    }

    return {
      state: matchedState,
      district: matchedDistrict,
      subDistrict: matchedSubDistrict,
      locality: matchedLocality,
    };
  }
}

export const locationService = new LocationService();
