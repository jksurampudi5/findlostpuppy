/**
 * Privacy and Security Utilities for FindLostPuppy
 * 
 * Provides masking algorithms for public dashboard views to protect pet owners'
 * personal contact details (phone, email, real names) while maintaining trust
 * and enabling community sighting reports.
 */

import type { LostReport } from '../types';

/**
 * Masks a phone number to hide middle and primary identifying digits.
 * Example: "8639452948" -> "+91 ••••• ••948" or "(•••) •••-2948"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') {
    return '••••• •••••';
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return '••••• •••••';
  }

  const last4 = digits.slice(-4);
  if (digits.length === 10) {
    return `+91 ••••• ••${last4.slice(-3)}`;
  }

  if (digits.length > 10) {
    return `+•• ••••• ••${last4.slice(-3)}`;
  }

  return `••••• ••${last4}`;
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
