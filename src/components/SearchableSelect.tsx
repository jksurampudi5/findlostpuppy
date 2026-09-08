import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check, Loader2 } from 'lucide-react';
import './SearchableSelect.css';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  meta?: any;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  allowCustom?: boolean;
  onCustomLocation?: (customName: string) => void;
  required?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  loading = false,
  icon,
  allowCustom = false,
  onCustomLocation,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected Option
  const selectedOption = useMemo(() => {
    return options.find(
      (opt) =>
        opt.value.toLowerCase() === value.toLowerCase() ||
        opt.label.toLowerCase() === value.toLowerCase()
    );
  }, [options, value]);

  // Filtered Options (Capped at top 100 for instant UI responsiveness)
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options.slice(0, 100);
    const query = search.trim().toLowerCase();
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          (opt.subLabel && opt.subLabel.toLowerCase().includes(query))
      )
      .slice(0, 100);
  }, [options, search]);

  // Total matching count for hint
  const totalMatches = useMemo(() => {
    if (!search.trim()) return options.length;
    const query = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(query))
    ).length;
  }, [options, search]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearch('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    setIsOpen(!isOpen);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustom && search.trim() && onCustomLocation) {
          onCustomLocation(search.trim());
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: SelectOption) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      className={`searchable-select-container ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        className={`searchable-select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <div className="searchable-select-trigger-content">
          {icon && <span className="searchable-select-icon">{icon}</span>}
          {selectedOption ? (
            <span className="searchable-select-value">{selectedOption.label}</span>
          ) : value ? (
            <span className="searchable-select-value">{value}</span>
          ) : (
            <span className="searchable-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="searchable-select-actions">
          {loading ? (
            <Loader2 size={16} className="spin text-terracotta" />
          ) : (
            <>
              {value && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="searchable-select-clear-btn"
                  onClick={handleClear}
                  title="Clear selection"
                  aria-label="Clear selection"
                >
                  <X size={14} />
                </span>
              )}
              <span className="searchable-select-chevron">
                <ChevronDown size={16} />
              </span>
            </>
          )}
        </div>
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="searchable-select-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="searchable-select-menu" role="listbox">
          {/* Search Input */}
          <div className="searchable-select-search-wrap">
            <Search size={16} className="searchable-select-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              aria-label={searchPlaceholder}
            />
            {search && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Options List */}
          {loading ? (
            <div className="searchable-select-loading">
              <Loader2 size={20} className="spin text-terracotta" />
              <span>Loading locations...</span>
            </div>
          ) : filteredOptions.length > 0 ? (
            <ul className="searchable-select-list" ref={listRef}>
              {filteredOptions.map((opt, idx) => {
                const isSelected =
                  opt.value.toLowerCase() === value.toLowerCase() ||
                  opt.label.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    className={`searchable-select-item ${
                      isSelected ? 'is-selected' : ''
                    } ${isHighlighted ? 'is-focused' : ''}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="searchable-select-item-text">
                      <span className="searchable-select-item-label">
                        {opt.label}
                      </span>
                      {opt.subLabel && (
                        <span className="searchable-select-item-sub">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="searchable-select-item-check" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="searchable-select-empty">
              <span>No locations found matching "{search}"</span>
              {allowCustom && search.trim() && onCustomLocation && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    onCustomLocation(search.trim());
                    setIsOpen(false);
                  }}
                  style={{ marginTop: '0.4rem' }}
                >
                  Use "{search.trim()}" as custom location
                </button>
              )}
            </div>
          )}

          {/* Total match count hint */}
          {totalMatches > 100 && (
            <div className="searchable-select-count-hint">
              Showing top 100 of {totalMatches} results. Type to filter...
            </div>
          )}

          {/* Optional separate custom location footer */}
          {allowCustom && onCustomLocation && (
            <div className="searchable-select-custom-footer">
              <span>Can't find your location?</span>
              <button
                type="button"
                className="searchable-select-custom-btn"
                onClick={() => {
                  const custom = prompt('Enter custom location:');
                  if (custom && custom.trim()) {
                    onCustomLocation(custom.trim());
                    setIsOpen(false);
                  }
                }}
              >
                + Add custom
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
