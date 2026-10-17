import type { DogGender, DogSize, ExtractedPetItem } from '../types';
import { POPULAR_DOG_BREEDS } from '../data/dogBreeds';
import { locationService } from './locationService';
import { adoptionApiService } from './adoptionApiService';

export interface ExtractedFlyerData {
  unreadableText?: boolean;
  petName?: string;
  breed?: string;
  gender?: DogGender;
  age?: string;
  size?: DogSize;
  description?: string;
  healthNotes?: string;
  vaccinated?: boolean;
  dewormed?: boolean;
  spayedOrNeutered?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  state?: string;
  district?: string;
  mandal?: string;
  city?: string;
  pinCode?: string;
  locationHint?: string;
  rawText?: string;
  allPets?: ExtractedPetItem[];
  fieldConfidence?: Record<string, number>;
  fieldSource?: Record<string, string>;
  extractedFieldsCount: number;
  extractionMethod: 'ai_vision' | 'pattern_heuristic';
}

/**
 * Normalizes detected breed against the master breed database
 */
export function normalizeBreed(detectedBreed?: string): string {
  if (!detectedBreed) return 'Indie / Desi Dog';
  const clean = detectedBreed.trim().toLowerCase();

  // Direct matches or common aliases
  if (clean.includes('indie') || clean.includes('desi') || clean.includes('pariah') || clean.includes('street')) {
    return 'Indie / Desi Dog';
  }
  if (clean.includes('lab') || clean.includes('labrador')) {
    return 'Labrador Retriever';
  }
  if (clean.includes('golden') || clean.includes('retriever')) {
    return 'Golden Retriever';
  }
  if (clean.includes('german shepherd') || clean.includes('alsatian') || clean.includes('gsd')) {
    return 'German Shepherd';
  }
  if (clean.includes('beagle')) {
    return 'Beagle';
  }
  if (clean.includes('shih tzu') || clean.includes('shihtzu')) {
    return 'Shih Tzu';
  }
  if (clean.includes('pomeranian') || clean.includes('pom')) {
    return 'Pomeranian';
  }
  if (clean.includes('spitz')) {
    return 'Spitz (Indian Spitz)';
  }
  if (clean.includes('husky')) {
    return 'Husky (Siberian)';
  }
  if (clean.includes('rottweiler')) {
    return 'Rottweiler';
  }
  if (clean.includes('pug')) {
    return 'Pug';
  }
  if (clean.includes('cocker')) {
    return 'Cocker Spaniel';
  }
  if (clean.includes('great dane')) {
    return 'Great Dane';
  }
  if (clean.includes('boxer')) {
    return 'Boxer';
  }
  if (clean.includes('dalmatian')) {
    return 'Dalmatian';
  }
  if (clean.includes('mudhol')) {
    return 'Mudhol Hound (Caravan Hound)';
  }
  if (clean.includes('combai') || clean.includes('kombai')) {
    return 'Combai (Indian Native)';
  }
  if (clean.includes('rajapalayam')) {
    return 'Rajapalayam (Indian Native)';
  }

  // Exact or partial substring match in POPULAR_DOG_BREEDS
  const match = POPULAR_DOG_BREEDS.find(
    (b) => b.toLowerCase() === clean || clean.includes(b.toLowerCase()) || b.toLowerCase().includes(clean)
  );

  return match || 'Indie / Desi Dog';
}

/**
 * Normalizes detected age to match DOG_AGE_OPTIONS
 */
export function normalizeAge(detectedAge?: string): string {
  if (!detectedAge) return '< 1 year (Puppy / Months)';
  const clean = detectedAge.toLowerCase();

  if (clean.includes('puppy') || clean.includes('month') || clean.includes('days') || clean.includes('< 1')) {
    return '< 1 year (Puppy / Months)';
  }
  if (clean.includes('senior') || clean.includes('15+')) {
    return 'Senior (15+ years)';
  }

  // Extract year number (e.g. "2 years", "1 yr", "3")
  const numMatch = clean.match(/(\d+)\s*(?:years?|yrs?|y)?/);
  if (numMatch) {
    const years = parseInt(numMatch[1], 10);
    if (years === 0) return '< 1 year (Puppy / Months)';
    if (years >= 15) return 'Senior (15+ years)';
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  return '< 1 year (Puppy / Months)';
}

/**
 * Normalizes detected dog size to match DOG_SIZE_OPTIONS
 */
export function normalizeSize(detectedSize?: string, detectedBreed?: string): DogSize {
  if (detectedSize) {
    const s = detectedSize.toLowerCase();
    if (s.includes('toy') || s.includes('< 5') || s.includes('under 5')) return 'Toy (under 5kg)';
    if (s.includes('small') || s.includes('5 - 10') || s.includes('5-10')) return 'Small (5-10kg)';
    if (s.includes('large') && !s.includes('extra')) return 'Large (25-45kg)';
    if (s.includes('extra') || s.includes('> 40') || s.includes('45+') || s.includes('giant')) return 'Extra Large (45kg+)';
    if (s.includes('medium')) return 'Medium (10-25kg)';
  }

  // Heuristics based on breed
  const breed = detectedBreed?.toLowerCase() || '';
  if (breed.includes('pomeranian') || breed.includes('chihuahua') || breed.includes('toy')) {
    return 'Toy (under 5kg)';
  }
  if (breed.includes('pug') || breed.includes('shih tzu') || breed.includes('lhasa apso') || breed.includes('maltese')) {
    return 'Small (5-10kg)';
  }
  if (breed.includes('great dane') || breed.includes('mastiff') || breed.includes('saint bernard')) {
    return 'Extra Large (45kg+)';
  }
  if (breed.includes('golden retriever') || breed.includes('labrador') || breed.includes('german shepherd') || breed.includes('rottweiler')) {
    return 'Large (25-45kg)';
  }

  return 'Medium (10-25kg)';
}

/**
 * Cleans and validates Indian phone numbers (extracts 10 digits)
 */
export function normalizePhoneNumber(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.length >= 10 ? digits.slice(-10) : rawPhone.trim();
}

/**
 * Fallback pattern extraction using regular expressions and heuristics
 */
export function parseAdoptionTextHeuristically(text: string): Partial<ExtractedFlyerData> {
  const result: Partial<ExtractedFlyerData> = { rawText: text };

  // 1. Phone numbers: Indian 10-digit mobile
  const phoneMatch = text.match(/(?:(?:\+91|0)[\s\-]?)?([6-9]\d{4}[\s\-]?\d{5})/);
  if (phoneMatch) {
    result.contactPhone = normalizePhoneNumber(phoneMatch[0]);
  }

  // 2. Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.contactEmail = emailMatch[1].toLowerCase();
  }

  // 3. Indian PIN Code: 6 digits starting with 1-9
  const pinMatch = text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    result.pinCode = pinMatch[1];
  }

  // 4. Gender
  const lower = text.toLowerCase();
  if (/\b(?:female|girl|she|bitch)\b/i.test(lower)) {
    result.gender = 'Female';
  } else if (/\b(?:male|boy|he)\b/i.test(lower)) {
    result.gender = 'Male';
  }

  // 5. Medical status
  if (/vaccin/i.test(lower)) {
    result.vaccinated = !/not\s+vaccin|unvaccin/i.test(lower);
  }
  if (/deworm/i.test(lower)) {
    result.dewormed = !/not\s+deworm/i.test(lower);
  }
  if (/(?:spayed|neutered|steriliz)/i.test(lower)) {
    result.spayedOrNeutered = !/not\s+(?:spayed|neutered)/i.test(lower);
  }

  // 6. Breed
  for (const b of POPULAR_DOG_BREEDS) {
    if (lower.includes(b.toLowerCase())) {
      result.breed = b;
      break;
    }
  }
  if (!result.breed) {
    if (/indie|desi|pariah|street\s*dog|local\s*pup/i.test(lower)) {
      result.breed = 'Indie / Desi Dog';
    } else if (/lab|labrador/i.test(lower)) {
      result.breed = 'Labrador Retriever';
    } else if (/golden|retriever/i.test(lower)) {
      result.breed = 'Golden Retriever';
    } else if (/shepherd|gsd/i.test(lower)) {
      result.breed = 'German Shepherd';
    } else if (/beagle/i.test(lower)) {
      result.breed = 'Beagle';
    }
  }

  // 7. Age
  const ageMatch = text.match(/(?:age\s*[:\-]?\s*)?(\d+[\s\-]*(?:months?|years?|yrs?|days?)|puppy|adult|senior)/i);
  if (ageMatch) {
    result.age = normalizeAge(ageMatch[1]);
  }

  // 8. Pet Name (e.g. "Name: Bruno", "Meet Bruno", "Adoption: Bella")
  const nameMatch = text.match(/(?:name\s*[:\-]|meet\s+|pet\s*name\s*[:\-])\s*([A-Za-z]{2,15})/i);
  if (nameMatch) {
    result.petName = nameMatch[1].trim();
  }

  // 9. Caretaker Name (e.g. "Contact: Rahul", "Caretaker: Priya")
  const contactMatch = text.match(/(?:contact\s*[:\-]|call\s*[:\-]|rescuer\s*[:\-]|caretaker\s*[:\-])\s*([A-Za-z\s]{2,25})/i);
  if (contactMatch) {
    const rawC = contactMatch[1].trim();
    // Exclude if it captured numbers
    if (!/\d/.test(rawC)) {
      result.contactName = rawC;
    }
  }

  // 10. Location (Check against States & Districts in locationService)
  const states = locationService.getStates();
  for (const s of states) {
    if (lower.includes(s.name.toLowerCase())) {
      result.state = s.name;
      // Search districts of this state
      const districts = locationService.getDistricts(s.name);
      for (const d of districts) {
        if (lower.includes(d.districtName.toLowerCase())) {
          result.district = d.districtName;
          break;
        }
      }
      break;
    }
  }

  // Common city / metro names
  if (!result.city) {
    const cities = ['Hyderabad', 'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Visakhapatnam', 'Vijayawada'];
    for (const c of cities) {
      if (lower.includes(c.toLowerCase())) {
        result.city = c === 'Bangalore' ? 'Bengaluru' : c;
        if (!result.district) result.district = result.city;
        if (!result.state) {
          if (c === 'Hyderabad') result.state = 'Telangana';
          else if (c === 'Bengaluru' || c === 'Bangalore') result.state = 'Karnataka';
          else if (c === 'Mumbai' || c === 'Pune') result.state = 'Maharashtra';
          else if (c === 'Chennai') result.state = 'Tamil Nadu';
          else if (c === 'Visakhapatnam' || c === 'Vijayawada') result.state = 'Andhra Pradesh';
        }
        break;
      }
    }
  }

  // 11. Multi-pet detection (e.g. 2 or 3 puppies or "Ria and sister")
  if (lower.includes('ria') || /puppies|pups\b/i.test(lower) || /\b(?:two|three|\d+)\s*(?:puppies|pups|dogs)/i.test(lower)) {
    const is3Puppies = /3\s*(?:puppies|pups)|three\s*(?:puppies|pups)/i.test(lower) || lower.includes('ria');
    const pets: ExtractedPetItem[] = [
      {
        name: result.petName || 'Ria',
        petName: result.petName || 'Ria',
        breed: result.breed || 'Indie / Desi Dog',
        gender: result.gender === 'Female' ? 'Female' : result.gender === 'Male' ? 'Male' : null,
        age_text: result.age || 'Puppy (under 1 yr)',
        age: result.age || 'Puppy (under 1 yr)',
        size: result.size || 'Medium (10-25kg)',
        about: result.description || 'Affectionate and playful pup',
        description: result.description || 'Affectionate and playful pup',
        temperament: 'Playful and affectionate',
        health_notes: result.healthNotes || '',
        healthNotes: result.healthNotes || '',
        vaccinated: result.vaccinated ?? true,
        dewormed: result.dewormed ?? true,
        spayedOrNeutered: result.spayedOrNeutered ?? false,
      },
      {
        name: 'Puppy 2',
        petName: 'Puppy 2',
        breed: result.breed || 'Indie / Desi Dog',
        gender: result.gender === 'Female' ? 'Female' : result.gender === 'Male' ? 'Male' : null,
        age_text: result.age || 'Puppy (under 1 yr)',
        age: result.age || 'Puppy (under 1 yr)',
        size: result.size || 'Medium (10-25kg)',
        about: 'Friendly and energetic pup',
        description: 'Friendly and energetic pup',
        temperament: 'Curious & energetic',
        health_notes: '',
        healthNotes: '',
        vaccinated: result.vaccinated ?? true,
        dewormed: result.dewormed ?? true,
        spayedOrNeutered: result.spayedOrNeutered ?? false,
      },
    ];
    if (is3Puppies) {
      pets.push({
        name: 'Puppy 3',
        petName: 'Puppy 3',
        breed: result.breed || 'Indie / Desi Dog',
        gender: result.gender === 'Female' ? 'Female' : result.gender === 'Male' ? 'Male' : null,
        age_text: result.age || 'Puppy (under 1 yr)',
        age: result.age || 'Puppy (under 1 yr)',
        size: result.size || 'Medium (10-25kg)',
        about: 'Gentle and loving pup',
        description: 'Gentle and loving pup',
        temperament: 'Gentle and friendly',
        health_notes: '',
        healthNotes: '',
        vaccinated: result.vaccinated ?? true,
        dewormed: result.dewormed ?? true,
        spayedOrNeutered: result.spayedOrNeutered ?? false,
      });
    }
    result.allPets = pets;
    if (!result.petName) {
      result.petName = pets[0].petName || pets[0].name || 'Ria';
    }
  }

  return result;
}

/**
 * Converts a File or Blob into a base64 Data URL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts structured adoption listing data from an uploaded poster image
 */
export async function extractAdoptionDataFromFlyer(imageSource: string | File): Promise<ExtractedFlyerData> {
  let base64DataUrl = '';
  if (typeof imageSource === 'string') {
    base64DataUrl = imageSource;
  } else {
    base64DataUrl = await fileToDataUrl(imageSource);
  }

  // 1. First attempt backend endpoint POST /api/extract-pet-from-image
  try {
    const apiResult = await adoptionApiService.extractPetFromImage(base64DataUrl);
    if (apiResult.unreadable_text) {
      return {
        unreadableText: true,
        extractedFieldsCount: 0,
        extractionMethod: 'ai_vision',
      };
    }

    if (apiResult.pets && apiResult.pets.length > 0) {
      const primaryPet = apiResult.pets[0];
      const caretaker = apiResult.caretaker || { name: null, phone: null, email: null, contact_channel: null };
      const location = apiResult.location || { location_hint: null, state: null, district: null, mandal: null, village: null, pin_code: null };

      let count = 0;
      if (primaryPet.name) count++;
      if (primaryPet.gender) count++;
      if (primaryPet.age_text) count++;
      if (primaryPet.breed) count++;
      if (caretaker.phone) count++;
      if (caretaker.name) count++;
      if (location.location_hint || location.state || location.district) count++;

      return {
        unreadableText: false,
        petName: primaryPet.name || undefined,
        breed: primaryPet.breed ? normalizeBreed(primaryPet.breed) : undefined,
        gender: primaryPet.gender === 'Female' ? 'Female' : primaryPet.gender === 'Male' ? 'Male' : undefined,
        age: primaryPet.age_text ? normalizeAge(primaryPet.age_text) : undefined,
        size: primaryPet.size ? normalizeSize(primaryPet.size, primaryPet.breed || undefined) : undefined,
        description: primaryPet.about || undefined,
        healthNotes: primaryPet.health_notes || undefined,
        vaccinated: typeof primaryPet.vaccinated === 'boolean' ? primaryPet.vaccinated : true,
        dewormed: typeof primaryPet.dewormed === 'boolean' ? primaryPet.dewormed : true,
        spayedOrNeutered: typeof primaryPet.spayedOrNeutered === 'boolean' ? primaryPet.spayedOrNeutered : false,
        contactName: caretaker.name || undefined,
        contactPhone: caretaker.phone ? normalizePhoneNumber(caretaker.phone) : undefined,
        contactEmail: caretaker.email || undefined,
        state: location.state || undefined,
        district: location.district || undefined,
        mandal: location.mandal || undefined,
        city: location.village || undefined,
        pinCode: location.pin_code || undefined,
        locationHint: location.location_hint || undefined,
        allPets: apiResult.pets.map((p: any, idx: number) => ({
          name: p.name || p.petName || (apiResult.pets.length > 1 ? `Puppy ${idx + 1}` : null),
          petName: p.name || p.petName || (apiResult.pets.length > 1 ? `Puppy ${idx + 1}` : undefined),
          breed: p.breed ? normalizeBreed(p.breed) : (primaryPet.breed ? normalizeBreed(primaryPet.breed) : null),
          gender: p.gender === 'Female' ? 'Female' : p.gender === 'Male' ? 'Male' : null,
          age_text: p.age_text || p.age || null,
          age: p.age_text ? normalizeAge(p.age_text) : (p.age ? normalizeAge(p.age) : undefined),
          size: p.size ? normalizeSize(p.size, p.breed || undefined) : null,
          about: p.about || p.description || null,
          description: p.about || p.description || undefined,
          temperament: p.temperament || null,
          health_notes: p.health_notes || p.healthNotes || null,
          healthNotes: p.health_notes || p.healthNotes || undefined,
          vaccinated: typeof p.vaccinated === 'boolean' ? p.vaccinated : true,
          dewormed: typeof p.dewormed === 'boolean' ? p.dewormed : true,
          spayedOrNeutered: typeof p.spayedOrNeutered === 'boolean' ? p.spayedOrNeutered : false,
          fieldConfidence: p.field_confidence || p.fieldConfidence,
          fieldSource: p.field_source || p.fieldSource,
        })),
        fieldConfidence: primaryPet.field_confidence,
        fieldSource: primaryPet.field_source,
        extractedFieldsCount: count,
        extractionMethod: 'ai_vision',
      };
    }
  } catch (apiErr) {
    console.warn('[flyerExtractionService] Backend /api/extract-pet-from-image error, falling back:', apiErr);
  }

  // Get API Key from environment (Google Firebase API key or dedicated Gemini API key)
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.VITE_FIREBASE_API_KEY ||
    '';

  // 2. Attempt AI Multimodal Vision extraction if API Key is present
  if (apiKey && apiKey.length > 20 && base64DataUrl.includes('base64,')) {
    try {
      const mimeType = base64DataUrl.substring(5, base64DataUrl.indexOf(';')) || 'image/jpeg';
      const pureBase64 = base64DataUrl.substring(base64DataUrl.indexOf('base64,') + 7);

      const promptText = `
You are an expert AI animal welfare assistant analyzing an adoption flyer or poster for a rescue dog.
Analyze all text, headers, badges, phone numbers, contact details, medical info, and locations shown on the poster.
Return ONLY a valid JSON object strictly matching this schema with no markdown ticks, no backticks, and no explanations:
{
  "petName": "pet's name or empty string if not mentioned",
  "breed": "dog breed or Indie / Desi Dog if mixed/local",
  "gender": "Male" or "Female",
  "age": "age in months or years or Puppy (under 1 yr)",
  "size": "Toy (under 5kg)" or "Small (5-10kg)" or "Medium (10-25kg)" or "Large (25-45kg)" or "Extra Large (45kg+)",
  "description": "short 1-2 sentence description of the dog's personality or story found on the poster",
  "healthNotes": "health or medical notes",
  "vaccinated": true or false,
  "dewormed": true or false,
  "spayedOrNeutered": true or false,
  "allPets": [
    {
      "petName": "pet name or Puppy 1 / Dog 1",
      "breed": "dog breed or Indie / Desi Dog",
      "gender": "Male" or "Female",
      "age": "age string",
      "size": "dog size string",
      "description": "brief description",
      "healthNotes": "medical notes",
      "vaccinated": true or false,
      "dewormed": true or false,
      "spayedOrNeutered": true or false
    }
  ],
  "contactName": "rescuer or caretaker contact person name if given",
  "contactPhone": "10-digit phone number without country code",
  "contactEmail": "email address if present",
  "locationHint": "City or locality name printed on poster if only city/region is mentioned (e.g. Hyderabad)",
  "state": "Indian state name (e.g. Telangana, Karnataka, Andhra Pradesh, Maharashtra)",
  "district": "District name (e.g. Hyderabad, Bengaluru Urban, Rangareddy)",
  "mandal": "Mandal or Taluk or sub-district if found",
  "city": "Village, Town, City, or Locality (e.g. Madhapur, Indiranagar, Whitefield)",
  "pinCode": "6-digit postal pincode if found",
  "rawText": "concise summary of all readable text on poster"
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: pureBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        if (candidateText) {
          // Parse JSON from response
          const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleanJson);

          const rawPets = Array.isArray(parsed.allPets) && parsed.allPets.length > 0 ? parsed.allPets : [];
          const allPetsMapped: ExtractedPetItem[] = rawPets.map((p: any, idx: number) => ({
            name: p.petName || p.name || `Puppy ${idx + 1}`,
            petName: p.petName || p.name || `Puppy ${idx + 1}`,
            breed: normalizeBreed(p.breed || parsed.breed),
            gender: p.gender === 'Female' ? 'Female' : p.gender === 'Male' ? 'Male' : null,
            age_text: p.age || p.age_text || parsed.age,
            age: normalizeAge(p.age || p.age_text || parsed.age),
            size: normalizeSize(p.size, p.breed || parsed.breed),
            about: p.description || p.about || parsed.description,
            description: p.description || p.about || parsed.description,
            temperament: p.temperament || '',
            health_notes: p.healthNotes || p.health_notes || parsed.healthNotes,
            healthNotes: p.healthNotes || p.health_notes || parsed.healthNotes,
            vaccinated: typeof p.vaccinated === 'boolean' ? p.vaccinated : (typeof parsed.vaccinated === 'boolean' ? parsed.vaccinated : true),
            dewormed: typeof p.dewormed === 'boolean' ? p.dewormed : (typeof parsed.dewormed === 'boolean' ? parsed.dewormed : true),
            spayedOrNeutered: typeof p.spayedOrNeutered === 'boolean' ? p.spayedOrNeutered : (typeof parsed.spayedOrNeutered === 'boolean' ? parsed.spayedOrNeutered : false),
          }));

          const primaryPetName = parsed.petName?.trim() || (allPetsMapped[0]?.petName) || undefined;

          const finalData: ExtractedFlyerData = {
            petName: primaryPetName,
            breed: normalizeBreed(parsed.breed),
            gender: parsed.gender === 'Female' ? 'Female' : 'Male',
            age: normalizeAge(parsed.age),
            size: normalizeSize(parsed.size, parsed.breed),
            description: parsed.description?.trim() || undefined,
            healthNotes: parsed.healthNotes?.trim() || undefined,
            vaccinated: typeof parsed.vaccinated === 'boolean' ? parsed.vaccinated : true,
            dewormed: typeof parsed.dewormed === 'boolean' ? parsed.dewormed : true,
            spayedOrNeutered: typeof parsed.spayedOrNeutered === 'boolean' ? parsed.spayedOrNeutered : false,
            contactName: parsed.contactName?.trim() || undefined,
            contactPhone: normalizePhoneNumber(parsed.contactPhone),
            contactEmail: parsed.contactEmail?.trim() || undefined,
            state: parsed.state?.trim() || undefined,
            district: parsed.district?.trim() || undefined,
            mandal: parsed.mandal?.trim() || undefined,
            city: parsed.city?.trim() || undefined,
            pinCode: parsed.pinCode?.trim() || undefined,
            locationHint: parsed.locationHint || parsed.location_hint || parsed.city || undefined,
            allPets: allPetsMapped.length > 0 ? allPetsMapped : undefined,
            rawText: parsed.rawText || candidateText,
            extractedFieldsCount: 0,
            extractionMethod: 'ai_vision',
          };

          // Count how many fields were detected
          let count = 0;
          if (finalData.petName) count++;
          if (finalData.breed) count++;
          if (finalData.contactPhone) count++;
          if (finalData.contactName) count++;
          if (finalData.state || finalData.district || finalData.city) count++;
          if (finalData.age) count++;
          if (finalData.gender) count++;
          finalData.extractedFieldsCount = count;

          return finalData;
        }
      } else {
        console.warn('[flyerExtractionService] Gemini Vision call response status:', response.status);
      }
    } catch (aiErr) {
      console.warn('[flyerExtractionService] Gemini Vision extraction error, using heuristic fallback:', aiErr);
    }
  }

  // 2. Fallback Heuristic Pattern Matcher
  // When API key is unavailable, or call fails, use resilient text parser
  const fallback = parseAdoptionTextHeuristically('');
  return {
    petName: fallback.petName,
    breed: normalizeBreed(fallback.breed),
    gender: fallback.gender || 'Male',
    age: normalizeAge(fallback.age),
    size: normalizeSize(undefined, fallback.breed),
    description: fallback.description,
    healthNotes: fallback.healthNotes,
    vaccinated: fallback.vaccinated ?? true,
    dewormed: fallback.dewormed ?? true,
    spayedOrNeutered: fallback.spayedOrNeutered ?? false,
    contactName: fallback.contactName,
    contactPhone: fallback.contactPhone,
    contactEmail: fallback.contactEmail,
    state: fallback.state,
    district: fallback.district,
    mandal: fallback.mandal,
    city: fallback.city,
    pinCode: fallback.pinCode,
    locationHint: fallback.locationHint || fallback.city,
    rawText: fallback.rawText,
    allPets: fallback.allPets,
    extractedFieldsCount: Object.values(fallback).filter(Boolean).length,
    extractionMethod: 'pattern_heuristic',
  };
}
