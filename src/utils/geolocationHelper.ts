/**
 * Resilient 3-Tier Geolocation Helper for Web & Mobile
 * Tier 1: Hardware High-Accuracy GPS (satellites)
 * Tier 2: Low-Accuracy Network Location (Cell tower / Wi-Fi triangulation - works indoors)
 * Tier 3: Network IP-based Location Fallback (works indoors / GPS toggle disabled)
 */

export interface LocationGeoResult {
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  pinCode?: string;
  source: 'gps' | 'network' | 'ip';
}

/**
 * Attempts to get position from browser/device geolocation with timeout
 */
function getPositionWithConfig(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Reverse geocodes lat/lng into address components
 * Tier A: OpenStreetMap Nominatim (zoom 18)
 * Tier B: BigDataCloud Reverse Geocoding
 */
async function reverseGeocodeCoords(lat: number, lng: number): Promise<Partial<LocationGeoResult>> {
  let state: string | undefined;
  let district: string | undefined;
  let mandal: string | undefined;
  let city: string | undefined;
  let pinCode: string | undefined;

  // 1. Try Nominatim
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

  // 2. Fallback / Augment: BigDataCloud
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

  // 3. If PIN code is present, verify/fill official District and Mandal via Indian Postal API
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

/**
 * IP-based location fallback (works indoors or when GPS toggle is off)
 * Tier A: ipwho.is
 * Tier B: freeipapi.com
 */
async function fetchIpLocation(): Promise<LocationGeoResult | null> {
  // Provider 1: ipwho.is
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
          state: data.region,
          district: data.city,
          city: data.city,
          pinCode: data.postal ? data.postal.replace(/\D/g, '').slice(0, 6) : undefined,
          source: 'ip',
        };
      }
    }
  } catch (err) {
    console.warn('[geolocationHelper] ipwho.is fallback notice:', err);
  }

  // Provider 2: freeipapi.com
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
          state: data.regionName,
          district: data.cityName,
          city: data.cityName,
          pinCode: data.zipCode ? data.zipCode.replace(/\D/g, '').slice(0, 6) : undefined,
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
 * Master resilient location detector:
 * 1. Tries GPS High Accuracy (5s timeout)
 * 2. Tries Network Coarse Location (4s timeout, highly reliable indoors)
 * 3. Tries Fast IP Geolocation Fallback (<1s)
 */
export async function detectResilientLocation(): Promise<LocationGeoResult> {
  let lat: number | null = null;
  let lng: number | null = null;
  let source: 'gps' | 'network' | 'ip' = 'gps';
  let initialAddress: Partial<LocationGeoResult> = {};

  // Tier 1: Try High Accuracy GPS (fast 5s timeout)
  try {
    const pos = await getPositionWithConfig({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000,
    });
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
    source = 'gps';
  } catch {
    // Tier 2: Try Network Wi-Fi / Cell Tower triangulation (reliable indoors)
    try {
      const pos = await getPositionWithConfig({
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 120000,
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      source = 'network';
    } catch {
      // Tier 3: Fast IP-based fallback
      const ipResult = await fetchIpLocation();
      if (ipResult) {
        lat = ipResult.latitude;
        lng = ipResult.longitude;
        initialAddress = ipResult;
        source = 'ip';
      }
    }
  }

  // Reverse geocode whenever coordinates are found (including IP coordinates!)
  if (lat !== null && lng !== null) {
    const addressDetails = await reverseGeocodeCoords(lat, lng);
    return {
      latitude: lat,
      longitude: lng,
      state: addressDetails.state || initialAddress.state,
      district: addressDetails.district || initialAddress.district,
      mandal: addressDetails.mandal || initialAddress.mandal,
      city: addressDetails.city || initialAddress.city,
      pinCode: addressDetails.pinCode || initialAddress.pinCode,
      source,
    };
  }

  // Final fallback attempt if lat/lng were somehow null
  const finalIp = await fetchIpLocation();
  if (finalIp) return finalIp;

  throw new Error('Unable to determine location. Please select manually.');
}
