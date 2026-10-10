/**
 * GeoBlockService — India-Only Access Control
 *
 * FindLostPuppy is exclusively designed for Indian users.
 * This service detects the visitor's country via IP geolocation and
 * returns whether they are permitted to use the application.
 *
 * Strategy:
 *  1. Check sessionStorage cache to avoid repeated API calls.
 *  2. Try ipwho.is (no API key needed, fast, free).
 *  3. Fallback to freeipapi.com.
 *  4. Fallback to ip-api.com.
 *  5. If ALL lookups fail (network issue / VPN), allow access — never
 *     penalise a legitimate Indian user for a transient network error.
 *
 * The result is cached in sessionStorage for the lifetime of the tab.
 */

const SESSION_KEY = 'flp_geo_check_v1';
const ALLOWED_COUNTRY_CODE = 'IN';
const TIMEOUT_MS = 5000;

export interface GeoCheckResult {
  allowed: boolean;
  /** ISO-3166-1 alpha-2 code, e.g. "IN", "US". undefined when lookup failed. */
  countryCode?: string;
  countryName?: string;
  /** True when we could not determine country (network error / VPN) — access allowed by default. */
  indeterminate?: boolean;
}

function cachedResult(): GeoCheckResult | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as GeoCheckResult;
  } catch {
    // ignore
  }
  return null;
}

function cacheResult(result: GeoCheckResult): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Performs an IP-based country lookup against multiple free providers.
 * Returns a GeoCheckResult with `allowed` set to true only for India (IN).
 * Falls back to `allowed: true, indeterminate: true` if all providers fail.
 */
export async function checkGeoAccess(): Promise<GeoCheckResult> {
  // Return cached result for this browser tab
  const cached = cachedResult();
  if (cached) return cached;

  // Provider 1: ipwho.is
  try {
    const res = await fetchWithTimeout('https://ipwho.is/');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.country_code) {
        const result: GeoCheckResult = {
          allowed: data.country_code === ALLOWED_COUNTRY_CODE,
          countryCode: data.country_code,
          countryName: data.country,
        };
        cacheResult(result);
        return result;
      }
    }
  } catch {
    // fall through
  }

  // Provider 2: freeipapi.com
  try {
    const res = await fetchWithTimeout('https://freeipapi.com/api/json');
    if (res.ok) {
      const data = await res.json();
      if (data.countryCode) {
        const result: GeoCheckResult = {
          allowed: data.countryCode === ALLOWED_COUNTRY_CODE,
          countryCode: data.countryCode,
          countryName: data.countryName,
        };
        cacheResult(result);
        return result;
      }
    }
  } catch {
    // fall through
  }

  // Provider 3: ip-api.com (plain HTTP — ok for read-only geo)
  try {
    const res = await fetchWithTimeout('http://ip-api.com/json/?fields=status,country,countryCode');
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.countryCode) {
        const result: GeoCheckResult = {
          allowed: data.countryCode === ALLOWED_COUNTRY_CODE,
          countryCode: data.countryCode,
          countryName: data.country,
        };
        cacheResult(result);
        return result;
      }
    }
  } catch {
    // fall through
  }

  // All providers failed — be permissive (never block a real Indian user due to network issues)
  const fallback: GeoCheckResult = { allowed: true, indeterminate: true };
  cacheResult(fallback);
  return fallback;
}

/** Clears the session geo-cache (useful for testing). */
export function clearGeoCache(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
