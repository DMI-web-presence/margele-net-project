'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

type Locality = {
  n: string; // name
  j: string; // county
};

type CityAutocompleteInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectCity: (city: string, county: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
};

// Global cache for dataset to avoid re-fetching across mounts
let cachedLocalities: Locality[] | null = null;

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i');
};

export default function CityAutocompleteInput({
  value,
  onChange,
  onSelectCity,
  placeholder = 'Alege orasul...',
  className = '',
  id,
  name,
  required = false,
}: CityAutocompleteInputProps) {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [suggestions, setSuggestions] = useState<Locality[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load localities dataset
  useEffect(() => {
    if (cachedLocalities) {
      setLocalities(cachedLocalities);
      return;
    }

    fetch('/localitati.json')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedLocalities = data;
          setLocalities(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load localities dataset:', err);
      });
  }, []);

  // Filter suggestions when value changes
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || localities.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const queryNorm = normalizeString(trimmed);
    const matches: Locality[] = [];

    for (let i = 0; i < localities.length; i++) {
      const loc = localities[i];
      const nameNorm = normalizeString(loc.n);
      
      // Match query within locality name
      if (nameNorm.includes(queryNorm)) {
        matches.push(loc);
        if (matches.length >= 8) break; // Limit to max 8 suggestions
      }
    }

    setSuggestions(matches);
    setIsOpen(matches.length > 0);
    setActiveIndex(-1);
  }, [value, localities]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = activeIndex >= 0 ? activeIndex : 0;
      const selected = suggestions[index];
      if (selected) {
        onSelectCity(selected.n, selected.j);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= 3 && suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={className}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl outline-none animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.map((loc, index) => {
            const isHighlighted = index === activeIndex;
            return (
              <li
                key={`${loc.n}-${loc.j}-${index}`}
                onMouseDown={(e) => {
                  // Prevent input blur before selection completes
                  e.preventDefault();
                  onSelectCity(loc.n, loc.j);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-2 text-base transition-colors ${
                  isHighlighted ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                }`}
              >
                <span>{loc.n}</span>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                  {loc.j}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
