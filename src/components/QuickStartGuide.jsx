import React, { useState } from 'react';

/**
 * QuickStartGuide — Interactive "Try This!" onboarding for first-time users.
 * Shows 6 impressive things users can do RIGHT NOW, with action buttons
 * that actually trigger the features.
 */

const SUGGESTIONS = [
    {
        emoji: '🌍',
        title: 'Earth Observatory',
        desc: 'A photorealistic 3D Earth with real-time satellite tracking — see the ISS, Hubble, Starlink, and 8,000+ satellites using real NORAD orbital data. Day/night cycle, cloud layer, atmosphere glow.',
        action: 'earthGlobe',
        actionLabel: '🌍 Launch Earth Observatory',
        color: '#4a90d9',
        flagship: true,
    },
    {
        emoji: '🌕',
        title: 'Lunar Observatory',
        desc: 'A 3D Moon with NASA surface imagery, real-time phase lighting calculated from astronomical algorithms, landing site markers for Apollo, Luna, and Chang\'e missions with interactive mission info.',
        action: 'moonGlobe',
        actionLabel: '🌕 Explore the Moon',
        color: '#c8c8e0',
        flagship: true,
    },
    {
        emoji: '☀️',
        title: 'Solar System Orrery',
        desc: 'An interactive 3D model showing all planets orbiting the Sun in their real-time positions, calculated from NASA ephemeris data.',
        action: 'orrery',
        actionLabel: '🪐 Open Orrery',
        color: '#44aaff',
        flagship: true,
    },
    {
        emoji: '📡',
        title: 'Orbital Tracking',
        desc: 'Full-screen 3D satellite tracker with real orbital data from CelesTrak/NORAD. Toggle between representative view and all 8,000+ active satellites.',
        action: 'orbitalTracker',
        actionLabel: '🛸 Launch Tracker',
        color: '#00cccc',
    },
    {
        emoji: '⭐',
        title: "Tonight's Best Objects",
        desc: 'See what stars, planets, and nebulae are visible RIGHT NOW from your location. Tap any object to fly to it!',
        action: 'tonight',
        actionLabel: '🌟 Show Me',
        color: '#ffcc44',
    },
    {
        emoji: '🌅',
        title: 'Watch a Sunset',
        desc: 'Travel in time to see the Sun set with realistic Rayleigh atmospheric scattering — the sky turns orange, pink, and deep blue.',
        action: 'timeTravel',
        actionLabel: '⏩ Try it Now',
        color: '#ff8844',
    },
    {
        emoji: '🎓',
        title: 'AstroQuiz Challenge',
        desc: 'Test your astronomy knowledge with 50 fun questions. Earn XP, maintain streaks, and learn curious facts!',
        action: 'quiz',
        actionLabel: '🧠 Start Quiz',
        color: '#44cc88',
    },
    {
        emoji: '📷',
        title: 'Star Trails Photo',
        desc: 'Simulate long-exposure astrophotography — watch the stars draw circular trails around Polaris.',
        action: 'startrails',
        actionLabel: '📸 Capture',
        color: '#cc66ff',
    },
    {
        emoji: '☄️',
        title: 'Asteroid Tracker',
        desc: 'Track near-Earth asteroids in 3D — see Apophis, Bennu, and other potentially hazardous objects with real orbital data from NASA.',
        action: 'asteroidTracker',
        actionLabel: '☄️ Track Asteroids',
        color: '#ef4444',
        flagship: true,
    },
    {
        emoji: '🪐',
        title: 'Exoplanet Explorer',
        desc: 'Visit alien solar systems! Explore TRAPPIST-1\'s 7 planets, Proxima Centauri b, and other confirmed exoworlds with real NASA data.',
        action: 'exoplanets',
        actionLabel: '🪐 Explore Exoplanets',
        color: '#22dd77',
        flagship: true,
    },
    {
        emoji: '📡',
        title: 'Deep Space Network Live',
        desc: 'Watch NASA communicate with Voyager, JWST, Mars rovers, and more spacecraft in real time across the solar system.',
        action: 'dsnLive',
        actionLabel: '📡 View DSN',
        color: '#22dd77',
    },
];

export default function QuickStartGuide({ open, onClose, onAction }) {
    const [dismissed, setDismissed] = useState([]);

    if (!open) return null;

    const handleAction = (suggestion) => {
        onAction(suggestion.action);
        setDismissed((prev) => [...prev, suggestion.action]);
    };

    return (
        <div
            className="fixed inset-0 z-[105] flex items-center justify-center p-3"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(12,16,35,0.98), rgba(8,12,28,0.99))',
                    border: '1px solid rgba(100,140,255,0.15)',
                    boxShadow: '0 0 80px rgba(80,120,255,0.12)',
                }}
            >
                {/* Header */}
                <div
                    className="px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(100,140,255,0.1)' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-2xl">🚀</span>
                                Try This!
                            </h2>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                8 interactive experiences — all powered by real scientific data
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div className="p-4 overflow-y-auto space-y-2.5" style={{ maxHeight: 'calc(90vh - 130px)' }}>

                    {/* WHAT IS THIS? — critical explanation */}
                    <div
                        className="rounded-xl p-3.5"
                        style={{
                            background: 'rgba(100,140,255,0.08)',
                            border: '1px solid rgba(100,140,255,0.15)',
                        }}
                    >
                        <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                            🔭 What am I looking at?
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed mt-1.5">
                            This is a <strong className="text-white">real-time 3D simulation</strong> of
                            your sky — it shows <strong className="text-white">exactly what is happening above you right now</strong>,
                            calculated using NASA's astronomical algorithms. Every star, planet, and constellation
                            is in its <strong className="text-white">correct real-time position</strong>.
                        </p>
                        <p className="text-[11px] text-gray-400 leading-relaxed mt-2">
                            Why a simulation instead of a camera?
                        </p>
                        <ul className="text-[11px] text-gray-400 mt-1 space-y-0.5 pl-4" style={{ listStyleType: "'✦ '" }}>
                            <li>Works <strong className="text-gray-200">day or night</strong>, even when it's cloudy</li>
                            <li>Shows <strong className="text-gray-200">100,000+ stars</strong> — more than any camera can capture</li>
                            <li>Labels every star, planet, and constellation with <strong className="text-gray-200">names and data</strong></li>
                            <li>Lets you <strong className="text-gray-200">travel in time</strong> — see the sky in the past or future</li>
                        </ul>
                    </div>

                    {/* REAL SKY — link to live cameras */}
                    <div
                        className="rounded-xl p-3.5"
                        style={{
                            background: 'rgba(80,200,120,0.06)',
                            border: '1px solid rgba(80,200,120,0.12)',
                        }}
                    >
                        <h3 className="text-sm font-bold text-green-300 flex items-center gap-2">
                            🌐 Want to also see the real sky on video?
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed mt-1.5">
                            As a complement, you can view <strong className="text-white">real live video feeds</strong> from
                            observatories around the world — Subaru Telescope (Hawaii), ESO Paranal (Chile),
                            and more. Tap below or use the <strong className="text-teal-300">🌐</strong> button anytime.
                        </p>
                        <button
                            onClick={() => onAction('liveCams')}
                            className="mt-2 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                            style={{
                                background: 'rgba(80,200,120,0.12)',
                                color: '#50c878',
                                border: '1px solid rgba(80,200,120,0.2)',
                            }}
                        >
                            🌐 Open Live Cameras
                        </button>
                    </div>

                    {/* Section divider */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] text-gray-500 font-medium">FEATURES TO TRY</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    {SUGGESTIONS.map((s) => {
                        const isDone = dismissed.includes(s.action);
                        return (
                            <div
                                key={s.action}
                                className={`rounded-xl p-3.5 transition-all ${s.flagship ? 'ring-1 ring-amber-400/20' : ''}`}
                                style={{
                                    background: isDone
                                        ? 'rgba(80,200,120,0.06)'
                                        : s.flagship
                                            ? 'rgba(255,200,60,0.04)'
                                            : 'rgba(255,255,255,0.025)',
                                    border: `1px solid ${isDone
                                        ? 'rgba(80,200,120,0.15)'
                                        : s.flagship
                                            ? 'rgba(255,200,60,0.12)'
                                            : 'rgba(100,140,255,0.08)'}`,
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl shrink-0">{isDone ? '✅' : s.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white">{s.title}</h3>
                                        <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                                            {s.desc}
                                        </p>
                                        <button
                                            onClick={() => handleAction(s)}
                                            className="mt-2 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                                            style={{
                                                background: isDone ? 'rgba(80,200,120,0.1)' : `${s.color}22`,
                                                color: isDone ? '#50c878' : s.color,
                                                border: `1px solid ${isDone ? 'rgba(80,200,120,0.2)' : s.color + '33'}`,
                                            }}
                                        >
                                            {isDone ? '✓ Done — Try Again' : s.actionLabel}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Footer */}
                    <div
                        className="mt-3 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(100,140,255,0.05)',
                            border: '1px solid rgba(100,140,255,0.08)',
                        }}
                    >
                        <p className="text-[11px] text-gray-400">
                            💡 Also try: <strong className="text-gray-300">drag</strong> to rotate the sky, <strong className="text-gray-300">scroll/pinch</strong> to zoom, and <strong className="text-gray-300">search</strong> for any star, planet, galaxy, or constellation in your language!
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                            background: 'rgba(100,140,255,0.1)',
                            color: '#93b5ff',
                            border: '1px solid rgba(100,140,255,0.2)',
                        }}
                    >
                        Start Exploring 🌌
                    </button>
                </div>
            </div>
        </div>
    );
}
