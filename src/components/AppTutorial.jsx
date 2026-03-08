import React, { useState } from 'react';

/**
 * AppTutorial — Elegant interactive guide showing all app features.
 * Displays as a modal overlay with animated sections.
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
        title: 'Navigation Controls',
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
            { icon: '⭐', text: 'Stars — Over 5,000 real stars from the HYG catalog with accurate positions, colors, and magnitudes.' },
            { icon: '🌌', text: 'Milky Way — Photorealistic galactic band with dust lanes, H-alpha regions, and galactic bulge.' },
            { icon: '♈', text: 'Ecliptic & Zodiac — The Sun\'s path across the sky with 12 zodiac constellation symbols.' },
            { icon: '🧭', text: 'Constellation Lines & Names — 48 IAU constellations with connecting lines and labels.' },
            { icon: '📐', text: 'Equatorial Grid / Alt-Az Grid — Coordinate overlays for precise positioning.' },
            { icon: '🪐', text: 'Planets — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn with real-time positions.' },
            { icon: '🌠', text: 'Deep Sky Objects — 17 famous nebulae, galaxies, and clusters (M42, M31, Pleiades, etc.).' },
            { icon: '🛰️', text: 'Satellites — ISS and satellite tracking overlay.' },
            { icon: '💫', text: 'Shooting Stars — Random meteor streaks with glowing trails.' },
            { icon: '🏔️', text: 'Ground Landscape — Terrain silhouette at the horizon.' },
            { icon: '🌅', text: 'Aurora Borealis — Northern lights simulation.' },
        ],
    },
    {
        icon: '🚀',
        title: 'Special Features',
        items: [
            { icon: '☀️', text: 'Solar System Orrery — Interactive 3D model with real planet positions and orbit lines.' },
            { icon: '🌟', text: 'Tonight\'s Best Objects — AI-scored recommendations for what to observe tonight.' },
            { icon: '📷', text: 'Star Trails — Long-exposure astrophotography simulation.' },
            { icon: '🌙', text: 'Moon Dashboard — Current phase, next eclipse predictions, moonrise/moonset times.' },
            { icon: '🔭', text: 'Sky Events — Upcoming meteor showers, eclipses, and conjunctions.' },
            { icon: '🛸', text: 'NASA Picture of the Day — Daily space image from NASA\'s APOD API.' },
            { icon: '📜', text: 'Constellation Mythology — Myths, notable stars, and viewing tips for major constellations.' },
            { icon: '🎓', text: 'AstroQuiz — Duolingo-style astronomy course with XP, streaks, and 50 questions.' },
            { icon: '📸', text: 'Screenshot — Capture and save the current sky view as an image.' },
            { icon: '👁️', text: 'Night Vision — Red filter mode to preserve dark adaptation.' },
            { icon: '📱', text: 'Gyroscope Mode — Point your phone at the sky to see what\'s there!' },
            { icon: '🌐', text: 'Live Observatory Cameras — View the real sky from observatories around the world.' },
        ],
    },
    {
        icon: '📱',
        title: 'Install as App',
        items: [
            { icon: '📲', text: 'CosmosView is a Progressive Web App (PWA). Install it on your phone or desktop for offline access!' },
            { icon: '🍎', text: 'iOS: Tap Share → "Add to Home Screen".' },
            { icon: '🤖', text: 'Android: Tap the install banner or Menu → "Install App".' },
            { icon: '💻', text: 'Desktop: Click the install icon in your browser\'s address bar.' },
        ],
    },
];

export default function AppTutorial({ open, onClose }) {
    const [activeSection, setActiveSection] = useState(0);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,20,40,0.97), rgba(10,15,30,0.98))',
                    border: '1px solid rgba(100,140,255,0.15)',
                    boxShadow: '0 0 60px rgba(80,120,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
            >
                {/* Header */}
                <div
                    className="p-6 pb-4"
                    style={{ borderBottom: '1px solid rgba(100,140,255,0.1)' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-3xl">🔭</span>
                                CosmosView Guide
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Everything you need to explore the cosmos
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Section tabs */}
                    <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
                        {TUTORIAL_SECTIONS.map((section, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveSection(i)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                                style={{
                                    background: activeSection === i ? 'rgba(100,140,255,0.2)' : 'transparent',
                                    color: activeSection === i ? '#93b5ff' : '#8899bb',
                                    border: activeSection === i ? '1px solid rgba(100,140,255,0.3)' : '1px solid transparent',
                                }}
                            >
                                <span>{section.icon}</span>
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)' }}>
                    <div className="space-y-2.5">
                        {TUTORIAL_SECTIONS[activeSection].items.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(100,140,255,0.06)',
                                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
                                }}
                            >
                                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                                <p className="text-sm text-gray-300 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Navigation dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {TUTORIAL_SECTIONS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveSection(i)}
                                className="w-2 h-2 rounded-full transition-all"
                                style={{
                                    background: activeSection === i ? '#93b5ff' : 'rgba(100,140,255,0.2)',
                                    width: activeSection === i ? '20px' : '8px',
                                }}
                            />
                        ))}
                    </div>

                    {/* Tip at bottom */}
                    <div
                        className="mt-4 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(100,140,255,0.06)',
                            border: '1px solid rgba(100,140,255,0.1)',
                        }}
                    >
                        <p className="text-xs text-gray-400">
                            💡 <strong className="text-gray-300">Pro Tip:</strong> Use the time slider to see how the sky changes throughout the night. Set speed to 360× to watch constellations rise and set!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
