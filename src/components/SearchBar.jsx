import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * SearchBar — searches stars, planets, constellations, and deep sky objects.
 * Supports all 8 languages via i18n keys.
 * When a result is selected, navigates the sky view to that object.
 */

// Planet catalog with multilingual names for search
const PLANETS = [
    { id: 'Sun', emoji: '☀️', names: { en: 'Sun', es: 'Sol', fr: 'Soleil', de: 'Sonne', it: 'Sole', pt: 'Sol', ja: '太陽', zh: '太阳' } },
    { id: 'Moon', emoji: '🌙', names: { en: 'Moon', es: 'Luna', fr: 'Lune', de: 'Mond', it: 'Luna', pt: 'Lua', ja: '月', zh: '月亮' } },
    { id: 'Mercury', emoji: '🪨', names: { en: 'Mercury', es: 'Mercurio', fr: 'Mercure', de: 'Merkur', it: 'Mercurio', pt: 'Mercúrio', ja: '水星', zh: '水星' } },
    { id: 'Venus', emoji: '🌟', names: { en: 'Venus', es: 'Venus', fr: 'Vénus', de: 'Venus', it: 'Venere', pt: 'Vênus', ja: '金星', zh: '金星' } },
    { id: 'Mars', emoji: '🔴', names: { en: 'Mars', es: 'Marte', fr: 'Mars', de: 'Mars', it: 'Marte', pt: 'Marte', ja: '火星', zh: '火星' } },
    { id: 'Jupiter', emoji: '🟤', names: { en: 'Jupiter', es: 'Júpiter', fr: 'Jupiter', de: 'Jupiter', it: 'Giove', pt: 'Júpiter', ja: '木星', zh: '木星' } },
    { id: 'Saturn', emoji: '💍', names: { en: 'Saturn', es: 'Saturno', fr: 'Saturne', de: 'Saturn', it: 'Saturno', pt: 'Saturno', ja: '土星', zh: '土星' } },
    { id: 'Uranus', emoji: '🔵', names: { en: 'Uranus', es: 'Urano', fr: 'Uranus', de: 'Uranus', it: 'Urano', pt: 'Urano', ja: '天王星', zh: '天王星' } },
    { id: 'Neptune', emoji: '🔷', names: { en: 'Neptune', es: 'Neptuno', fr: 'Neptune', de: 'Neptun', it: 'Nettuno', pt: 'Netuno', ja: '海王星', zh: '海王星' } },
];

// Well-known deep sky objects (Messier + some NGC)
const DEEP_SKY = [
    { id: 'M1', name: 'Crab Nebula', ra: 5.575, dec: 22.017, type: 'nebula' },
    { id: 'M13', name: 'Hercules Cluster', ra: 16.695, dec: 36.460, type: 'cluster' },
    { id: 'M31', name: 'Andromeda Galaxy', ra: 0.712, dec: 41.269, type: 'galaxy' },
    { id: 'M42', name: 'Orion Nebula', ra: 5.588, dec: -5.391, type: 'nebula' },
    { id: 'M45', name: 'Pleiades', ra: 3.787, dec: 24.117, type: 'cluster' },
    { id: 'M51', name: 'Whirlpool Galaxy', ra: 13.500, dec: 47.195, type: 'galaxy' },
    { id: 'M57', name: 'Ring Nebula', ra: 18.893, dec: 33.029, type: 'nebula' },
    { id: 'M81', name: "Bode's Galaxy", ra: 9.927, dec: 69.065, type: 'galaxy' },
    { id: 'M101', name: 'Pinwheel Galaxy', ra: 14.054, dec: 54.349, type: 'galaxy' },
    { id: 'M104', name: 'Sombrero Galaxy', ra: 12.667, dec: -11.623, type: 'galaxy' },
    { id: 'NGC869', name: 'Double Cluster', ra: 2.322, dec: 57.133, type: 'cluster' },
    { id: 'NGC7000', name: 'North America Nebula', ra: 20.988, dec: 44.333, type: 'nebula' },
];

const DSO_EMOJI = { nebula: '🌀', galaxy: '🌌', cluster: '✨' };

/**
 * Get real-time RA/Dec for a solar system body using astronomy-engine.
 */
function getPlanetCoords(bodyId) {
    try {
        const now = new Date();
        if (bodyId === 'Moon') {
            const equ = Astronomy.Equator('Moon', now, new Astronomy.Observer(0, 0, 0), true, true);
            return equ ? { ra: equ.ra, dec: equ.dec } : null;
        }
        const equ = Astronomy.Equator(bodyId, now, new Astronomy.Observer(0, 0, 0), true, true);
        return equ ? { ra: equ.ra, dec: equ.dec } : null;
    } catch {
        return null;
    }
}

export default function SearchBar() {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const lang = i18n.language?.split('-')[0] || 'en';

    const starData = useAppStore((s) => s.starData);
    const constellationData = useAppStore((s) => s.constellationData);
    const setSelectedStar = useAppStore((s) => s.setSelectedStar);
    const setSearchTarget = useAppStore((s) => s.setSearchTarget);

    const results = useMemo(() => {
        if (!query || query.length < 1) return [];

        const q = query.toLowerCase().trim();
        const items = [];

        // Search planets (all languages)
        const matchingPlanets = PLANETS.filter((p) => {
            // Match English name, current language name, and body ID
            return Object.values(p.names).some(n => n.toLowerCase().includes(q)) ||
                   p.id.toLowerCase().includes(q);
        }).slice(0, 4).map((p) => {
            const coords = getPlanetCoords(p.id);
            const displayName = p.names[lang] || p.names.en;
            return {
                type: 'planet',
                name: displayName,
                subtitle: p.id !== displayName ? p.id : '',
                emoji: p.emoji,
                data: coords ? { ra: coords.ra, dec: coords.dec, name: displayName } : null,
            };
        }).filter(p => p.data);
        items.push(...matchingPlanets);

        // Search deep sky objects
        if (q.length >= 1) {
            const matchingDSO = DEEP_SKY.filter((d) =>
                d.id.toLowerCase().includes(q) ||
                d.name.toLowerCase().includes(q)
            ).slice(0, 4).map((d) => ({
                type: 'dso',
                name: d.name,
                subtitle: d.id,
                emoji: DSO_EMOJI[d.type] || '🔭',
                data: { ra: d.ra, dec: d.dec, name: d.name },
            }));
            items.push(...matchingDSO);
        }

        // Search stars
        if (starData && q.length >= 2) {
            const matchingStars = starData
                .filter((s) =>
                    (s.proper && s.proper.toLowerCase().includes(q)) ||
                    (s.bayer && s.bayer.toLowerCase().includes(q))
                )
                .slice(0, 6)
                .map((s) => ({
                    type: 'star',
                    name: s.proper || s.bayer || `Star ${s.id}`,
                    subtitle: s.bayer || '',
                    emoji: '⭐',
                    data: s,
                }));
            items.push(...matchingStars);
        }

        // Search constellations
        if (constellationData && q.length >= 2) {
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
                .slice(0, 4)
                .map((c) => ({
                    type: 'constellation',
                    name: t(`constellations.${c.id}`, c.name),
                    subtitle: c.id,
                    emoji: '◇',
                    data: c,
                }));
            items.push(...matchingCons);
        }

        return items.slice(0, 12);
    }, [query, starData, constellationData, t, lang]);

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

    const typeStyles = {
        planet: 'bg-amber-500/20 text-amber-300',
        dso: 'bg-purple-500/20 text-purple-300',
        star: 'bg-cosmos-highlight/20 text-cosmos-highlight',
        constellation: 'bg-cosmos-accent/20 text-cosmos-accent',
    };

    const typeLabels = {
        planet: t('search.planet', 'Planet'),
        dso: t('search.deepSky', 'Deep Sky'),
        star: t('search.star', 'Star'),
        constellation: t('search.constellation', 'Constellation'),
    };

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
                    placeholder={t('controls.searchPlaceholder', 'Search stars, planets, galaxies...')}
                    className="w-full bg-transparent border border-cosmos-border rounded-lg pl-9 pr-3 py-2 text-sm text-cosmos-text placeholder:text-cosmos-muted/50 focus:border-cosmos-accent transition-colors"
                    aria-label={t('controls.search', 'Search')}
                    role="combobox"
                    aria-expanded={isOpen && results.length > 0}
                    aria-autocomplete="list"
                />
            </div>

            {isOpen && results.length > 0 && (
                <ul
                    className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-lg overflow-hidden z-50 max-h-72 overflow-y-auto"
                    role="listbox"
                >
                    {results.map((item, idx) => (
                        <li key={`${item.type}-${idx}`}>
                            <button
                                onClick={() => handleSelect(item)}
                                className="w-full px-3 py-2.5 text-left hover:bg-cosmos-accent/10 transition-colors flex items-center gap-2.5"
                                role="option"
                            >
                                <span className="text-sm flex-shrink-0">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-cosmos-text truncate">{item.name}</div>
                                    {item.subtitle && (
                                        <div className="text-[10px] text-cosmos-muted">{item.subtitle}</div>
                                    )}
                                </div>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${typeStyles[item.type]}`}>
                                    {typeLabels[item.type]}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && query.length >= 1 && results.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-lg p-3 z-50">
                    <p className="text-xs text-cosmos-muted text-center">
                        {t('search.noResults', 'No results found for')} "{query}"
                    </p>
                </div>
            )}
        </div>
    );
}
