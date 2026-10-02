import type { LostReport, OwnerProfile } from '../types';

export interface ReportGeoLocation {
  state: string;
  district: string;
  mandal: string;
  village: string;
}

export const getReportGeo = (r: LostReport, profiles: OwnerProfile[] = []): ReportGeoLocation => {
  const cleanOwnerId = (r.ownerId || '').replace(/^owner-/, '').toLowerCase().trim();
  const safeContact = (r.contactMechanism?.safeContactEmail || '').toLowerCase().trim();

  const p = profiles.find((pr) => {
    const prId = (pr.id || '').replace(/^owner-/, '').toLowerCase().trim();
    const prUserId = (pr.userId || '').replace(/^owner-/, '').toLowerCase().trim();
    const prEmail = (pr.email || '').toLowerCase().trim();
    return (
      (prId && prId === cleanOwnerId) ||
      (prUserId && prUserId === cleanOwnerId) ||
      (prEmail && safeContact && prEmail === safeContact)
    );
  });

  const dogAny = (r.dog || {}) as Record<string, any>;
  let state = (dogAny.state || p?.state || '').trim();
  let district = (dogAny.district || p?.district || '').trim();
  let mandal = (dogAny.mandalOrMunicipality || p?.mandalOrMunicipality || '').trim();
  let village = (dogAny.city || dogAny.streetOrLocality || p?.city || p?.streetOrLocality || '').trim();

  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''} ${p?.approximateArea || ''} ${p?.address || ''}`.trim();

  // If state is missing, infer from combinedText
  if (!state) {
    if (/andhra pradesh|\bap\b/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/telangana|\bts\b/i.test(combinedText)) state = 'Telangana';
    else if (/karnataka|\bka\b/i.test(combinedText)) state = 'Karnataka';
    else if (/tamil nadu|\btn\b/i.test(combinedText)) state = 'Tamil Nadu';
    else if (/maharashtra/i.test(combinedText)) state = 'Maharashtra';
    else if (/kerala/i.test(combinedText)) state = 'Kerala';
    else if (/vikarabad|hyderabad|rangareddy|yennaepally/i.test(combinedText)) state = 'Telangana';
    else if (/godavari|palangi|undrajavaram|tanuku|guntur|krishna/i.test(combinedText)) state = 'Andhra Pradesh';
    else if (/bengaluru|bangalore|mysuru|mysore/i.test(combinedText)) state = 'Karnataka';
  }

  // If district is missing, infer
  if (!district && combinedText) {
    if (/west godavari/i.test(combinedText)) district = 'West Godavari';
    else if (/east godavari/i.test(combinedText)) district = 'East Godavari';
    else if (/vikarabad|yennaepally/i.test(combinedText)) district = 'Vikarabad';
    else if (/hyderabad/i.test(combinedText)) district = 'Hyderabad';
    else if (/rangareddy|ranga reddy/i.test(combinedText)) district = 'Rangareddy';
    else if (/bengaluru|bangalore/i.test(combinedText)) district = 'Bengaluru Urban';
    else if (/palangi|undrajavaram|tanuku/i.test(combinedText)) district = 'West Godavari';
  }

  // If mandal is missing, infer
  if (!mandal && combinedText) {
    if (/undrajavaram/i.test(combinedText)) mandal = 'Undrajavaram';
    else if (/vikarabad|yennaepally/i.test(combinedText)) mandal = 'Vikarabad';
    else if (/tanuku/i.test(combinedText)) mandal = 'Tanuku';
    else if (/palangi/i.test(combinedText)) mandal = 'Undrajavaram';
  }

  // If village is missing, infer
  if (!village && combinedText) {
    if (/palangi/i.test(combinedText)) village = 'Palangi';
    else if (/yennaepally/i.test(combinedText)) village = 'Yennaepally';
  }

  return { state, district, mandal, village };
};

export const isMatchState = (r: LostReport, targetState: string, profiles: OwnerProfile[] = []): boolean => {
  if (!targetState) return true;
  const geo = getReportGeo(r, profiles);
  const ts = targetState.trim().toLowerCase();
  if (geo.state && geo.state.toLowerCase() === ts) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(ts);
};

export const isMatchDistrict = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchState(r, targetState, profiles)) return false;
  if (!targetDistrict) return true;
  const geo = getReportGeo(r, profiles);
  const td = targetDistrict.trim().toLowerCase();
  if (geo.district && geo.district.toLowerCase() === td) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(td);
};

export const isMatchMandal = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  targetMandal: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchDistrict(r, targetState, targetDistrict, profiles)) return false;
  if (!targetMandal) return true;
  const geo = getReportGeo(r, profiles);
  const tm = targetMandal.trim().toLowerCase();
  if (geo.mandal && geo.mandal.toLowerCase() === tm) return true;
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tm);
};

export const isMatchCity = (
  r: LostReport,
  targetState: string,
  targetDistrict: string,
  targetMandal: string,
  targetCity: string,
  profiles: OwnerProfile[] = []
): boolean => {
  if (!isMatchMandal(r, targetState, targetDistrict, targetMandal, profiles)) return false;
  if (!targetCity) return true;
  const geo = getReportGeo(r, profiles);
  const tc = targetCity.trim().toLowerCase();
  if (
    geo.village &&
    (geo.village.toLowerCase() === tc ||
      geo.village.toLowerCase().includes(tc) ||
      tc.includes(geo.village.toLowerCase()))
  ) {
    return true;
  }
  const combinedText = `${r.lastKnownLocation || ''} ${r.ownerApproximateLocation || ''}`.toLowerCase();
  return combinedText.includes(tc);
};
