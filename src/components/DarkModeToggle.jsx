import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * Dark/Light mode toggle button with sun/moon icon.
 */
export default function DarkModeToggle() {
    const { t } = useTranslation();
    const darkMode = useAppStore((s) => s.darkMode);
    const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

    return (
        <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-cosmos-border hover:bg-cosmos-accent/10 transition-all duration-300"
            aria-label={darkMode ? t('settings.lightMode') : t('settings.darkMode')}
            title={darkMode ? t('settings.lightMode') : t('settings.darkMode')}
        >
            {darkMode ? (
                // Sun icon — switch to light mode
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cosmos-highlight transition-transform duration-300 hover:rotate-45">
                    <circle cx="12" cy="12" r="5" strokeWidth="2" />
                    <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2" strokeLinecap="round" />
                    <line x1="1" y1="12" x2="3" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="21" y1="12" x2="23" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ) : (
                // Moon icon — switch to dark mode
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cosmos-accent transition-transform duration-300 hover:-rotate-12">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}
