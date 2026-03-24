import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import SearchBar from './SearchBar';
import TimeControls from './TimeControls';
import LayerToggles from './LayerToggles';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import cityList from '../utils/cityList';

/* ══════════════════════════════════════════
   Menu Structure
   ══════════════════════════════════════════ */

const CATEGORIES = [
    { id: 'celestial', emoji: '🪐', label: 'Celestial', highlight: true },
    { id: 'explore', emoji: '⭐', label: 'Explore' },
    { id: 'search', emoji: '🔍', label: 'Search' },
    { id: 'tools', emoji: '🛠', label: 'Tools' },
    { id: 'learn', emoji: '🎓', label: 'Learn' },
    { id: 'settings', emoji: '⚙️', label: 'Settings' },
];

const SUB_ITEMS = {
    explore: [
        { id: 'tonight', emoji: '🌟', label: "Tonight's Best" },
        { id: 'events', emoji: '🔭', label: 'Sky Events' },
        { id: 'eventNotif', emoji: '🔔', label: 'Alerts & ISS' },
        { id: 'astroWeather', emoji: '🌤️', label: 'Sky Weather' },
        { id: 'apod', emoji: '🛸', label: 'NASA APOD' },
        { id: 'liveCams', emoji: '🌐', label: 'Live Cameras' },
    ],
    celestial: [
        { id: 'earthGlobe', emoji: '🌍', label: 'Earth Observatory', flagship: true },
        { id: 'moonGlobe', emoji: '🌕', label: 'Lunar Observatory', flagship: true },
        { id: 'moon', emoji: '🌙', label: 'Moon Data' },
        { id: 'orrery', emoji: '☀️', label: 'Solar System', flagship: true },
        { id: 'orbitalTracker', emoji: '📡', label: 'Orbital Tracking', flagship: true },
        { id: 'telescope', emoji: '🔭', label: 'Telescope' },
    ],
    tools: [
        { id: 'nightVision', emoji: '👁️', label: 'Night Vision', toggle: true },
        { id: 'screenshot', emoji: '📸', label: 'Screenshot', instant: true },
        { id: 'share', emoji: '🔗', label: 'Share Sky' },
        { id: 'arMode', emoji: '📹', label: 'AR Camera' },
        { id: 'starTrails', emoji: '📷', label: 'Star Trails', toggle: true },
        { id: 'autoRotate', emoji: '🔄', label: 'Auto-Rotate', toggle: true },
        { id: 'gyroscope', emoji: '📱', label: 'Gyroscope', toggle: true },
        { id: 'sound', emoji: '🎵', label: 'Sound', toggle: true },
        { id: 'photoPlanner', emoji: '🗓', label: 'Photo Plan' },
        { id: 'compare', emoji: '🌗', label: 'Compare' },
    ],
    learn: [
        { id: 'quiz', emoji: '🧠', label: 'AstroQuiz' },
        { id: 'tutorial', emoji: '❓', label: 'Guide' },
        { id: 'quickStart', emoji: '🚀', label: 'Quick Start' },
        { id: 'accessibility', emoji: '♿', label: 'Accessibility' },
    ],
};

/* ══════════════════════════════════════════
   ImmersiveNav Component
   ══════════════════════════════════════════ */

export default function ImmersiveNav({ onAction, activeStates = {} }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [btnVisible, setBtnVisible] = useState(true);
    const [dialReady, setDialReady] = useState(false);
    const hideTimer = useRef(null);

    // Store state
    const nightVision = useAppStore((s) => s.nightVision);
    const toggleNightVision = useAppStore((s) => s.toggleNightVision);
    const autoRotate = useAppStore((s) => s.autoRotate);
    const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate);
    const gyroscope = useAppStore((s) => s.gyroscope);
    const toggleGyroscope = useAppStore((s) => s.toggleGyroscope);
    const starTrails = useAppStore((s) => s.starTrails);
    const toggleStarTrails = useAppStore((s) => s.toggleStarTrails);
    const location = useAppStore((s) => s.location);
    const setLocation = useAppStore((s) => s.setLocation);
    const time = useAppStore((s) => s.time);
    const darkMode = useAppStore((s) => s.darkMode);

    const isAnythingOpen = menuOpen || !!activeCategory || settingsOpen || searchOpen;

    const toggleMap = {
        nightVision: { active: nightVision, fn: toggleNightVision },
        autoRotate: { active: autoRotate, fn: toggleAutoRotate },
        gyroscope: { active: gyroscope, fn: toggleGyroscope },
        starTrails: { active: starTrails, fn: toggleStarTrails },
        sound: { active: activeStates.sound, fn: () => onAction('toggleSound') },
    };

    /* ─── Auto-hide Logic ─── */
    const resetTimer = useCallback(() => {
        setBtnVisible(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setBtnVisible(false), 3000);
    }, []);

    useEffect(() => {
        const onMove = () => {
            if (!isAnythingOpen) resetTimer();
            else setBtnVisible(true);
        };
        window.addEventListener('touchstart', onMove, { passive: true });
        window.addEventListener('mousemove', onMove, { passive: true });
        resetTimer();
        return () => {
            window.removeEventListener('touchstart', onMove);
            window.removeEventListener('mousemove', onMove);
            clearTimeout(hideTimer.current);
        };
    }, [resetTimer, isAnythingOpen]);

    useEffect(() => {
        if (isAnythingOpen) {
            setBtnVisible(true);
            clearTimeout(hideTimer.current);
        }
    }, [isAnythingOpen]);

    /* ─── Speed-dial animation ─── */
    useEffect(() => {
        if (menuOpen) {
            setDialReady(false);
            requestAnimationFrame(() => requestAnimationFrame(() => setDialReady(true)));
        }
    }, [menuOpen]);

    /* ─── Handlers ─── */
    const closeAll = useCallback(() => {
        setMenuOpen(false);
        setActiveCategory(null);
        setSettingsOpen(false);
        setSearchOpen(false);
        setDialReady(false);
    }, []);

    const handleMainBtn = () => {
        if (isAnythingOpen) closeAll();
        else setMenuOpen(true);
    };

    const handleCategory = (id) => {
        if (id === 'search') {
            setMenuOpen(false);
            setSearchOpen(true);
        } else if (id === 'settings') {
            setMenuOpen(false);
            setSettingsOpen(true);
        } else {
            setMenuOpen(false);
            setActiveCategory(id);
        }
    };

    const handleSubItem = (item) => {
        if (item.toggle && toggleMap[item.id]) {
            toggleMap[item.id].fn();
            return;
        }
        if (item.instant) {
            onAction(item.id);
            return;
        }
        closeAll();
        onAction(item.id);
    };

    const handleCityChange = (e) => {
        const city = cityList.find((c) => c.name === e.target.value);
        if (city) setLocation(city.lat, city.lon, city.name);
    };

    /* Panel styles */
    const panelBg = darkMode ? 'rgba(12,14,28,0.96)' : 'rgba(245,240,232,0.96)';
    const panelBorder = darkMode ? 'rgba(126,184,247,0.12)' : 'rgba(26,26,46,0.15)';
    const panelStyle = {
        background: panelBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${panelBorder}`,
        borderRadius: '16px',
        boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
    };

    /* Speed-dial items displayed bottom-to-top (reversed so closest to FAB renders last in DOM) */
    const dialItems = useMemo(() => [...CATEGORIES].reverse(), []);

    return (
        <>
            {/* ═══ HUD Info Pill ═══ */}
            <div
                className="fixed top-3 left-3 z-20 pointer-events-none"
                style={{
                    opacity: btnVisible ? 0.85 : 0,
                    transition: 'opacity 0.7s ease',
                }}
            >
                <div
                    className="px-3 py-1.5 rounded-full flex items-center gap-2.5"
                    style={{
                        background: darkMode ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <span className="text-[10px]" style={{ opacity: 0.5 }}>📍</span>
                    <span className="text-[11px] font-medium" style={{ color: darkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)' }}>
                        {location.city}
                    </span>
                    <span className="w-px h-3" style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                    <span className="text-[11px] font-mono" style={{ color: darkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
                        {time.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* ═══ Floating Search Bar ═══ */}
            {searchOpen && (
                <div className="fixed top-3 left-3 right-3 z-[60] animate-slideUp">
                    <div className="max-w-md mx-auto p-3 rounded-2xl" style={panelStyle}>
                        <div className="flex items-center gap-2">
                            <div className="flex-1"><SearchBar /></div>
                            <button
                                onClick={() => setSearchOpen(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                                style={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M4 4l8 8M12 4l-8 8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Settings Panel ═══ */}
            {settingsOpen && (
                <div
                    className="fixed z-[55] overflow-y-auto overscroll-contain animate-slideUp"
                    style={{
                        ...panelStyle,
                        bottom: '80px',
                        right: '16px',
                        width: 'min(300px, calc(100vw - 32px))',
                        maxHeight: 'calc(100vh - 120px)',
                    }}
                >
                    <div className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-cosmos-accent uppercase tracking-wider">Settings</h3>
                            <button
                                onClick={() => setSettingsOpen(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-cosmos-muted hover:text-cosmos-text transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M4 4l8 8M12 4l-8 8" />
                                </svg>
                            </button>
                        </div>

                        {/* Location */}
                        <section>
                            <label className="text-[10px] text-cosmos-muted uppercase tracking-wider block mb-1">Location</label>
                            <select
                                value={location.city}
                                onChange={handleCityChange}
                                className="w-full bg-transparent border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text"
                            >
                                {cityList.map((c) => (
                                    <option key={c.name} value={c.name} style={{ background: darkMode ? '#0c0e1c' : '#f5f0e8' }}>
                                        {c.name}, {c.country}
                                    </option>
                                ))}
                            </select>
                        </section>

                        <div className="h-px bg-cosmos-border" />

                        {/* Time */}
                        <section>
                            <label className="text-[10px] text-cosmos-muted uppercase tracking-wider block mb-1">Time</label>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-base font-mono text-cosmos-text">
                                    {time.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-cosmos-muted">
                                    {time.current.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <TimeControls />
                            <div className="mt-2 flex gap-1">
                                {[1, 10, 60, 360].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => useAppStore.getState().setTimeSpeed(s)}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-mono transition-colors ${
                                            time.speed === s
                                                ? 'bg-cosmos-accent/20 text-cosmos-accent'
                                                : 'bg-cosmos-border/20 text-cosmos-muted hover:text-cosmos-text'
                                        }`}
                                    >
                                        {s}×
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="h-px bg-cosmos-border" />

                        {/* Layers */}
                        <section>
                            <label className="text-[10px] text-cosmos-muted uppercase tracking-wider block mb-1">Layers</label>
                            <LayerToggles />
                        </section>

                        <div className="h-px bg-cosmos-border" />

                        {/* Language & Theme */}
                        <div className="flex items-center justify-between">
                            <LanguageSwitcher />
                            <DarkModeToggle />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Sub-Item Panel ═══ */}
            {activeCategory && SUB_ITEMS[activeCategory] && (
                <div
                    className="fixed z-[55] animate-slideUp"
                    style={{
                        ...panelStyle,
                        bottom: '80px',
                        right: '16px',
                        width: 'min(280px, calc(100vw - 32px))',
                    }}
                >
                    <div className="p-3">
                        {/* Header with back */}
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={() => { setActiveCategory(null); setMenuOpen(true); }}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-cosmos-muted hover:text-cosmos-text hover:bg-cosmos-border/30 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 3L5 8l5 5" />
                                </svg>
                            </button>
                            <h3 className="text-xs font-bold text-cosmos-accent uppercase tracking-wider">
                                {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                            </h3>
                        </div>

                        {/* Grid of sub-items */}
                        <div className={`grid gap-2 ${SUB_ITEMS[activeCategory].length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {SUB_ITEMS[activeCategory].map((item) => {
                                const tgl = item.toggle && toggleMap[item.id];
                                const isActive = tgl && tgl.active;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSubItem(item)}
                                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 ${item.flagship ? 'ring-1 ring-amber-400/30' : ''}`}
                                        style={{
                                            background: isActive
                                                ? (darkMode ? 'rgba(126,184,247,0.15)' : 'rgba(74,144,217,0.15)')
                                                : item.flagship
                                                    ? (darkMode ? 'rgba(255,200,60,0.06)' : 'rgba(200,150,0,0.06)')
                                                    : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                                            border: `1px solid ${isActive
                                                ? (darkMode ? 'rgba(126,184,247,0.3)' : 'rgba(74,144,217,0.3)')
                                                : item.flagship
                                                    ? (darkMode ? 'rgba(255,200,60,0.15)' : 'rgba(200,150,0,0.15)')
                                                    : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)')
                                            }`,
                                        }}
                                    >
                                        <span className={`leading-none ${item.flagship ? 'text-2xl' : 'text-xl'}`}>{item.emoji}</span>
                                        <span
                                            className="text-[9px] mt-1.5 leading-tight text-center"
                                            style={{
                                                color: isActive
                                                    ? 'var(--color-cosmos-accent)'
                                                    : (darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Backdrop ═══ */}
            {isAnythingOpen && (
                <div
                    className="fixed inset-0 z-[44]"
                    onClick={closeAll}
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                />
            )}

            {/* ═══ Speed Dial Menu ═══
                Professional FAB speed-dial pattern:
                Items stack vertically above the main button.
                Each item = icon circle + floating label pill.
                Staggered spring animation, viewport-safe.
            ═══════════════════════════════════════ */}
            {menuOpen && (
                <div
                    className="fixed z-[46] flex flex-col-reverse items-end gap-2"
                    style={{
                        bottom: '80px',
                        right: '24px',
                    }}
                >
                    {dialItems.map((cat, reverseIdx) => {
                        const i = CATEGORIES.length - 1 - reverseIdx; // original index (0 = top)
                        const delayMs = reverseIdx * 45; // bottom items animate first (closest to FAB)

                        return (
                            <div
                                key={cat.id}
                                className="flex items-center gap-2.5"
                                style={{
                                    opacity: dialReady ? 1 : 0,
                                    transform: dialReady
                                        ? 'translateY(0) scale(1)'
                                        : 'translateY(16px) scale(0.7)',
                                    transition: `all 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
                                }}
                            >
                                {/* Label pill — slides in from right */}
                                <span
                                    className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap select-none pointer-events-none"
                                    style={{
                                        background: panelBg,
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        border: `1px solid ${panelBorder}`,
                                        color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                                        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
                                        opacity: dialReady ? 1 : 0,
                                        transform: dialReady ? 'translateX(0)' : 'translateX(12px)',
                                        transition: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 80}ms`,
                                    }}
                                >
                                    {cat.label}
                                </span>

                                {/* Icon circle */}
                                <button
                                    onClick={() => handleCategory(cat.id)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform ${cat.highlight ? 'ring-2 ring-amber-400/40' : ''}`}
                                    style={{
                                        background: cat.highlight
                                            ? (darkMode ? 'rgba(40,30,10,0.95)' : 'rgba(255,245,220,0.95)')
                                            : (darkMode ? 'rgba(12,14,28,0.92)' : 'rgba(245,240,232,0.95)'),
                                        backdropFilter: 'blur(16px)',
                                        WebkitBackdropFilter: 'blur(16px)',
                                        border: `1px solid ${cat.highlight ? 'rgba(255,200,60,0.25)' : panelBorder}`,
                                        boxShadow: cat.highlight
                                            ? '0 4px 20px rgba(255,200,60,0.15)'
                                            : '0 4px 20px rgba(0,0,0,0.3)',
                                    }}
                                    aria-label={cat.label}
                                >
                                    <span className={`leading-none ${cat.highlight ? 'text-xl' : 'text-lg'}`}>{cat.emoji}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ Main Floating Action Button ═══ */}
            <button
                onClick={handleMainBtn}
                className="fixed z-[46] rounded-full flex items-center justify-center"
                style={{
                    bottom: '24px',
                    right: '24px',
                    width: '48px',
                    height: '48px',
                    background: isAnythingOpen
                        ? (darkMode ? 'rgba(126,184,247,0.2)' : 'rgba(74,144,217,0.2)')
                        : (darkMode ? 'rgba(12,14,28,0.7)' : 'rgba(245,240,232,0.8)'),
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${isAnythingOpen
                        ? (darkMode ? 'rgba(126,184,247,0.3)' : 'rgba(74,144,217,0.3)')
                        : panelBorder
                    }`,
                    boxShadow: isAnythingOpen
                        ? '0 0 30px rgba(126,184,247,0.15)'
                        : '0 4px 24px rgba(0,0,0,0.3)',
                    opacity: btnVisible ? 1 : 0,
                    pointerEvents: btnVisible ? 'auto' : 'none',
                    transition: 'opacity 0.5s ease, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                }}
                aria-label={isAnythingOpen ? 'Close menu' : 'Open menu'}
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke={darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{
                        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                        transform: isAnythingOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                >
                    {isAnythingOpen ? (
                        <path d="M5 5L15 15M15 5L5 15" />
                    ) : (
                        <>
                            <line x1="4" y1="6" x2="16" y2="6" />
                            <line x1="4" y1="10" x2="16" y2="10" />
                            <line x1="4" y1="14" x2="16" y2="14" />
                        </>
                    )}
                </svg>
            </button>
        </>
    );
}
