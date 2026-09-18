import React from 'react';
import sonuImg from '../assets/sonu.jpg';
import { POPULAR_DOG_BREEDS } from '../data/dogBreeds';

export interface BreedItem {
  id: string;
  name: string;
  avatarUrl?: string;
  letter: string;
}

// Local avatar overrides for approved dogs
const BREED_AVATARS: Record<string, string> = {
  'Golden Retriever': sonuImg,
};

// Safe color swatches for dog coat colors
export const DOG_COLOR_SWATCHES: Record<string, { bg: string; border?: string }> = {
  'Golden / Fawn': { bg: '#E5A65E' },
  'Black': { bg: '#1A1B1E', border: 'rgba(255,255,255,0.25)' },
  'White / Cream': { bg: '#F5F5F0', border: 'rgba(0,0,0,0.15)' },
  'Brown / Chocolate': { bg: '#6B3E26' },
  'Black & Tan': { bg: 'linear-gradient(135deg, #1A1B1E 50%, #B87333 50%)' },
  'Tri-Color (Black, White & Tan)': {
    bg: 'linear-gradient(135deg, #1A1B1E 33%, #F5F5F0 33%, #F5F5F0 66%, #B87333 66%)',
    border: 'rgba(255,255,255,0.2)',
  },
  'Brindle (Tiger Stripes)': {
    bg: 'repeating-linear-gradient(45deg, #2B1E16, #2B1E16 3px, #B87333 3px, #B87333 7px)',
  },
  'Spotted / Piebald': {
    bg: 'radial-gradient(circle, #1A1B1E 35%, #F5F5F0 36%)',
    border: 'rgba(255,255,255,0.2)',
  },
  'Red / Ginger / Rust': { bg: '#C04000' },
  'Grey / Silver / Blue': { bg: '#7E8B9B' },
  'Other / Mixed Colors...': {
    bg: 'conic-gradient(#E5A65E, #1A1B1E, #6B3E26, #F5F5F0, #E5A65E)',
  },
};

/**
 * Returns alphabetically sorted breed items with first letter for alphabet scrubber indexing
 */
export const getAllBreedItems = (): BreedItem[] => {
  return POPULAR_DOG_BREEDS.map((name) => {
    const firstChar = name.charAt(0).toUpperCase();
    const isLetter = /^[A-Z]$/.test(firstChar);
    return {
      id: name,
      name,
      avatarUrl: BREED_AVATARS[name] || undefined,
      letter: isLetter ? firstChar : '#',
    };
  });
};

/**
 * Clean Dog Silhouette / Avatar SVG fallback
 */
export const BreedAvatarFallback: React.FC<{ name: string; size?: number }> = ({
  name,
  size = 36,
}) => {
  // Generate consistent subtle accent hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 36); // warm earthy / amber tones 0-36
  const bg = `hsl(${22 + hue}, 35%, 18%)`;

  return (
    <div
      className="breed-avatar-fallback"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(255, 121, 0, 0.25)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
      }}
      aria-label={`Breed avatar for ${name}`}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFB066"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 5.172a2 2 0 0 0-3.414-1.414l-3.871 3.87A1 1 0 0 0 2.414 9H4v5a2 2 0 0 0 2 2h1" />
        <path d="M14 5.172a2 2 0 0 1 3.414-1.414l3.871 3.87A1 1 0 0 1 21.586 9H20v5a2 2 0 0 1-2 2h-1" />
        <circle cx="9" cy="10" r="1" fill="#FFB066" />
        <circle cx="15" cy="10" r="1" fill="#FFB066" />
        <path d="M10 14a2 2 0 0 0 4 0" />
        <path d="M12 11.5v1" />
      </svg>
    </div>
  );
};
