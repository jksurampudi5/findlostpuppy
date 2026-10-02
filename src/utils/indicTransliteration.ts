/**
 * Indic to English Transliteration and Normalization Utility
 *
 * Automatically converts non-Latin Indic scripts (Telugu, Devanagari, Kannada, etc.)
 * into clean, readable English / Latin text for location fields (street, village, mandal, district).
 */

export function hasNonLatinScript(text?: string): boolean {
  if (!text) return false;
  // Matches Indic Unicode blocks: Devanagari (0900), Bengali (0980), Gurmukhi (0A00),
  // Gujarati (0A80), Oriya (0B00), Tamil (0B80), Telugu (0C00), Kannada (0C80), Malayalam (0D00)
  return /[\u0900-\u0D7F]/.test(text);
}

const TELUGU_EXACT_PLACES: Record<string, string> = {
  'కర్రావారిసవరం': 'Karravarisavaram',
  'ఉండ్రాజవరం': 'Undrajavaram',
  'తణుకు': 'Tanuku',
  'రాజమండ్రి': 'Rajahmundry',
  'రాజమహేంద్రవరం': 'Rajahmundry',
  'కాకినాడ': 'Kakinada',
  'విజయవాడ': 'Vijayawada',
  'విశాఖపట్నం': 'Visakhapatnam',
  'హైదరాబాద్': 'Hyderabad',
  'సికింద్రాబాద్': 'Secunderabad',
  'తిరుపతి': 'Tirupati',
  'గుంటూరు': 'Guntur',
  'నెల్లూరు': 'Nellore',
  'కర్నూలు': 'Kurnool',
  'కడప': 'Kadapa',
  'అనంతపురం': 'Anantapur',
  'ఏలూరు': 'Eluru',
  'ఒంగోలు': 'Ongole',
  'చిత్తూరు': 'Chittoor',
  'శ్రీకాకుళం': 'Srikakulam',
  'విజయనగరం': 'Vizianagaram',
  'తాడేపల్లిగూడెం': 'Tadepalligudem',
  'పాలకొల్లు': 'Palakollu',
  'భీమవరం': 'Bhimavaram',
  'అమలాపురం': 'Amalapuram',
  'మచిలీపట్నం': 'Machilipatnam',
  'తెనాలి': 'Tenali',
  'మంగళగిరి': 'Mangalagiri',
  'నరసరావుపేట': 'Narasaraopet',
  'బాపట్ల': 'Bapatla',
  'ఖమ్మం': 'Khammam',
  'వరంగల్': 'Warangal',
  'కరీంనగర్': 'Karimnagar',
  'నిజామాబాద్': 'Nizamabad',
  'నల్గొండ': 'Nalgonda',
  'మహబూబ్‌నగర్': 'Mahabubnagar',
};

const TELUGU_COMMON_WORDS: Array<[RegExp, string]> = [
  [/మెయిన్/gi, 'Main'],
  [/రోడ్(డు)?/gi, 'Road'],
  [/వీధి|వీది/gi, 'Street'],
  [/నగర్/gi, 'Nagar'],
  [/కాలనీ|కాలని/gi, 'Colony'],
  [/బజార్/gi, 'Bazaar'],
  [/గల్లీ|గల్లి/gi, 'Lane'],
  [/చౌరస్తా/gi, 'Chowrasta'],
  [/సెంటర్/gi, 'Center'],
  [/జంక్షన్/gi, 'Junction'],
  [/సర్కిల్/gi, 'Circle'],
  [/శివాలయం/gi, 'Sivalayam'],
  [/రైల్వే/gi, 'Railway'],
  [/స్టేషన్/gi, 'Station'],
  [/పాలెం/gi, 'Palem'],
  [/పురం/gi, 'Puram'],
  [/పల్లె|పల్లి/gi, 'Palle'],
  [/పేట/gi, 'Peta'],
  [/గూడెం/gi, 'Gudem'],
  [/చెరువు/gi, 'Cheruvu'],
  [/తోట/gi, 'Thota'],
  [/కొండ/gi, 'Konda'],
  [/వాడ/gi, 'Vada'],
  [/కోట/gi, 'Kota'],
];

function getTeluguAnusvaraSound(nextCode: number): string {
  // If next is dental (త-న: 0x0C24-0x0C28), retroflex (ట-ణ: 0x0C1F-0x0C23),
  // palatal (చ-ఝ: 0x0C1A-0x0C1D), velar (క-ఘ: 0x0C15-0x0C18)
  if (
    (nextCode >= 0x0c15 && nextCode <= 0x0c18) ||
    (nextCode >= 0x0c1a && nextCode <= 0x0c1d) ||
    (nextCode >= 0x0c1f && nextCode <= 0x0c23) ||
    (nextCode >= 0x0c24 && nextCode <= 0x0c28) ||
    nextCode === 0x0c36 ||
    nextCode === 0x0c37 ||
    nextCode === 0x0c38
  ) {
    return 'n';
  }
  return 'm';
}

export function transliterateTeluguToEnglish(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (TELUGU_EXACT_PLACES[trimmed]) {
    return TELUGU_EXACT_PLACES[trimmed];
  }

  let working = trimmed;
  for (const [pattern, replacement] of TELUGU_COMMON_WORDS) {
    working = working.replace(pattern, ` ${replacement} `);
  }

  // Replace exact place tokens inside phrase
  for (const [teluguPlace, englishPlace] of Object.entries(TELUGU_EXACT_PLACES)) {
    if (working.includes(teluguPlace)) {
      working = working.replace(new RegExp(teluguPlace, 'g'), ` ${englishPlace} `);
    }
  }

  const vowels: Record<number, string> = {
    0x0c05: 'a',
    0x0c06: 'a',
    0x0c07: 'i',
    0x0c08: 'i',
    0x0c09: 'u',
    0x0c0a: 'u',
    0x0c0b: 'ru',
    0x0c0e: 'e',
    0x0c0f: 'e',
    0x0c10: 'ai',
    0x0c12: 'o',
    0x0c13: 'o',
    0x0c14: 'au',
  };
  const matras: Record<number, string> = {
    0x0c3e: 'a',
    0x0c3f: 'i',
    0x0c40: 'i',
    0x0c41: 'u',
    0x0c42: 'u',
    0x0c43: 'ru',
    0x0c46: 'e',
    0x0c47: 'e',
    0x0c48: 'ai',
    0x0c4a: 'o',
    0x0c4b: 'o',
    0x0c4c: 'au',
  };
  const consonants: Record<number, string> = {
    0x0c15: 'k',
    0x0c16: 'kh',
    0x0c17: 'g',
    0x0c18: 'gh',
    0x0c19: 'ng',
    0x0c1a: 'ch',
    0x0c1b: 'chh',
    0x0c1c: 'j',
    0x0c1d: 'jh',
    0x0c1e: 'ny',
    0x0c1f: 't',
    0x0c20: 'th',
    0x0c21: 'd',
    0x0c22: 'dh',
    0x0c23: 'n',
    0x0c24: 't',
    0x0c25: 'th',
    0x0c26: 'd',
    0x0c27: 'dh',
    0x0c28: 'n',
    0x0c2a: 'p',
    0x0c2b: 'ph',
    0x0c2c: 'b',
    0x0c2d: 'bh',
    0x0c2e: 'm',
    0x0c2f: 'y',
    0x0c30: 'r',
    0x0c31: 'r',
    0x0c32: 'l',
    0x0c33: 'l',
    0x0c35: 'v',
    0x0c36: 'sh',
    0x0c37: 'sh',
    0x0c38: 's',
    0x0c39: 'h',
  };

  let out = '';
  for (let i = 0; i < working.length; i++) {
    const code = working.charCodeAt(i);
    if (vowels[code]) {
      const nextCode = i + 1 < working.length ? working.charCodeAt(i + 1) : 0;
      if (nextCode === 0x0c02) {
        const afterAnusvara = i + 2 < working.length ? working.charCodeAt(i + 2) : 0;
        out += vowels[code] + getTeluguAnusvaraSound(afterAnusvara);
        i++;
      } else {
        out += vowels[code];
      }
    } else if (consonants[code]) {
      const c = consonants[code];
      const nextCode = i + 1 < working.length ? working.charCodeAt(i + 1) : 0;
      if (nextCode === 0x0c4d) {
        out += c;
        i++; // skip virama
      } else if (matras[nextCode]) {
        const afterMatra = i + 2 < working.length ? working.charCodeAt(i + 2) : 0;
        if (afterMatra === 0x0c02) {
          const afterAnusvara = i + 3 < working.length ? working.charCodeAt(i + 3) : 0;
          out += c + matras[nextCode] + getTeluguAnusvaraSound(afterAnusvara);
          i += 2;
        } else {
          out += c + matras[nextCode];
          i++;
        }
      } else if (nextCode === 0x0c02) {
        const afterAnusvara = i + 2 < working.length ? working.charCodeAt(i + 2) : 0;
        out += c + 'a' + getTeluguAnusvaraSound(afterAnusvara);
        i++;
      } else {
        out += c + 'a';
      }
    } else if (code === 0x0c02) {
      const nextCode = i + 1 < working.length ? working.charCodeAt(i + 1) : 0;
      out += getTeluguAnusvaraSound(nextCode);
    } else {
      out += working[i];
    }
  }

  return out
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const DEVANAGARI_COMMON: Array<[RegExp, string]> = [
  [/मार्ग|रोड/gi, 'Road'],
  [/गली/gi, 'Gully'],
  [/चौक/gi, 'Chowk'],
  [/नगर/gi, 'Nagar'],
  [/कॉलोनी|कालोनी/gi, 'Colony'],
  [/बाजार/gi, 'Bazaar'],
  [/स्टेशन/gi, 'Station'],
  [/गांधी/gi, 'Gandhi'],
  [/शांति/gi, 'Shanti'],
  [/मुख्य/gi, 'Main'],
];

export function transliterateDevanagariToEnglish(text: string): string {
  let working = text.trim();
  for (const [pattern, replacement] of DEVANAGARI_COMMON) {
    working = working.replace(pattern, ` ${replacement} `);
  }

  const vowels: Record<number, string> = {
    0x0905: 'a',
    0x0906: 'a',
    0x0907: 'i',
    0x0908: 'i',
    0x0909: 'u',
    0x090a: 'u',
    0x090b: 'ri',
    0x090f: 'e',
    0x0910: 'ai',
    0x0913: 'o',
    0x0914: 'au',
  };
  const matras: Record<number, string> = {
    0x093e: 'a',
    0x093f: 'i',
    0x0940: 'i',
    0x0941: 'u',
    0x0942: 'u',
    0x0943: 'ri',
    0x0947: 'e',
    0x0948: 'ai',
    0x094b: 'o',
    0x094c: 'au',
  };
  const consonants: Record<number, string> = {
    0x0915: 'k',
    0x0916: 'kh',
    0x0917: 'g',
    0x0918: 'gh',
    0x0919: 'ng',
    0x091a: 'ch',
    0x091b: 'chh',
    0x091c: 'j',
    0x091d: 'jh',
    0x091e: 'ny',
    0x091f: 't',
    0x0920: 'th',
    0x0921: 'd',
    0x0922: 'dh',
    0x0923: 'n',
    0x0924: 't',
    0x0925: 'th',
    0x0926: 'd',
    0x0927: 'dh',
    0x0928: 'n',
    0x092a: 'p',
    0x092b: 'ph',
    0x092c: 'b',
    0x092d: 'bh',
    0x092e: 'm',
    0x092f: 'y',
    0x0930: 'r',
    0x0932: 'l',
    0x0933: 'l',
    0x0935: 'v',
    0x0936: 'sh',
    0x0937: 'sh',
    0x0938: 's',
    0x0939: 'h',
  };

  let out = '';
  for (let i = 0; i < working.length; i++) {
    const code = working.charCodeAt(i);
    if (vowels[code]) {
      out += vowels[code];
    } else if (consonants[code]) {
      const c = consonants[code];
      const nextCode = i + 1 < working.length ? working.charCodeAt(i + 1) : 0;
      if (nextCode === 0x094d) {
        out += c;
        i++;
      } else if (matras[nextCode]) {
        out += c + matras[nextCode];
        i++;
      } else if (nextCode === 0x0902) {
        out += c + 'an';
        i++;
      } else {
        out += c + 'a';
      }
    } else if (code === 0x0902) {
      out += 'n';
    } else {
      out += working[i];
    }
  }

  return out
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const KANNADA_COMMON: Array<[RegExp, string]> = [
  [/ಮುಖ್ಯ\s*ರಸ್ತೆ/gi, 'Main Road'],
  [/ರಸ್ತೆ/gi, 'Road'],
  [/ಬಡಾವಣೆ/gi, 'Layout'],
  [/ನಗರ/gi, 'Nagar'],
  [/ಕಾಲೋನಿ|ಕಾಲೊನಿ/gi, 'Colony'],
  [/ವೃತ್ತ/gi, 'Circle'],
  [/ಸಂತೆ/gi, 'Bazaar'],
  [/ಪಾಳ್ಯ/gi, 'Palya'],
  [/ಪುರ/gi, 'Pura'],
  [/ಹಳ್ಳಿ/gi, 'Halli'],
  [/ಕೆರೆ/gi, 'Kere'],
];

export function transliterateKannadaToEnglish(text: string): string {
  let working = text.trim();
  for (const [pattern, replacement] of KANNADA_COMMON) {
    working = working.replace(pattern, ` ${replacement} `);
  }

  // Shift Kannada characters (U+0C80..U+0CFF) by -0x80 to correspond to Telugu
  let teluguShifted = '';
  for (let i = 0; i < working.length; i++) {
    const code = working.charCodeAt(i);
    if (code >= 0x0c80 && code <= 0x0cff) {
      teluguShifted += String.fromCharCode(code - 0x80);
    } else {
      teluguShifted += working[i];
    }
  }

  return transliterateTeluguToEnglish(teluguShifted);
}

/**
 * Normalizes any text string into English:
 * - If text is already Latin/English, returns trimmed text untouched.
 * - If text contains Indic characters, transliterates and checks optional known localities for exact match.
 */
export function normalizeToEnglishText(text?: string, knownLocalities?: string[]): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (!hasNonLatinScript(trimmed)) {
    return trimmed;
  }

  let candidate = '';
  if (/[\u0C00-\u0C7F]/.test(trimmed)) {
    candidate = transliterateTeluguToEnglish(trimmed);
  } else if (/[\u0C80-\u0CFF]/.test(trimmed)) {
    candidate = transliterateKannadaToEnglish(trimmed);
  } else if (/[\u0900-\u097F]/.test(trimmed)) {
    candidate = transliterateDevanagariToEnglish(trimmed);
  } else {
    // Other Indic scripts: general fallback transliterating Telugu equivalents
    candidate = transliterateTeluguToEnglish(trimmed);
  }

  // If known localities are provided, check for a match
  if (knownLocalities && knownLocalities.length > 0) {
    const candidateLower = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = knownLocalities.find((loc) => {
      const locClean = loc.toLowerCase().replace(/[^a-z0-9]/g, '');
      return locClean === candidateLower || locClean.includes(candidateLower) || candidateLower.includes(locClean);
    });
    if (matched) {
      return matched;
    }
  }

  return candidate;
}
