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

// Common Indian city/regional aliases mapping to official LGD districts
const DISTRICT_ALIASES: Record<string, string> = {
  vijayawada: 'Ntr',
  bangalore: 'Bengaluru Urban',
  bengaluru: 'Bengaluru Urban',
  vizag: 'Visakhapatnam',
  visakha: 'Visakhapatnam',
  secunderabad: 'Hyderabad',
  cyberabad: 'Hyderabad',
  shaikpet: 'Hyderabad',
  rajahmundry: 'East Godavari',
  bhimavaram: 'West Godavari',
  machilipatnam: 'Krishna',
  tirupati: 'Tirupati',
  kadapa: 'Y.S.R. Kadapa',
  nellore: 'Sri Potti Sriramulu Nellore',
  konaseema: 'Dr. B.R. Ambedkar Konaseema',
  manyam: 'Parvathipuram Manyam',
  alluri: 'Alluri Sitharama Raju',
  puttaparthi: 'Sri Sathya Sai',
  hanamkonda: 'Hanamkonda',
  warangal: 'Warangal',
  kukatpally: 'Medchal Malkajgiri',
  malkajgiri: 'Medchal Malkajgiri',
  gajuwaka: 'Visakhapatnam',
  madhapur: 'Ranga Reddy',
  serilingampally: 'Ranga Reddy',
  serilingampalle: 'Ranga Reddy',
  gachibowli: 'Ranga Reddy',
  whitefield: 'Bengaluru Urban',
  koramangala: 'Bengaluru Urban',
  indiranagar: 'Bengaluru Urban',
  jayanagar: 'Bengaluru Urban',
};

function normalizeStem(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/mandal|taluk|district|\(urban\)|\(rural\)|\(mdl\)/gi, '')
    .trim()
    .replace(/palle$/, 'pally')
    .replace(/puram$/, 'pur')
    .replace(/uru$/, 'ur')
    .replace(/gudem$/, 'guda')
    .replace(/peta$/, 'pet');
}

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
   * Find district by code or name with aliases and subdistrict fallback
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
    // 1. Exact match first
    const exact = districts.find(
      (d) => d.districtName.toLowerCase() === clean
    );
    if (exact) return exact;

    // 2. Substring / fuzzy match
    const subMatch = districts.find(
      (d) =>
        d.districtName.toLowerCase().includes(clean) ||
        clean.includes(d.districtName.toLowerCase())
    );
    if (subMatch) return subMatch;

    // 3. Alias dictionary check
    for (const [alias, targetDist] of Object.entries(DISTRICT_ALIASES)) {
      if (clean.includes(alias) || alias.includes(clean)) {
        const found = districts.find((d) => d.districtName.toLowerCase() === targetDist.toLowerCase());
        if (found) return found;
      }
    }

    // 4. Check subdistricts in this state to recover parent district
    const state = this.getState(stateCodeOrName);
    if (state) {
      const stemClean = normalizeStem(clean);
      const sub = this.subdistricts.find(
        (s) =>
          s.stateCode === state.code &&
          (normalizeStem(s.subDistrictName) === stemClean ||
            normalizeStem(s.subDistrictName).includes(stemClean) ||
            stemClean.includes(normalizeStem(s.subDistrictName)))
      );
      if (sub) {
        return districts.find((d) => d.districtCode === sub.districtCode);
      }
    }

    return undefined;
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
   * Find subdistrict by code or name within a district with stem normalization
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
      .replace(/\s*\(urban\)/i, '')
      .replace(/\s*\(rural\)/i, '')
      .trim();

    const exact = list.find((s) => s.subDistrictName.toLowerCase() === clean);
    if (exact) return exact;

    const stemClean = normalizeStem(clean);
    const stemMatch = list.find((s) => {
      const sStem = normalizeStem(s.subDistrictName);
      return sStem === stemClean || sStem.includes(stemClean) || stemClean.includes(sStem);
    });
    if (stemMatch) return stemMatch;

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
    stateCode?: number;
    districtCode?: number;
    subDistrictCode?: number;
  }): Promise<LocationMatchResult | null> {
    const {
      state: rawState,
      district: rawDistrict,
      mandal: rawMandal,
      locality: rawLocality,
      pinCode: rawPin,
      stateCode: explicitStateCode,
      districtCode: explicitDistrictCode,
      subDistrictCode: explicitSubDistrictCode,
    } = params;

    // 1. Match State (explicit code takes precedence)
    let matchedState: LocationState | undefined;
    if (explicitStateCode) {
      matchedState = this.getState(explicitStateCode);
    }
    if (!matchedState) {
      matchedState = this.getState(rawState || '');
    }
    if (!matchedState && rawPin && /^\d{6}$/.test(rawPin.trim())) {
      const prefix = parseInt(rawPin.trim().slice(0, 2), 10);
      if (prefix === 50) matchedState = this.getState(36); // Telangana
      else if (prefix >= 51 && prefix <= 53) matchedState = this.getState(28); // Andhra Pradesh
      else if (prefix >= 56 && prefix <= 59) matchedState = this.getState(29); // Karnataka
    }
    if (!matchedState && rawDistrict) {
      const d = this.districts.find((item) => item.districtName.toLowerCase().includes(rawDistrict.toLowerCase()));
      if (d) matchedState = this.getState(d.stateCode);
    }
    if (!matchedState) {
      return null;
    }

    // 2. Match District (explicit code takes precedence)
    let matchedDistrict: LocationDistrict | undefined;
    if (explicitDistrictCode) {
      matchedDistrict = this.getDistrict(matchedState.code, explicitDistrictCode);
    }
    if (!matchedDistrict && rawDistrict) {
      matchedDistrict = this.getDistrict(matchedState.code, rawDistrict);
    }
    if (!matchedDistrict && rawMandal) {
      matchedDistrict = this.getDistrict(matchedState.code, rawMandal);
    }
    if (!matchedDistrict && rawLocality) {
      matchedDistrict = this.getDistrict(matchedState.code, rawLocality);
    }
    // Heuristic fallbacks for well-known aliases
    if (!matchedDistrict && rawDistrict) {
      const hint = `${rawDistrict} ${rawMandal || ''} ${rawLocality || ''}`.toLowerCase();
      const districts = this.getDistricts(matchedState.code);
      if (hint.includes('undrajavaram') || hint.includes('rajahmundry')) {
        matchedDistrict = districts.find((d) => d.districtName.toLowerCase() === 'east godavari');
      } else if (hint.includes('vikarabad')) {
        matchedDistrict = districts.find((d) => d.districtName.toLowerCase() === 'vikarabad');
      } else if (hint.includes('vijayawada')) {
        matchedDistrict = districts.find((d) => d.districtName.toLowerCase() === 'ntr');
      }
    }

    // CRITICAL: NEVER silently pick districts[0] if district could not be matched!
    if (!matchedDistrict) return null;

    // 3. Match Mandal (explicit subdistrict code takes precedence)
    let matchedSubDistrict: LocationSubDistrict | undefined;
    if (explicitSubDistrictCode) {
      matchedSubDistrict = this.getSubDistrict(matchedDistrict.districtCode, explicitSubDistrictCode);
    }
    if (!matchedSubDistrict && rawMandal) {
      matchedSubDistrict = this.getSubDistrict(matchedDistrict.districtCode, rawMandal);
    }
    if (!matchedSubDistrict && rawLocality) {
      matchedSubDistrict = this.getSubDistrict(matchedDistrict.districtCode, rawLocality);
    }
    if (!matchedSubDistrict && rawDistrict) {
      matchedSubDistrict = this.getSubDistrict(matchedDistrict.districtCode, rawDistrict);
    }

    // CRITICAL: NEVER silently pick mandals[0] if mandal could not be matched!
    if (!matchedSubDistrict) return null;

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

    if (!matchedLocality && localities.length > 0) {
      matchedLocality =
        localities.find(
          (l) =>
            l.localityName.toLowerCase() ===
            matchedSubDistrict?.subDistrictName.toLowerCase()
        ) || localities[0];
    }

    if (!matchedLocality && (rawLocality || matchedSubDistrict)) {
      matchedLocality = {
        localityCode: 999999,
        localityName: rawLocality || matchedSubDistrict.subDistrictName,
        localityType: 'URBAN_LOCALITY',
        subDistrictCode: matchedSubDistrict.subDistrictCode,
        subDistrictName: matchedSubDistrict.subDistrictName,
        subDistrictType: (matchedSubDistrict.subDistrictType as any) || 'Mandal',
        districtCode: matchedDistrict.districtCode,
        districtName: matchedDistrict.districtName,
        stateCode: matchedState.code,
        stateName: matchedState.name,
      };
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
