import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

const LANGUAGES = [
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'it', flag: '🇮🇹', label: 'Italiano' },
    { code: 'pt', flag: '🇧🇷', label: 'Português' },
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
    { code: 'ja', flag: '🇯🇵', label: '日本語' },
    { code: 'zh', flag: '🇨🇳', label: '中文' },
];

/**
 * Compact language switcher with flag + code dropdown.
 */
export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const setLanguage = useAppStore((s) => s.setLanguage);

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

    const handleSelect = (lang) => {
        i18n.changeLanguage(lang.code);
        setLanguage(lang.code);
        localStorage.setItem('cosmosview-lang', lang.code);
        setIsOpen(false);
    };

    // Close on outside click
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-cosmos-border hover:bg-cosmos-accent/10 transition-colors text-sm"
                aria-label="Change language"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span>{currentLang.flag}</span>
                <span className="text-cosmos-text uppercase text-xs font-mono">{currentLang.code}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-cosmos-muted">
                    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
            </button>

            {isOpen && (
                <ul
                    className="absolute bottom-full mb-1 left-0 w-44 glass-panel rounded-lg overflow-hidden z-50"
                    role="listbox"
                    aria-label="Language selection"
                >
                    {LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                            <button
                                onClick={() => handleSelect(lang)}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-cosmos-accent/10 transition-colors ${lang.code === currentLang.code ? 'text-cosmos-accent' : 'text-cosmos-text'
                                    }`}
                                role="option"
                                aria-selected={lang.code === currentLang.code}
                            >
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                                <span className="text-[10px] text-cosmos-muted ml-auto uppercase font-mono">{lang.code}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
