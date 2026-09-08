import type { DogProfile, LostReport } from '../types';
import { getDogDisplayName } from './dogPhotoHelper';

/**
 * Returns the canonical base URL for the application (supporting both localhost and subpath deployments like GitHub Pages)
 */
export function getAppBaseUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${window.location.origin}${cleanBase}`;
}

/**
 * Formats a clean, high-priority WhatsApp SOS message containing relevant pet details,
 * direct public dashboard link (no login required!), and direct pet flyer link.
 */
export function generateWhatsAppSosMessage(
  report?: Partial<LostReport> | null,
  dog?: Partial<DogProfile> | null,
  contactPhone?: string
): {
  message: string;
  dashboardUrl: string;
  dogUrl: string;
  sightingUrl: string;
  whatsappUrl: string;
} {
  const baseUrl = getAppBaseUrl();
  const reportId = report?.id || '';
  const dogName = getDogDisplayName(dog, report);
  const breed = dog?.breed || report?.dog?.breed || 'Companion Pet';
  const color = dog?.color || report?.dog?.color || '';
  const marks = dog?.distinguishingMarks || report?.dog?.distinguishingMarks || '';
  const location = report?.lastKnownLocation || report?.ownerApproximateLocation || 'Neighborhood Area';
  const dateLost = report?.dateLost || '';
  const timeLost = report?.timeLost || '';

  const dashboardUrl = `${baseUrl}/dashboard`;
  const dogUrl = reportId ? `${baseUrl}/dog/${reportId}` : `${baseUrl}/dashboard`;
  const sightingUrl = reportId ? `${baseUrl}/report-sighting/${reportId}` : `${baseUrl}/dashboard`;

  const phone = contactPhone || report?.contactMechanism?.safeContactPhone || '';

  const message =
    `🚨 *EMERGENCY LOST DOG ALERT* 🐾\n\n` +
    `Please help find *"${dogName}"* (${breed})!\n` +
    `📍 *Last Seen Location:* ${location}\n` +
    (dateLost ? `📅 *Lost On:* ${dateLost}${timeLost ? ` at ${timeLost}` : ''}\n` : '') +
    (color ? `🎨 *Color:* ${color}\n` : '') +
    (marks ? `🔍 *Distinct Marks:* ${marks}\n` : '') +
    (phone ? `📞 *Owner Contact:* ${phone}\n` : '') +
    `\n🌐 *View Live Community Dashboard (No Login Needed):*\n👉 ${dashboardUrl}\n\n` +
    (reportId ? `🐾 *Direct Pet Flyer & Sighting Form:*\n👉 ${dogUrl}\n\n` : '') +
    `FindLostPuppy Community Pet Recovery Network 🐕❤️`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  return { message, dashboardUrl, dogUrl, sightingUrl, whatsappUrl };
}
