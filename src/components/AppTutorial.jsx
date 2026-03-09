import React, { useState } from 'react';

/**
 * AppTutorial — Elegant interactive guide showing all app features.
 * Mobile-optimized with dropdown tab selector and swipe-friendly layout.
 */

const TUTORIAL_SECTIONS = [
    {
        icon: '🌍',
        title: 'Getting Started',
        items: [
            { icon: '📍', text: 'Your location is auto-detected. Change it with the city dropdown in the left panel.' },
            { icon: '🕐', text: 'Time is set to "now" by default. Use the slider to travel ±24 hours, or change the time-lapse speed (1×, 10×, 60×, 360×).' },
            { icon: '🌓', text: 'Toggle Dark Mode with the ☀️/🌙 button in the top-right of the control panel.' },
            { icon: '🔍', text: 'Search for any star or constellation using the search bar. The camera will fly to it automatically!' },
        ],
    },
    {
        icon: '🖱️',
        title: 'Controls',
        items: [
            { icon: '👆', text: 'Click & drag to rotate the sky view in any direction.' },
            { icon: '🔎', text: 'Scroll wheel to zoom in/out (15°–100° field of view).' },
            { icon: '📱', text: 'On mobile: pinch to zoom, swipe to rotate.' },
            { icon: '🔄', text: 'Enable Auto-Rotate (R) to slowly spin the sky.' },
            { icon: '⌨️', text: 'Keyboard shortcuts: N = Night Vision, R = Auto-Rotate, E = Events, M = Moon.' },
        ],
    },
    {
        icon: '🔭',
        title: 'Sky Layers',
        items: [
            { icon: '⭐', text: 'Stars — 100,000+ real and procedural stars with accurate colors and magnitudes.' },
            { icon: '🌌', text: 'Milky Way — Photorealistic galactic band with dust lanes and galactic bulge.' },
            { icon: '♈', text: 'Ecliptic & Zodiac — The Sun\'s path with 12 zodiac symbols.' },
            { icon: '🧭', text: 'Constellations — 48 IAU constellations with lines and labels.' },
            { icon: '📐', text: 'Coordinate Grids — Equatorial and Alt-Az overlays.' },
            { icon: '🪐', text: 'Planets — Sun, Moon, and 5 visible planets in real-time.' },
            { icon: '🌠', text: 'Deep Sky — 121 Messier + NGC objects (nebulae, galaxies, clusters).' },
            { icon: '🛰️', text: 'Satellites — ISS tracking overlay.' },
            { icon: '💫', text: 'Shooting Stars — Random meteor streaks.' },
            { icon: '🏔️', text: 'Ground — Terrain silhouette at the horizon.' },
            { icon: '🌅', text: 'Aurora — Northern lights simulation.' },
        ],
    },
    {
        icon: '🚀',
        title: 'Features',
        items: [
            { icon: '☀️', text: 'Solar System Orrery — Interactive 3D model with real planet positions.' },
            { icon: '🌟', text: 'Tonight\'s Best — Tap any recommended object to fly to it!' },
            { icon: '📷', text: 'Star Trails — Long-exposure astrophotography simulation.' },
            { icon: '🌙', text: 'Moon Dashboard — Phase, eclipses, moonrise/moonset.' },
            { icon: '🔭', text: 'Sky Events — Upcoming meteor showers, eclipses.' },
            { icon: '🛸', text: 'NASA APOD — Daily space image from NASA.' },
            { icon: '📜', text: 'Constellation Myths — Stories behind the constellations.' },
            { icon: '🎓', text: 'AstroQuiz — 50 questions, XP, streaks.' },
            { icon: '📹', text: 'AR Camera — Overlay stars on your phone camera.' },
            { icon: '🌐', text: 'Live Cameras — Observatory feeds worldwide.' },
        ],
    },
    {
        icon: '📱',
        title: 'Install',
        items: [
            { icon: '📲', text: 'CosmosView is a PWA. Install it on your phone for offline access!' },
            { icon: '🍎', text: 'iOS: Tap Share → "Add to Home Screen".' },
            { icon: '🤖', text: 'Android: Tap the install banner or Menu → "Install App".' },
            { icon: '💻', text: 'Desktop: Click the install icon in your browser\'s address bar.' },
        ],
    },
];

export default function AppTutorial({ open, onClose }) {
    const [activeSection, setActiveSection] = useState(0);

    if (!open) return null;

    const section = TUTORIAL_SECTIONS[activeSection];

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,20,40,0.97), rgba(10,15,30,0.98))',
                    border: '1px solid rgba(100,140,255,0.15)',
                    boxShadow: '0 0 60px rgba(80,120,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {/* Header */}
                <div
                    className="p-4 sm:p-6 pb-3"
                    style={{ borderBottom: '1px solid rgba(100,140,255,0.1)' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-2xl sm:text-3xl">🔭</span>
                                CosmosView Guide
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Everything you need to explore the cosmos
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Mobile: dropdown selector  •  Desktop: tab bar */}
                    {/* Dropdown — works perfectly on all screen sizes */}
                    <div className="mt-3 relative">
                        <select
                            value={activeSection}
                            onChange={(e) => setActiveSection(Number(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium appearance-none cursor-pointer"
                            style={{
                                background: 'rgba(100,140,255,0.12)',
                                color: '#93b5ff',
                                border: '1px solid rgba(100,140,255,0.2)',
                                outline: 'none',
                            }}
                        >
                            {TUTORIAL_SECTIONS.map((s, i) => (
                                <option key={i} value={i} style={{ background: '#0f1428', color: '#93b5ff' }}>
                                    {s.icon}  {s.title} ({s.items.length})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                            ▼
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 170px)' }}>
                    {/* Section title */}
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <span className="text-lg">{section.icon}</span>
                        {section.title}
                        <span className="text-[10px] text-gray-500">({activeSection + 1}/{TUTORIAL_SECTIONS.length})</span>
                    </h3>

                    <div className="space-y-2">
                        {section.items.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(100,140,255,0.06)',
                                    animation: `fadeIn 0.3s ease-out ${i * 0.04}s both`,
                                }}
                            >
                                <span className="text-lg sm:text-xl shrink-0 mt-0.5">{item.icon}</span>
                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Nav buttons */}
                    <div className="flex items-center justify-between mt-5">
                        <button
                            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                            disabled={activeSection === 0}
                            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: activeSection === 0 ? 'transparent' : 'rgba(100,140,255,0.1)',
                                color: activeSection === 0 ? '#555' : '#93b5ff',
                                border: activeSection === 0 ? '1px solid transparent' : '1px solid rgba(100,140,255,0.2)',
                            }}
                        >
                            ← Previous
                        </button>

                        {/* Dots */}
                        <div className="flex gap-1.5">
                            {TUTORIAL_SECTIONS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSection(i)}
                                    className="rounded-full transition-all"
                                    style={{
                                        background: activeSection === i ? '#93b5ff' : 'rgba(100,140,255,0.2)',
                                        width: activeSection === i ? '18px' : '6px',
                                        height: '6px',
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                if (activeSection === TUTORIAL_SECTIONS.length - 1) {
                                    onClose();
                                } else {
                                    setActiveSection(activeSection + 1);
                                }
                            }}
                            className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: activeSection === TUTORIAL_SECTIONS.length - 1 ? 'rgba(80,200,120,0.15)' : 'rgba(100,140,255,0.15)',
                                color: activeSection === TUTORIAL_SECTIONS.length - 1 ? '#50c878' : '#93b5ff',
                                border: `1px solid ${activeSection === TUTORIAL_SECTIONS.length - 1 ? 'rgba(80,200,120,0.3)' : 'rgba(100,140,255,0.25)'}`,
                            }}
                        >
                            {activeSection === TUTORIAL_SECTIONS.length - 1 ? '✓ Done' : 'Next →'}
                        </button>
                    </div>

                    {/* Pro tip */}
                    <div
                        className="mt-4 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(100,140,255,0.06)',
                            border: '1px solid rgba(100,140,255,0.1)',
                        }}
                    >
                        <p className="text-[11px] text-gray-400">
                            💡 <strong className="text-gray-300">Tip:</strong> Reopen this guide anytime with the ❓ button on the right side.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
