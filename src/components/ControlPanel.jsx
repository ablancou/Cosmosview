import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import TimeControls from './TimeControls';
import LayerToggles from './LayerToggles';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import SearchBar from './SearchBar';
import cityList from '../utils/cityList';

/**
 * Responsive control panel:
 * - Desktop: Floating glassmorphism panel on the left (320px)
 * - Portrait mobile: Collapsible bottom sheet
 * - Landscape mobile: 35% side panel
 */
export default function ControlPanel() {
    const { t } = useTranslation();
    const controlPanelOpen = useAppStore((s) => s.controlPanelOpen);
    const toggleControlPanel = useAppStore((s) => s.toggleControlPanel);
    const setControlPanelOpen = useAppStore((s) => s.setControlPanelOpen);
    const location = useAppStore((s) => s.location);
    const setLocation = useAppStore((s) => s.setLocation);
    const time = useAppStore((s) => s.time);
    const darkMode = useAppStore((s) => s.darkMode);

    const handleCityChange = (e) => {
        const city = cityList.find((c) => c.name === e.target.value);
        if (city) {
            setLocation(city.lat, city.lon, city.name);
        }
    };

    const formattedTime = time.current.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const formattedDate = time.current.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <>
            {/* Desktop Panel */}
            <div
                className={`
          hidden lg:flex flex-col
          fixed left-4 top-4 bottom-4 w-80
          glass-panel overflow-y-auto overflow-x-hidden
          animate-slide-right z-30
          ${darkMode ? '' : 'light'}
        `}
                role="complementary"
                aria-label={t('controls.title')}
            >
                <div className="p-5 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-2xl font-bold text-cosmos-accent">
                                {t('app.title')}
                            </h1>
                            <p className="text-xs text-cosmos-muted mt-0.5">
                                {t('app.subtitle')}
                            </p>
                        </div>
                        <DarkModeToggle />
                    </div>

                    <div className="h-px bg-cosmos-border" />

                    {/* Search */}
                    <SearchBar />

                    {/* Location */}
                    <section>
                        <h2 className="text-sm font-semibold text-cosmos-muted uppercase tracking-wider mb-2">
                            {t('controls.location')}
                        </h2>
                        <select
                            value={location.city}
                            onChange={handleCityChange}
                            className="w-full bg-transparent border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text focus:border-cosmos-accent transition-colors cursor-pointer"
                            aria-label={t('controls.selectCity')}
                        >
                            {cityList.map((city) => (
                                <option key={city.name} value={city.name} className="bg-cosmos-bg text-cosmos-text">
                                    {city.name}, {city.country}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-cosmos-muted mt-1">
                            {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                        </p>
                    </section>

                    <div className="h-px bg-cosmos-border" />

                    {/* Time */}
                    <section>
                        <h2 className="text-sm font-semibold text-cosmos-muted uppercase tracking-wider mb-2">
                            {t('controls.time')}
                        </h2>
                        <div className="text-lg font-mono text-cosmos-text">{formattedTime}</div>
                        <div className="text-xs text-cosmos-muted">{formattedDate}</div>
                        <TimeControls />

                        {/* Time-Lapse Speed */}
                        <div className="mt-3">
                            <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">
                                ⏩ Time-Lapse Speed
                            </div>
                            <div className="flex gap-1.5">
                                {[
                                    { speed: 1, label: '1×' },
                                    { speed: 10, label: '10×' },
                                    { speed: 60, label: '60×' },
                                    { speed: 360, label: '360×' },
                                ].map(({ speed, label }) => (
                                    <button
                                        key={speed}
                                        onClick={() => useAppStore.getState().setTimeSpeed(speed)}
                                        className={`flex-1 px-2 py-1 rounded text-xs font-mono transition-all ${time.speed === speed
                                                ? 'bg-cosmos-accent/20 text-cosmos-accent ring-1 ring-cosmos-accent/40'
                                                : 'bg-cosmos-border/20 text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-border/40'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {time.speed > 1 && (
                                <p className="text-[10px] text-cosmos-accent mt-1">
                                    ▶ {time.speed > 60 ? `${(time.speed / 60).toFixed(0)} min` : `${time.speed} sec`}/tick
                                </p>
                            )}
                        </div>
                    </section>

                    <div className="h-px bg-cosmos-border" />

                    {/* Layer Toggles */}
                    <section>
                        <h2 className="text-sm font-semibold text-cosmos-muted uppercase tracking-wider mb-2">
                            {t('controls.layers')}
                        </h2>
                        <LayerToggles />
                    </section>

                    <div className="h-px bg-cosmos-border" />

                    {/* Language */}
                    <section>
                        <h2 className="text-sm font-semibold text-cosmos-muted uppercase tracking-wider mb-2">
                            {t('settings.language')}
                        </h2>
                        <LanguageSwitcher />
                    </section>

                    {/* Credits */}
                    <div className="text-[10px] text-cosmos-muted pt-2 border-t border-cosmos-border">
                        <p>{t('about.starData')}</p>
                        <p>{t('about.astroEngine')}</p>
                        <p className="mt-1">{t('about.license')}</p>
                    </div>
                </div>
            </div>

            {/* Mobile Top Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-panel rounded-none px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-cosmos-accent font-display text-lg font-bold">CV</span>
                    <span className="text-xs text-cosmos-muted truncate max-w-24">{location.city}</span>
                </div>
                <div className="text-sm font-mono text-cosmos-text">{formattedTime}</div>
                <button
                    onClick={toggleControlPanel}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-cosmos-border transition-colors"
                    aria-label="Toggle menu"
                    aria-expanded={controlPanelOpen}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-cosmos-accent">
                        {controlPanelOpen ? (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        ) : (
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Bottom Sheet */}
            <div
                className={`
          lg:hidden fixed inset-x-0 bottom-0 z-30
          glass-panel rounded-t-2xl rounded-b-none
          transition-transform duration-400 ease-out
          max-h-[70vh] overflow-y-auto
          ${controlPanelOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
                role="dialog"
                aria-label={t('controls.title')}
                style={{ transitionDuration: '400ms' }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-cosmos-muted opacity-50" />
                </div>

                <div className="p-4 space-y-4 pb-8">
                    <SearchBar />

                    <section>
                        <h2 className="text-xs font-semibold text-cosmos-muted uppercase tracking-wider mb-1">
                            {t('controls.location')}
                        </h2>
                        <select
                            value={location.city}
                            onChange={handleCityChange}
                            className="w-full bg-transparent border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text"
                            aria-label={t('controls.selectCity')}
                        >
                            {cityList.map((city) => (
                                <option key={city.name} value={city.name} className="bg-cosmos-bg text-cosmos-text">
                                    {city.name}, {city.country}
                                </option>
                            ))}
                        </select>
                    </section>

                    <TimeControls />
                    <LayerToggles />

                    <div className="flex items-center justify-between">
                        <LanguageSwitcher />
                        <DarkModeToggle />
                    </div>
                </div>
            </div>

            {/* Mobile overlay when sheet is open */}
            {controlPanelOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 z-20"
                    onClick={() => setControlPanelOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
