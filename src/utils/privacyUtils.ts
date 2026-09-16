/**
 * Privacy and Security Utilities for FindLostPuppy
 * 
 * Provides masking algorithms for public dashboard views to protect pet owners'
 * personal contact details (phone, email, real names) while maintaining trust
 * and enabling community sighting reports.
 */

import type { LostReport } from '../types';

export {
  validateIndianPhoneNumber,
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  type PhoneValidationResult,
} from './phoneValidator';

/**
 * Masks a phone number to hide middle identifying digits while preserving privacy.
 * Example: "8639452948" -> "+91 86••••••48"
 * Example: "+91 9848012345" -> "+91 98••••••45"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') {
    return '••••• •••••';
  }

  const trimmed = phone.trim();
  // Idempotency: Return immediately if string already contains mask characters
  if (trimmed.includes('•') || trimmed.includes('*')) {
    return trimmed;
  }

  const rawDigits = trimmed.replace(/\D/g, '');
  if (rawDigits.length < 4) {
    return '••••• •••••';
  }

  // Handle standard 10-digit Indian numbers (or with 91 / 0 prefix)
  let coreDigits = rawDigits;
  if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
    coreDigits = rawDigits.slice(2);
  } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
    coreDigits = rawDigits.slice(1);
  }

  if (coreDigits.length === 10) {
    const first2 = coreDigits.slice(0, 2);
    const last2 = coreDigits.slice(-2);
    return `+91 ${first2}••••••${last2}`;
  }

  const first2 = rawDigits.slice(0, 2);
  const last2 = rawDigits.slice(-2);
  return `${first2}••••••${last2}`;
}

/**
 * Masks an email address to protect privacy.
 * Example: "jksurampudi5@gmail.com" -> "j•••5@gmail.com"
 * Example: "krishna@findlostpuppy.org" -> "k•••a@findlostpuppy.org"
 */
export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '•••••@••••.com';
  }

  const trimmed = email.trim().toLowerCase();

  // Idempotency: Return immediately if string already contains mask characters
  if (trimmed.includes('•') || trimmed.includes('*')) {
    return trimmed;
  }

  const [localPart, domainPart] = trimmed.split('@');

  if (!localPart || !domainPart) {
    return '•••••@••••.com';
  }

  if (localPart.length <= 2) {
    return `${localPart[0]}•@${domainPart}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedMiddle = '•••';

  return `${firstChar}${maskedMiddle}${lastChar}@${domainPart}`;
}

/**
 * Masks an owner's full name for public community views.
 * Example: "Jayakrishna Surampudi" -> "J••••• S•••••••"
 * Example: "Priyanka Sharma" -> "P•••••• S•••••"
 */
export function maskOwnerName(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'Verified Pet Parent';
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === 'verified pet parent' || trimmed.toLowerCase() === 'community member') {
    return 'Verified Pet Parent';
  }

  const words = trimmed.split(/\s+/);
  const maskedWords = words.map((w) => {
    if (w.length <= 1) return w;
    return `${w[0]}${'•'.repeat(Math.min(w.length - 1, 5))}`;
  });

  return maskedWords.join(' ');
}

/**
 * Checks if the currently logged-in user is the verified owner of a given lost report.
 * When true, the user is permitted to view their own unmasked contact information and edit permissions.
 */
export function isOwnerOfReport(
  report?: LostReport | null,
  currentUser?: { id?: string; email?: string } | null
): boolean {
  if (!report || !currentUser) return false;

  const currentUserId = (currentUser.id || '').trim();
  const currentUserEmail = (currentUser.email || '').trim().toLowerCase();

  const reportOwnerId = (report.ownerId || '').replace(/^owner-/, '').trim();
  const reportEmail = (report.contactMechanism?.safeContactEmail || '').trim().toLowerCase();

  if (currentUserId && (reportOwnerId === currentUserId || report.ownerId === currentUserId)) {
    return true;
  }

  if (currentUserEmail && reportEmail && currentUserEmail === reportEmail) {
    return true;
  }

  return false;
}

/**
 * Normalizes and sanitizes person display names to prevent raw UUIDs, user IDs, or empty names.
 */
export function sanitizePersonName(rawName?: string, email?: string): string {
  if (!rawName) {
    if (email?.toLowerCase().includes('jksurampudi5')) return 'Jaya Krishna';
    if (email && email.includes('@')) {
      const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
      return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : '';
    }
    return '';
  }
  const trimmed = rawName.trim();
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed) ||
    /^user-[0-9a-z-]+$/i.test(trimmed)
  ) {
    if (email?.toLowerCase().includes('jksurampudi5')) return 'Jaya Krishna';
    if (email && email.includes('@')) {
      const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();
      return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : '';
    }
    return '';
  }
  return trimmed;
}
