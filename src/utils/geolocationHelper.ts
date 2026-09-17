/**
 * Resilient Multi-Tier Geolocation & Administrative Resolver for FindLostPuppy
 * 
 * Pipeline:
 * 1. Physical Device Location (Capacitor Native GPS / Fused Location or Browser Geolocation API)
 * 2. Accuracy Validation (thresholds: 0-20m Excellent, 20-50m Good, 50-100m Moderate, >100m Low)
 * 3. Authoritative Point-in-Polygon Administrative Boundary Containment (State -> District -> Mandal)
 * 4. Reverse Geocoding (Village / Locality & PIN) without overriding authoritative boundary polygons
 * 5. Smart Multi-Office Postal PIN Cross-Validation (scores candidate post offices)
 * 6. Confidence Model (HIGH, MEDIUM, LOW) & Transparent Diagnostics
 */
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { findMandalByCoordinates } from './boundaryLookup';

export interface LocationDiagnostic {
  platform: string;
  permission: 'fine' | 'coarse' | 'browser' | 'denied';
  coordinates: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    source: 'gps' | 'network' | 'ip';
    timestamp?: number;
  };
  boundary?: {
    state?: string;
    district?: string;
    mandal?: string;
    stateCode?: number;
    districtCode?: number;
    subDistrictCode?: number;
    matched: boolean;
  };
  reverseGeocoder?: {
    state?: string;
    district?: string;
    mandal?: string;
    village?: string;
    pin?: string;
    provider?: string;
  };
  postalValidation?: string;
  matchLocationInput?: any;
  matchLocationOutput?: any;
  finalResult: {
    state?: string;
    district?: string;
    mandal?: string;
    village?: string;
    pin?: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  };
}

export interface LocationGeoResult {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  pinCode?: string;
  source: 'gps' | 'network' | 'ip';
  accuracyMeters?: number;
  stateCode?: number;
  districtCode?: number;
  subDistrictCode?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceReason: string;
  boundaryMatched: boolean;
  permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied';
  diagnostic?: LocationDiagnostic;
}

interface CoordsResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied';
  timestamp?: number;
}

export class NativeLocationError extends Error {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';

  constructor(code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED', message: string) {
    super(message);
    this.name = 'NativeLocationError';
    this.code = code;
  }
}

/**
 * Print safe, structured diagnostic matching task specification (no secrets exposed)
 */
export function printLocationDiagnostic(d: LocationDiagnostic) {
  const lines = [
    '=== FINDLOSTPUPPY LOCATION DIAGNOSTIC ===',
    `Platform: ${d.platform}`,
    `Permission: ${d.permission}`,
    'Coordinates:',
    `  Latitude: ${d.coordinates.latitude}`,
    `  Longitude: ${d.coordinates.longitude}`,
    `  Accuracy: ${d.coordinates.accuracyMeters != null ? `±${Math.round(d.coordinates.accuracyMeters)}m` : 'Unknown'}`,
    `  Source: ${d.coordinates.source}`,
    'Boundary:',
    `  State: ${d.boundary?.state || 'None'}`,
    `  District: ${d.boundary?.district || 'None'}`,
    `  Mandal: ${d.boundary?.mandal || 'None'}`,
    `  Matched: ${d.boundary?.matched ? 'Yes' : 'No'}`,
    'Reverse Geocoder:',
    `  State: ${d.reverseGeocoder?.state || 'None'}`,
    `  District: ${d.reverseGeocoder?.district || 'None'}`,
    `  Mandal: ${d.reverseGeocoder?.mandal || 'None'}`,
    `  Village: ${d.reverseGeocoder?.village || 'None'}`,
    `  PIN: ${d.reverseGeocoder?.pin || 'None'}`,
    `Postal validation: ${d.postalValidation || 'None'}`,
    `matchLocation input: ${JSON.stringify(d.matchLocationInput || {})}`,
    `matchLocation output: ${JSON.stringify(d.matchLocationOutput || {})}`,
    'FINAL RESULT:',
    `  State: ${d.finalResult.state || 'Unresolved'}`,
    `  District: ${d.finalResult.district || 'Unresolved'}`,
    `  Mandal: ${d.finalResult.mandal || 'Unresolved'}`,
    `  Village: ${d.finalResult.village || 'Unresolved'}`,
    `  PIN: ${d.finalResult.pin || 'Unresolved'}`,
    `  Confidence: ${d.finalResult.confidence}`,
    `  Reason: ${d.finalResult.reason}`,
    '========================================',
  ];
  console.log(lines.join('\n'));
}

/**
 * Acquire physical device location with fine vs coarse permission differentiation
 */
async function getPositionWithConfig(options: PositionOptions): Promise<CoordsResult> {
  if (Capacitor.isNativePlatform()) {
    let perm = await Geolocation.checkPermissions();
    let permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied' = 'denied';

    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
        throw new NativeLocationError('PERMISSION_DENIED', 'Location permission denied');
      }
      permissionStatus = req.location === 'granted' ? 'fine' : 'coarse';
    } else {
      permissionStatus = perm.location === 'granted' ? 'fine' : 'coarse';
    }

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy,
        permissionStatus,
        timestamp: pos.timestamp,
      };
    } catch (nativeErr: any) {
      console.warn('[geolocationHelper] Native GPS tier failed:', nativeErr);
      throw new NativeLocationError(
        nativeErr?.code === 3 ? 'TIMEOUT' : 'POSITION_UNAVAILABLE',
        nativeErr?.message || 'Native location fix failed'
      );
    }
  }

  // Web / macOS platform
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new NativeLocationError('UNSUPPORTED', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          permissionStatus: 'browser',
          timestamp: pos.timestamp,
        }),
      (err) => {
        const code =
          err.code === 1
            ? 'PERMISSION_DENIED'
            : err.code === 3
            ? 'TIMEOUT'
            : 'POSITION_UNAVAILABLE';
        reject(new NativeLocationError(code, err.message || 'Browser location failed'));
      },
      options
    );
  });
}

/**
 * Smart Multi-Office Postal PIN Validation
 * Compares candidate post offices against detected administrative context.
 * NEVER blindly takes PostOffice[0].
 */
export async function enrichWithPostalPin(
  pinCode: string,
  context: { state?: string; district?: string; mandal?: string; city?: string }
): Promise<{
  bestOffice?: string;
  postalMandal?: string;
  postalDistrict?: string;
  postalState?: string;
  validationMsg: string;
} | null> {
  if (!pinCode || !/^\d{6}$/.test(pinCode.trim())) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const postalRes = await fetch(`https://api.postalpincode.in/pincode/${pinCode.trim()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (postalRes.ok) {
      const pData = await postalRes.json();
      if (Array.isArray(pData) && pData[0]?.Status === 'Success') {
        const offices = pData[0].PostOffice;
        if (Array.isArray(offices) && offices.length > 0) {
          // Score each post office against our known spatial/reverse-geocoded context
          let bestScore = -1;
          let bestPo: any = null;

          const targetMandal = (context.mandal || '').trim().toLowerCase();
          const targetDistrict = (context.district || '').trim().toLowerCase();
          const targetCity = (context.city || '').trim().toLowerCase();
          const targetState = (context.state || '').trim().toLowerCase();

          for (const po of offices) {
            let score = 0;
            const poBlock = (po.Block || '').trim().toLowerCase();
            const poName = (po.Name || '').trim().toLowerCase();
            const poDistrict = (po.District || '').trim().toLowerCase();
            const poState = (po.State || '').trim().toLowerCase();

            if (targetMandal && (poBlock === targetMandal || poBlock.includes(targetMandal) || targetMandal.includes(poBlock))) {
              score += 40;
            }
            if (targetCity && (poName === targetCity || poName.includes(targetCity) || targetCity.includes(poName))) {
              score += 30;
            }
            if (targetDistrict && (poDistrict === targetDistrict || poDistrict.includes(targetDistrict) || targetDistrict.includes(poDistrict))) {
              score += 20;
            }
            if (targetState && (poState === targetState || poState.includes(targetState) || targetState.includes(poState))) {
              score += 10;
            }

            if (score > bestScore) {
              bestScore = score;
              bestPo = po;
            }
          }

          if (bestPo && bestScore > 0) {
            return {
              bestOffice: bestPo.Name,
              postalMandal: bestPo.Block !== 'NA' ? bestPo.Block : undefined,
              postalDistrict: bestPo.District,
              postalState: bestPo.State,
              validationMsg: `Matched post office "${bestPo.Name}" (score ${bestScore}) among ${offices.length} offices for PIN ${pinCode}`,
            };
          }

          // If no specific office scored above 0, use common state/district if all offices agree
          const allSameDistrict = offices.every((o: any) => o.District.toLowerCase() === offices[0].District.toLowerCase());
          return {
            postalDistrict: allSameDistrict ? offices[0].District : undefined,
            postalState: offices[0].State,
            validationMsg: `PIN ${pinCode} verified with ${offices.length} branch offices (unanimous district: ${allSameDistrict ? offices[0].District : 'multiple'})`,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] Postal PIN validation notice:', err);
  }

  return null;
}

/**
 * Reverse Geocoding with Nominatim and BigDataCloud.
 * Primarily used for Village / Locality and PIN code (authoritative boundaries take precedence for State/District/Mandal).
 */
async function reverseGeocodeCoords(lat: number, lng: number): Promise<{
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  pinCode?: string;
  provider: string;
}> {
  let state: string | undefined;
  let district: string | undefined;
  let mandal: string | undefined;
  let city: string | undefined;
  let pinCode: string | undefined;
  let provider = 'none';

  // 1. Nominatim OpenStreetMap Reverse Geocoder
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FindLostPuppy-MobileApp/1.0 (https://findlostpuppy.com)',
        },
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      state = addr.state;
      district = addr.state_district || addr.county || addr.district;
      mandal = addr.subdistrict || addr.county || addr.city_district || addr.suburb;
      city = addr.city || addr.town || addr.village || addr.suburb || addr.residential || addr.neighbourhood;
      pinCode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : undefined;
      provider = 'nominatim';
    }
  } catch (err) {
    console.warn('[geolocationHelper] Nominatim reverse geocode notice:', err);
  }

  // 2. BigDataCloud Fallback
  if (!state || !district || !city) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        state = state || data.principalSubdivision;
        district = district || data.localityInfo?.administrative?.[2]?.name || data.city;
        mandal = mandal || data.localityInfo?.administrative?.[3]?.name || data.locality;
        city = city || data.city || data.locality;
        pinCode = pinCode || (data.postcode ? data.postcode.replace(/\D/g, '').slice(0, 6) : undefined);
        provider = provider === 'none' ? 'bigdatacloud' : `${provider}+bigdatacloud`;
      }
    } catch (err) {
      console.warn('[geolocationHelper] BigDataCloud reverse geocode notice:', err);
    }
  }

  return { state, district, mandal, city, pinCode, provider };
}

/**
 * IP Location Fallback (STRICT: Never pretend IP is GPS)
 */
async function fetchIpLocation(): Promise<CoordsResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: 10000,
          permissionStatus: 'denied',
        };
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] ipwho.is notice:', err);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracyMeters: 10000,
          permissionStatus: 'denied',
        };
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] freeipapi notice:', err);
  }

  return null;
}

/**
 * Master Resilient Location Detector
 * Enforces:
 * - Device physical location (Capacitor FusedLocation / Browser GPS)
 * - Strict Accuracy Validation
 * - Point-in-Polygon Administrative Boundary Authority
 * - Postal PIN cross-validation without blind PostOffice[0] selection
 * - Transparent diagnostic logging
 */
export async function detectResilientLocation(): Promise<LocationGeoResult> {
  let lat: number | null = null;
  let lng: number | null = null;
  let accuracyMeters: number | undefined;
  let source: 'gps' | 'network' | 'ip' = 'gps';
  let permissionStatus: 'fine' | 'coarse' | 'browser' | 'denied' = 'browser';
  let fixTimestamp: number | undefined;

  // Tier 1: Hardware High-Accuracy GPS (15s timeout)
  try {
    const pos = await getPositionWithConfig({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    lat = pos.latitude;
    lng = pos.longitude;
    accuracyMeters = pos.accuracyMeters;
    permissionStatus = pos.permissionStatus;
    fixTimestamp = pos.timestamp;
    source = 'gps';

    // If initial GPS fix is somewhat coarse (> 50m) and we have time, attempt a 1-shot refinement
    if (accuracyMeters && accuracyMeters > 50) {
      try {
        const refinePos = await getPositionWithConfig({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
        if (refinePos.accuracyMeters && refinePos.accuracyMeters < accuracyMeters) {
          lat = refinePos.latitude;
          lng = refinePos.longitude;
          accuracyMeters = refinePos.accuracyMeters;
          fixTimestamp = refinePos.timestamp;
        }
      } catch {
        // Retain initial fix
      }
    }
  } catch (gpsErr: any) {
    if (gpsErr?.code === 'PERMISSION_DENIED') {
      throw gpsErr;
    }
    console.warn('[geolocationHelper] Tier 1 GPS failed, attempting Tier 2 network...', gpsErr);
  }

  // Tier 2: Network / Coarse location
  if (lat === null) {
    try {
      const pos = await getPositionWithConfig({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30000,
      });
      lat = pos.latitude;
      lng = pos.longitude;
      accuracyMeters = pos.accuracyMeters;
      permissionStatus = pos.permissionStatus;
      fixTimestamp = pos.timestamp;
      source = 'network';
    } catch (netErr) {
      console.warn('[geolocationHelper] Tier 2 network failed, attempting Tier 3 IP fallback...', netErr);
      const ipResult = await fetchIpLocation();
      if (ipResult) {
        lat = ipResult.latitude;
        lng = ipResult.longitude;
        accuracyMeters = ipResult.accuracyMeters;
        permissionStatus = 'denied';
        source = 'ip';
      }
    }
  }

  if (lat !== null && lng !== null) {
    let state: string | undefined;
    let district: string | undefined;
    let mandal: string | undefined;
    let city: string | undefined;
    let pinCode: string | undefined;
    let stateCode: number | undefined;
    let districtCode: number | undefined;
    let subDistrictCode: number | undefined;
    let boundaryMatched = false;

    // Authoritative Point-in-Polygon Boundary Lookup (Tier 1 GPS & Tier 2 Network)
    if (source !== 'ip') {
      try {
        const boundaryResult = await findMandalByCoordinates(lat, lng);
        if (boundaryResult) {
          state = boundaryResult.stateName;
          district = boundaryResult.districtName;
          mandal = boundaryResult.subDistrictName;
          stateCode = boundaryResult.stateCode;
          districtCode = boundaryResult.districtCode;
          subDistrictCode = boundaryResult.subDistrictCode;
          boundaryMatched = true;
        }
      } catch (boundaryErr) {
        console.warn('[geolocationHelper] Boundary lookup notice:', boundaryErr);
      }
    }

    // Reverse Geocode for Village/Locality and PIN
    const revGeo = await reverseGeocodeCoords(lat, lng);

    // AUTHORITY RULE: Boundary polygon results have HIGHER authority than reverse-geocoder strings
    if (!boundaryMatched) {
      state = revGeo.state;
      district = revGeo.district;
      mandal = revGeo.mandal;
    }
    city = revGeo.city || mandal;
    pinCode = revGeo.pinCode;

    // Smart Postal PIN Validation (score candidate post offices)
    let postalValidationMsg = 'None';
    if (pinCode) {
      const pinEnrich = await enrichWithPostalPin(pinCode, { state, district, mandal, city });
      if (pinEnrich) {
        postalValidationMsg = pinEnrich.validationMsg;
        if (!boundaryMatched) {
          state = state || pinEnrich.postalState;
          district = district || pinEnrich.postalDistrict;
          mandal = mandal || pinEnrich.postalMandal;
        }
        if (pinEnrich.bestOffice && !city) {
          city = pinEnrich.bestOffice;
        }
      }
    }

    // Determine Confidence Level
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let confidenceReason = '';

    if (source === 'ip') {
      confidence = 'LOW';
      confidenceReason = 'Coarse IP address location fallback. Exact physical GPS coordinates unavailable; manual selection required.';
    } else if (permissionStatus === 'coarse') {
      confidence = 'LOW';
      confidenceReason = `Approximate location permission granted by user (accuracy ±${Math.round(accuracyMeters || 1500)}m). Please verify Mandal.`;
    } else if (accuracyMeters && accuracyMeters > 150) {
      confidence = 'LOW';
      confidenceReason = `Coarse position fix (±${Math.round(accuracyMeters)}m). May cross mandal boundary; please confirm.`;
    } else if (boundaryMatched && accuracyMeters && accuracyMeters <= 50) {
      confidence = 'HIGH';
      confidenceReason = `High-accuracy GPS fix (±${Math.round(accuracyMeters)}m) confirmed within official administrative boundary polygon.`;
    } else if (boundaryMatched && accuracyMeters && accuracyMeters <= 150) {
      confidence = 'MEDIUM';
      confidenceReason = `Moderate GPS fix (±${Math.round(accuracyMeters)}m) inside administrative boundary polygon.`;
    } else if (!boundaryMatched && accuracyMeters && accuracyMeters <= 50) {
      confidence = 'MEDIUM';
      confidenceReason = `Accurate GPS fix (±${Math.round(accuracyMeters)}m), but administrative boundaries not loaded for this state. Resolved via reverse geocoding.`;
    } else {
      confidence = 'LOW';
      confidenceReason = `Moderate accuracy (±${Math.round(accuracyMeters || 100)}m) outside verified boundary polygons. Please verify details.`;
    }

    const platform = Capacitor.isNativePlatform() ? 'Android (Capacitor)' : 'Web/macOS Browser';

    const diagnostic: LocationDiagnostic = {
      platform,
      permission: permissionStatus,
      coordinates: {
        latitude: lat,
        longitude: lng,
        accuracyMeters,
        source,
        timestamp: fixTimestamp,
      },
      boundary: {
        state,
        district,
        mandal,
        stateCode,
        districtCode,
        subDistrictCode,
        matched: boundaryMatched,
      },
      reverseGeocoder: {
        state: revGeo.state,
        district: revGeo.district,
        mandal: revGeo.mandal,
        village: revGeo.city,
        pin: revGeo.pinCode,
        provider: revGeo.provider,
      },
      postalValidation: postalValidationMsg,
      matchLocationInput: {
        state,
        district,
        mandal,
        locality: city,
        pinCode,
        stateCode,
        districtCode,
        subDistrictCode,
      },
      finalResult: {
        state,
        district,
        mandal,
        village: city,
        pin: pinCode,
        confidence,
        reason: confidenceReason,
      },
    };

    // Output safe diagnostic log
    printLocationDiagnostic(diagnostic);

    return {
      latitude: lat,
      longitude: lng,
      state,
      district,
      mandal,
      city,
      pinCode,
      source,
      accuracyMeters,
      stateCode,
      districtCode,
      subDistrictCode,
      confidence,
      confidenceReason,
      boundaryMatched,
      permissionStatus,
      diagnostic,
    };
  }

  throw new Error('Unable to determine location. Please select manually.');
}
