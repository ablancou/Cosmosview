import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * Autocomplete search bar for stars and constellations.
 */
export default function SearchBar() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const starData = useAppStore((s) => s.starData);
    const constellationData = useAppStore((s) => s.constellationData);
    const setSelectedStar = useAppStore((s) => s.setSelectedStar);
    const setSearchTarget = useAppStore((s) => s.setSearchTarget);

    const results = useMemo(() => {
        if (!query || query.length < 2) return [];

        const q = query.toLowerCase();
        const items = [];

        // Search stars
        if (starData) {
            const matchingStars = starData
                .filter((s) =>
                    (s.proper && s.proper.toLowerCase().includes(q)) ||
                    (s.bayer && s.bayer.toLowerCase().includes(q))
                )
                .slice(0, 8)
                .map((s) => ({
                    type: 'star',
                    name: s.proper || s.bayer || `Star ${s.id}`,
                    subtitle: s.bayer || '',
                    data: s,
                }));
            items.push(...matchingStars);
        }

        // Search constellations
        if (constellationData) {
            const constellations = constellationData.constellations || [];
            const matchingCons = constellations
                .filter((c) => {
                    const translatedName = t(`constellations.${c.id}`, c.name);
                    return (
                        c.name.toLowerCase().includes(q) ||
                        c.id.toLowerCase().includes(q) ||
                        translatedName.toLowerCase().includes(q)
                    );
                })
                .slice(0, 5)
                .map((c) => ({
                    type: 'constellation',
                    name: t(`constellations.${c.id}`, c.name),
                    subtitle: c.id,
                    data: c,
                }));
            items.push(...matchingCons);
        }

        return items;
    }, [query, starData, constellationData, t]);

    const handleSelect = (item) => {
        if (item.type === 'star') {
            setSelectedStar(item.data);
        }
        setSearchTarget(item.data);
        setQuery('');
        setIsOpen(false);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmos-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={t('controls.searchPlaceholder')}
                    className="w-full bg-transparent border border-cosmos-border rounded-lg pl-9 pr-3 py-2 text-sm text-cosmos-text placeholder:text-cosmos-muted/50 focus:border-cosmos-accent transition-colors"
                    aria-label={t('controls.search')}
                    role="combobox"
                    aria-expanded={isOpen && results.length > 0}
                    aria-autocomplete="list"
                />
            </div>

            {isOpen && results.length > 0 && (
                <ul
                    className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-lg overflow-hidden z-50 max-h-60 overflow-y-auto"
                    role="listbox"
                >
                    {results.map((item, idx) => (
                        <li key={`${item.type}-${idx}`}>
                            <button
                                onClick={() => handleSelect(item)}
                                className="w-full px-3 py-2 text-left hover:bg-cosmos-accent/10 transition-colors flex items-center gap-2"
                                role="option"
                            >
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.type === 'star'
                                        ? 'bg-cosmos-highlight/20 text-cosmos-highlight'
                                        : 'bg-cosmos-accent/20 text-cosmos-accent'
                                    }`}>
                                    {item.type === 'star' ? '★' : '◇'}
                                </span>
                                <div>
                                    <div className="text-sm text-cosmos-text">{item.name}</div>
                                    {item.subtitle && (
                                        <div className="text-[10px] text-cosmos-muted">{item.subtitle}</div>
                                    )}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
