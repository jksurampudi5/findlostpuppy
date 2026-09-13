/**
 * Indian Mobile Phone Number Validator & Formatter
 * 
 * Complies with the Indian National Numbering Plan (DoT):
 * - Mobile numbers must be exactly 10 digits.
 * - Mobile numbers in India must start with 6, 7, 8, or 9.
 * - Disallows invalid dummy numbers (e.g. 1234567819, 0000000000, all-repeated digits).
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  cleanDigits: string;
  formatted: string;
}

/**
 * Extracts the 10-digit mobile number from an Indian phone string by stripping
 * country codes (+91, 91), leading zeros (0), and formatting characters.
 */
export function extractIndianPhoneDigits(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');

  // Strip leading international country code +91 or 91 if total digits is 12
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // Strip leading trunk prefix 0 if total digits is 11
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Validates whether a given string is a genuine 10-digit Indian mobile number.
 */
export function validateIndianPhoneNumber(raw: string): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      error: 'Please enter a 10-digit contact phone number.',
      cleanDigits: '',
      formatted: '',
    };
  }

  const digits = extractIndianPhoneDigits(raw);

  // Check 1: Must be exactly 10 digits
  if (digits.length === 0) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number containing digits.',
      cleanDigits: '',
      formatted: '',
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      error: `Phone number is incomplete (${digits.length}/10 digits entered).`,
      cleanDigits: digits,
      formatted: digits,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      error: `Phone number exceeds 10 digits (${digits.length} digits). Please enter standard 10-digit Indian mobile number.`,
      cleanDigits: digits,
      formatted: digits,
    };
  }

  // Check 2: Must start with 6, 7, 8, or 9
  const firstDigit = digits[0];
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      error: `Invalid Indian mobile number. Mobile numbers in India must start with 6, 7, 8, or 9 (starts with "${firstDigit}").`,
      cleanDigits: digits,
      formatted: digits,
    };
  }

  // Check 3: Disallow all identical repeated digits (e.g. 9999999999, 8888888888, 7777777777, 6666666666)
  if (/^(\d)\1{9}$/.test(digits)) {
    return {
      isValid: false,
      error: 'Please enter your genuine personal phone number, not repeated dummy digits.',
      cleanDigits: digits,
      formatted: digits,
    };
  }

  // Check 4: Disallow trivial sequential test dummy numbers (e.g. 9876543210)
  if (digits === '9876543210') {
    return {
      isValid: false,
      error: 'Please enter your genuine personal phone number, not a sequential test number.',
      cleanDigits: digits,
      formatted: digits,
    };
  }

  // Valid 10-digit Indian mobile number
  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return {
    isValid: true,
    cleanDigits: digits,
    formatted,
  };
}

/**
 * Formats a phone input as standard Indian format +91 XXXXX XXXXX as user types
 */
export function formatIndianPhoneDisplay(raw: string): string {
  const digits = extractIndianPhoneDigits(raw);
  if (!digits) return '';
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
}
