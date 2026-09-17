/**
 * Resilient 3-Tier Geolocation Helper for Web & Mobile
 * Tier 1: Hardware High-Accuracy GPS
 * Tier 2: Low-Accuracy Network Location (Wi-Fi/cell triangulation)
 * Tier 3: IP-based fallback (LOW CONFIDENCE — never auto-fill district/mandal from this)
 */
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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
}

interface CoordsResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

class NativeLocationError extends Error {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';

  constructor(code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED', message: string) {
    super(message);
    this.name = 'NativeLocationError';
    this.code = code;
  }
}

async function getPositionWithConfig(options: PositionOptions): Promise<CoordsResult> {
  if (Capacitor.isNativePlatform()) {
    // Native platforms NEVER fall through to navigator.geolocation —
    // WebView's navigator.geolocation has no reliable native bridge and will hang/reject.
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
        throw new NativeLocationError('PERMISSION_DENIED', 'Location permission denied');
      }
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
      };
    } catch (nativeErr: any) {
      console.warn('[geolocationHelper] Native GPS tier failed:', nativeErr);
      throw new NativeLocationError(
        nativeErr?.code === 3 ? 'TIMEOUT' : 'POSITION_UNAVAILABLE',
        nativeErr?.message || 'Native location fix failed'
      );
    }
  }

  // Web only
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new NativeLocationError('UNSUPPORTED', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyMeters: pos.coords.accuracy,
      }),
      reject,
      options
    );
  });
}

async function reverseGeocodeCoords(lat: number, lng: number): Promise<Partial<LocationGeoResult>> {
  let state: string | undefined;
  let district: string | undefined;
  let mandal: string | undefined;
  let city: string | undefined;
  let pinCode: string | undefined;

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
      city = addr.city || addr.town || addr.village || addr.suburb || addr.residential;
      pinCode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : undefined;
    }
  } catch (err) {
    console.warn('[geolocationHelper] Nominatim reverse geocode notice:', err);
  }

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
      }
    } catch (err) {
      console.warn('[geolocationHelper] BigDataCloud reverse geocode notice:', err);
    }
  }

  if (pinCode && /^\d{6}$/.test(pinCode) && (!district || !mandal)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const postalRes = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (postalRes.ok) {
        const pData = await postalRes.json();
        if (Array.isArray(pData) && pData[0]?.Status === 'Success') {
          const po = pData[0].PostOffice?.[0];
          if (po) {
            state = state || po.State;
            district = district || po.District;
            mandal = mandal || po.Block;
            city = city || po.Name;
          }
        }
      }
    } catch (err) {
      console.warn('[geolocationHelper] Postal PIN enrich notice:', err);
    }
  }

  return { state, district, mandal, city, pinCode };
}

async function fetchIpLocation(): Promise<LocationGeoResult | null> {
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
          // NOTE: state/district intentionally NOT set here anymore.
          // IP-tier coords get reverse-geocoded like everything else, but the
          // caller must treat source:'ip' results as low-confidence and NOT
          // silently auto-fill district/mandal dropdowns from them.
          source: 'ip',
        };
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] ipwho.is fallback notice:', err);
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
          source: 'ip',
        };
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] freeipapi fallback notice:', err);
  }

  return null;
}

/**
 * Master resilient location detector.
 * Tier 1: GPS high-accuracy, 15s timeout (was 5s — too short for cold indoor fix), maximumAge 0.
 * Tier 2: Network/coarse, 8s timeout.
 * Tier 3: IP fallback — always tagged source:'ip' so callers can withhold auto-fill.
 */
export async function detectResilientLocation(): Promise<LocationGeoResult> {
  let lat: number | null = null;
  let lng: number | null = null;
  let accuracyMeters: number | undefined;
  let source: 'gps' | 'network' | 'ip' = 'gps';

  // Tier 1: Hardware High-Accuracy GPS (30s timeout, up to 2 retries on timeout/unavailable)
  let gpsAttempts = 0;
  const maxGpsAttempts = 3; // 1 initial attempt + 2 retries = ~90s total GPS budget for accuracy

  while (gpsAttempts < maxGpsAttempts && lat === null) {
    gpsAttempts++;
    try {
      const pos = await getPositionWithConfig({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      });
      lat = pos.latitude;
      lng = pos.longitude;
      accuracyMeters = pos.accuracyMeters;
      source = 'gps';
      break;
    } catch (gpsErr: any) {
      console.warn(`[geolocationHelper] Tier 1 GPS attempt ${gpsAttempts}/${maxGpsAttempts} failed:`, gpsErr);
      // PERMISSION_DENIED must not retry — throw immediately
      if (gpsErr?.code === 'PERMISSION_DENIED') {
        throw gpsErr;
      }
      // If attempts exhausted, loop finishes and code falls to Tier 2
    }
  }

  // Tier 2: Network/coarse (only after GPS retries exhausted)
  if (lat === null) {
    console.warn('[geolocationHelper] GPS retries exhausted, trying Tier 2 network location...');
    try {
      const pos = await getPositionWithConfig({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      });
      lat = pos.latitude;
      lng = pos.longitude;
      accuracyMeters = pos.accuracyMeters;
      source = 'network';
    } catch (netErr) {
      console.warn('[geolocationHelper] Tier 2 network failed, trying Tier 3 (IP):', netErr);
      const ipResult = await fetchIpLocation();
      if (ipResult) {
        lat = ipResult.latitude;
        lng = ipResult.longitude;
        source = 'ip';
      }
    }
  }

  if (lat !== null && lng !== null) {
    const addressDetails = await reverseGeocodeCoords(lat, lng);
    return {
      latitude: lat,
      longitude: lng,
      state: addressDetails.state,
      district: addressDetails.district,
      mandal: addressDetails.mandal,
      city: addressDetails.city,
      pinCode: addressDetails.pinCode,
      source,
      accuracyMeters,
    };
  }

  throw new Error('Unable to determine location. Please select manually.');
}
