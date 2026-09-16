/**
 * Comprehensive list of dog breeds sorted in alphabetical order (A to Z)
 * Includes popular global breeds, Indian native breeds, and Street Dog / Desi / Indie.
 */
export const POPULAR_DOG_BREEDS: string[] = [
  'Akita',
  'Alaskan Malamute',
  'American Bully',
  'American Pit Bull Terrier',
  'Australian Cattle Dog',
  'Australian Shepherd',
  'Basset Hound',
  'Beagle',
  'Belgian Malinois',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Bloodhound',
  'Border Collie',
  'Boston Terrier',
  'Boxer',
  'Bull Terrier',
  'Bulldog (English)',
  'Bulldog (French)',
  'Cane Corso',
  'Cavalier King Charles Spaniel',
  'Chihuahua',
  'Chow Chow',
  'Cocker Spaniel',
  'Combai (Indian Native)',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'English Mastiff',
  'German Shepherd',
  'Golden Retriever',
  'Great Dane',
  'Great Pyrenees',
  'Greyhound',
  'Havanese',
  'Husky (Siberian)',
  'Indie / Desi Dog',
  'Irish Setter',
  'Jack Russell Terrier',
  'Kanni (Indian Native)',
  'Kombai',
  'Labrador Retriever',
  'Lhasa Apso',
  'Maltese',
  'Miniature Pinscher',
  'Miniature Schnauzer',
  'Mudhol Hound (Caravan Hound)',
  'Newfoundland',
  'Papillon',
  'Pekingese',
  'Pomeranian',
  'Poodle (Standard / Toy)',
  'Pug',
  'Rajapalayam (Indian Native)',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Samoyed',
  'Schnauzer',
  'Shih Tzu',
  'Siberian Husky',
  'Spitz (Indian Spitz)',
  'Spitz (Japanese Spitz)',
  'Staffordshire Bull Terrier',
  'Street Dog / Desi / Indie',
  'Street Dog (Indian Pariah Dog)',
  'Tibetan Mastiff',
  'Weimaraner',
  'Whippet',
  'Yorkshire Terrier',
  'Other / Mixed Breed',
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

/**
 * Filter breeds matching search query (case-insensitive substring match)
 */
export const searchDogBreeds = (query: string): string[] => {
  if (!query || !query.trim()) return POPULAR_DOG_BREEDS;
  const q = query.trim().toLowerCase();
  return POPULAR_DOG_BREEDS.filter((breed) => breed.toLowerCase().includes(q));
};

/**
 * Standard Age Options from 1 to 30
 */
export const DOG_AGE_OPTIONS: string[] = [
  '< 1 year (Puppy / Months)',
  ...Array.from({ length: 30 }, (_, i) => `${i + 1} ${i === 0 ? 'year' : 'years'}`),
  'Senior (15+ years)',
];

/**
 * Standard Dog Sizes
 */
export const DOG_SIZE_OPTIONS = [
  { value: 'Toy (< 5 kg)', label: '🐾 Toy (< 5 kg) - e.g. Chihuahua, Pomeranian' },
  { value: 'Small (5 - 10 kg)', label: '🐕 Small (5 - 10 kg) - e.g. Pug, Shih Tzu' },
  { value: 'Medium (10 - 25 kg)', label: '🐕‍🦺 Medium (10 - 25 kg) - e.g. Beagle, Indie' },
  { value: 'Large (25 - 40 kg)', label: '🦮 Large (25 - 40 kg) - e.g. Golden Retriever, Lab' },
  { value: 'Extra Large (> 40 kg)', label: '🦁 Extra Large (> 40 kg) - e.g. Great Dane, Mastiff' },
];

/**
 * Popular Coat Colors & Patterns
 */
export const DOG_COLOR_OPTIONS: string[] = [
  'Golden / Fawn',
  'Black',
  'White / Cream',
  'Brown / Chocolate',
  'Black & Tan',
  'Tri-Color (Black, White & Tan)',
  'Brindle (Tiger Stripes)',
  'Spotted / Piebald',
  'Red / Ginger / Rust',
  'Grey / Silver / Blue',
  'Other / Mixed Colors...',
];
