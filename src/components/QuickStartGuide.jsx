import React, { useState } from 'react';

/**
 * QuickStartGuide — Interactive "Try This!" onboarding for first-time users.
 * Shows 6 impressive things users can do RIGHT NOW, with action buttons
 * that actually trigger the features.
 */

const SUGGESTIONS = [
    {
        emoji: '🌅',
        title: 'Watch a Sunset',
        desc: 'Move the time slider to see the Sun set with realistic Rayleigh atmospheric scattering — the sky turns orange, pink, and deep blue.',
        action: 'timeTravel',
        actionLabel: '⏩ Try it Now',
        color: '#ff8844',
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
        emoji: '☀️',
        title: 'Explore the Solar System',
        desc: 'Launch an interactive 3D orrery showing all planets orbiting the Sun with real-time positions.',
        action: 'orrery',
        actionLabel: '🪐 Open Orrery',
        color: '#44aaff',
    },
    {
        emoji: '🌙',
        title: 'Moon Dashboard',
        desc: "Check the Moon's current phase, tonight's moonrise/moonset, and upcoming lunar eclipses.",
        action: 'moon',
        actionLabel: '🌙 See the Moon',
        color: '#8888cc',
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
                                6 impressive things you can do right now
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
                            This is a <strong className="text-white">3D simulation</strong> of the night sky — not a real photo or video.
                            Every star, planet, and constellation is rendered using <strong className="text-white">real astronomical data</strong> and
                            shows <strong className="text-white">exactly what you would see</strong> if you looked up from your location right now.
                            The positions are scientifically accurate using NASA's astronomical calculations.
                        </p>
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
                            🌐 Want to see the REAL sky?
                        </h3>
                        <p className="text-[11px] text-gray-300 leading-relaxed mt-1.5">
                            To see <strong className="text-white">real live video feeds</strong> of the sky, tap the
                            <strong className="text-teal-300"> 🌐 Live Cameras</strong> button on the right side.
                            It links to real observatory webcams from around the world (Subaru Telescope, ESO Paranal, and more).
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
                                className="rounded-xl p-3.5 transition-all"
                                style={{
                                    background: isDone ? 'rgba(80,200,120,0.06)' : 'rgba(255,255,255,0.025)',
                                    border: `1px solid ${isDone ? 'rgba(80,200,120,0.15)' : 'rgba(100,140,255,0.08)'}`,
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
                            💡 Also try: <strong className="text-gray-300">drag</strong> to rotate the sky, <strong className="text-gray-300">scroll/pinch</strong> to zoom, and use the <strong className="text-gray-300">search bar</strong> to find any star or constellation!
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
