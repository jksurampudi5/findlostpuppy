import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { BreedAvatarFallback } from '../utils/breedAssetHelper';
import './PetProfileSelector.css';

export interface SelectorOption {
  id: string;
  label: string;
  secondaryLabel?: string;
  avatarUrl?: string;
  icon?: React.ReactNode;
  swatchColor?: string;
  swatchBorder?: string;
  letter?: string;
}

export interface PetProfileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: SelectorOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  showAlphabetScrubber?: boolean;
}

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const PetProfileSelector: React.FC<PetProfileSelectorProps> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchable = false,
  searchPlaceholder = 'Search...',
  showAlphabetScrubber = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string>('#');
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Reset search query and focus when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveLetter('#');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.secondaryLabel && opt.secondaryLabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Map of letters to the first option starting with that letter
  const letterTargetMap = useMemo(() => {
    const map = new Map<string, string>();
    filteredOptions.forEach((opt) => {
      const firstChar = opt.letter || opt.label.charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(firstChar) ? firstChar : '#';
      if (!map.has(key)) {
        map.set(key, opt.id);
      }
    });
    return map;
  }, [filteredOptions]);

  // Scroll to first item starting with letter
  const handleLetterClick = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveLetter(letter);
    const targetId = letterTargetMap.get(letter);
    if (targetId) {
      const targetElement = itemRefs.current.get(targetId);
      if (targetElement && listRef.current) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSelect = (val: string) => {
    onSelect(val);
    onClose();
  };

  const handleImageError = (id: string) => {
    setFailedAvatars((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="pet-selector-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="pet-selector-modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="pet-selector-header">
          <h3 className="pet-selector-title">{title}</h3>
          <button
            type="button"
            className="pet-selector-close-btn"
            onClick={onClose}
            aria-label="Close selector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        {searchable && (
          <div className="pet-selector-search-wrap">
            <div className="pet-selector-search-box">
              <Search size={16} className="pet-selector-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="pet-selector-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="pet-selector-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="pet-selector-content">
          {/* Options List */}
          <div className="pet-selector-list" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected =
                  selectedValue.toLowerCase() === opt.id.toLowerCase() ||
                  selectedValue.toLowerCase() === opt.label.toLowerCase();

                return (
                  <button
                    key={opt.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(opt.id, el);
                      else itemRefs.current.delete(opt.id);
                    }}
                    type="button"
                    className={`pet-selector-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.id)}
                  >
                    {/* Visual: Avatar / Swatch / Icon */}
                    {opt.avatarUrl && !failedAvatars.has(opt.id) ? (
                      <img
                        src={opt.avatarUrl}
                        alt={opt.label}
                        className="pet-selector-item-avatar"
                        onError={() => handleImageError(opt.id)}
                      />
                    ) : opt.avatarUrl || (showAlphabetScrubber && !opt.icon && !opt.swatchColor) ? (
                      <BreedAvatarFallback name={opt.label} size={36} />
                    ) : opt.swatchColor ? (
                      <div
                        className="pet-selector-item-swatch"
                        style={{
                          background: opt.swatchColor,
                          border: opt.swatchBorder || '1px solid rgba(255,255,255,0.15)',
                        }}
                      />
                    ) : opt.icon ? (
                      <div className="pet-selector-item-icon">{opt.icon}</div>
                    ) : null}

                    {/* Text Label & Secondary */}
                    <div className="pet-selector-item-text">
                      <span className="pet-selector-item-label">{opt.label}</span>
                      {opt.secondaryLabel && (
                        <span className="pet-selector-item-sublabel">{opt.secondaryLabel}</span>
                      )}
                    </div>

                    {/* Selection Checkmark */}
                    {isSelected && <Check size={18} className="pet-selector-item-check" />}
                  </button>
                );
              })
            ) : (
              <div className="pet-selector-empty">
                <p>No results found for "{searchQuery}"</p>
                {searchable && searchQuery.trim() && (
                  <button
                    type="button"
                    className="pet-selector-use-custom-btn"
                    onClick={() => handleSelect(searchQuery.trim())}
                  >
                    Use "{searchQuery.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Alphabet Scrubber */}
          {showAlphabetScrubber && (
            <div className="pet-selector-scrubber" aria-label="Alphabet jump rail">
              {ALPHABET.map((letter) => {
                const hasMatches = letterTargetMap.has(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`pet-selector-letter-btn ${
                      activeLetter === letter ? 'active' : ''
                    } ${!hasMatches ? 'disabled' : ''}`}
                    onClick={(e) => handleLetterClick(letter, e)}
                    disabled={!hasMatches}
                    title={`Jump to ${letter}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
