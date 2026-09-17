import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { locationService } from '../services/locationService';

export interface MandalLookupResult {
  districtName: string;
  districtCode: number;
  subDistrictName: string;
  subDistrictCode: number;
  stateCode?: number;
  stateName?: string;
}

/**
 * Approximate bounding boxes for supported states to quickly select candidates.
 * Coordinates are [minLng, minLat, maxLng, maxLat]
 */
const STATE_BOUNDING_BOXES: Record<number, [number, number, number, number]> = {
  36: [77.15, 15.80, 81.85, 19.95], // Telangana
  28: [76.70, 12.60, 84.80, 19.15], // Andhra Pradesh
  29: [74.00, 11.50, 78.65, 18.50], // Karnataka
};

// In-memory cache for loaded GeoJSON collections to avoid re-reading/re-parsing
const stateGeoJsonCache: Record<number, any> = {};

/**
 * Lazy-load GeoJSON boundary collection for a given state.
 * Chunks are code-split and only fetched when a point inside the state is evaluated.
 */
async function loadStateGeoJson(stateCode: number): Promise<any | null> {
  if (stateGeoJsonCache[stateCode]) {
    return stateGeoJsonCache[stateCode];
  }

  try {
    let mod: any;
    if (stateCode === 36) {
      mod = await import('../data/location/boundaries/36_mandals.geojson');
    } else if (stateCode === 28) {
      mod = await import('../data/location/boundaries/28_mandals.geojson');
    } else if (stateCode === 29) {
      mod = await import('../data/location/boundaries/29_mandals.geojson');
    } else {
      return null;
    }

    const data = mod?.default || mod;
    if (data && data.features) {
      stateGeoJsonCache[stateCode] = data;
      return data;
    }
    return null;
  } catch (err) {
    console.warn(`[boundaryLookup] Failed to lazy-load boundaries for state ${stateCode}:`, err);
    return null;
  }
}

/**
 * Find which Mandal polygon contains the given coordinates using mathematical Point-in-Polygon.
 * Cross-references the matched names against our authoritative LGD dataset to guarantee exact code alignment.
 */
export async function findMandalByCoordinates(
  lat: number,
  lng: number,
  stateCode?: number
): Promise<MandalLookupResult | null> {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Determine candidate states to check
  const candidateStates: number[] = [];
  if (stateCode && [28, 29, 36].includes(stateCode)) {
    candidateStates.push(stateCode);
  } else {
    // Determine by coordinate bounding boxes
    for (const [sCodeStr, bbox] of Object.entries(STATE_BOUNDING_BOXES)) {
      const sCode = parseInt(sCodeStr, 10);
      const [minLng, minLat, maxLng, maxLat] = bbox;
      if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
        candidateStates.push(sCode);
      }
    }
  }

  if (candidateStates.length === 0) {
    return null;
  }

  const pt = point([lng, lat]);
  const ptInPoly = (booleanPointInPolygon as any).default || booleanPointInPolygon;

  for (const sCode of candidateStates) {
    const geoJson = await loadStateGeoJson(sCode);
    if (!geoJson || !Array.isArray(geoJson.features)) continue;

    for (const feature of geoJson.features) {
      // Sub-millisecond bounding box rejection check
      if (feature.bbox) {
        const [minX, minY, maxX, maxY] = feature.bbox;
        if (lng < minX || lng > maxX || lat < minY || lat > maxY) {
          continue;
        }
      }

      // Precise mathematical point-in-polygon check
      if (ptInPoly(pt, feature)) {
        const props = feature.properties || {};
        const rawDistrictName = props.districtName || '';
        const rawSubDistrictName = props.subDistrictName || '';
        const matchedStateCode = props.stateCode || sCode;

        // Cross-reference with canonical LGD hierarchy
        const canonicalDistrict = locationService.getDistrict(matchedStateCode, rawDistrictName);
        const finalDistrictName = canonicalDistrict?.districtName || rawDistrictName;
        const finalDistrictCode = canonicalDistrict?.districtCode || props.districtCode || 0;

        let canonicalSubDistrict;
        if (canonicalDistrict) {
          canonicalSubDistrict = locationService.getSubDistrict(canonicalDistrict.districtCode, rawSubDistrictName);
        }

        const finalSubDistrictName = canonicalSubDistrict?.subDistrictName || rawSubDistrictName;
        const finalSubDistrictCode = canonicalSubDistrict?.subDistrictCode || props.subDistrictCode || 0;

        const stateName =
          canonicalDistrict?.stateName ||
          props.stateName ||
          (matchedStateCode === 36 ? 'Telangana' : matchedStateCode === 28 ? 'Andhra Pradesh' : 'Karnataka');

        return {
          districtName: finalDistrictName,
          districtCode: finalDistrictCode,
          subDistrictName: finalSubDistrictName,
          subDistrictCode: finalSubDistrictCode,
          stateCode: matchedStateCode,
          stateName,
        };
      }
    }
  }

  return null;
}
