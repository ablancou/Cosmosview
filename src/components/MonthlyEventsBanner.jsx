import React, { useState, useMemo, useEffect } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * Monthly Astronomical Events Banner — shows on first app load.
 * Elegant glassmorphism modal highlighting this month's key events:
 * - Meteor showers
 * - Eclipses
 * - Full/New moons
 * - Planet visibility
 * - Solstices/equinoxes
 */

const METEOR_SHOWERS = [
    { name: 'Quadrantids', peak: [1, 3], zhr: 120 },
    { name: 'Lyrids', peak: [4, 22], zhr: 18 },
    { name: 'Eta Aquariids', peak: [5, 6], zhr: 50 },
    { name: 'Delta Aquariids', peak: [7, 30], zhr: 25 },
    { name: 'Perseids', peak: [8, 12], zhr: 100 },
    { name: 'Draconids', peak: [10, 8], zhr: 10 },
    { name: 'Orionids', peak: [10, 21], zhr: 20 },
    { name: 'Leonids', peak: [11, 17], zhr: 15 },
    { name: 'Geminids', peak: [12, 14], zhr: 150 },
    { name: 'Ursids', peak: [12, 22], zhr: 10 },
];

export default function MonthlyEventsBanner() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);
    const loading = useAppStore((s) => s.loading);
    const date = time.current;

    // Show after loading with a slight delay for drama
    useEffect(() => {
        if (!loading && !dismissed) {
            const key = `cosmosview-banner-${date.getFullYear()}-${date.getMonth()}`;
            const alreadySeen = sessionStorage.getItem(key);
            if (!alreadySeen) {
                const timer = setTimeout(() => setVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [loading, dismissed, date]);

    const events = useMemo(() => {
        const month = date.getMonth(); // 0-indexed
        const year = date.getFullYear();
        const items = [];

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];

        // Full Moon & New Moon
        try {
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const fullMoon = Astronomy.SearchMoonPhase(180, startOfMonth, 32);
            if (fullMoon) {
                const d = fullMoon.date instanceof Date ? fullMoon.date : new Date(fullMoon.date);
                if (d.getMonth() === month) {
                    items.push({
                        emoji: '🌕',
                        title: 'Full Moon',
                        date: d,
                        priority: 2,
                        description: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
                    });
                }
            }

            const newMoon = Astronomy.SearchMoonPhase(0, startOfMonth, 32);
            if (newMoon) {
                const d = newMoon.date instanceof Date ? newMoon.date : new Date(newMoon.date);
                if (d.getMonth() === month) {
                    items.push({
                        emoji: '🌑',
                        title: 'New Moon',
                        date: d,
                        priority: 1,
                        description: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — Best for stargazing`,
                    });
                }
            }
        } catch (e) { }

        // Lunar eclipses this month
        try {
            const eclipse = Astronomy.SearchLunarEclipse(new Date(year, month, 1));
            if (eclipse && eclipse.peak) {
                const d = eclipse.peak.date instanceof Date ? eclipse.peak.date : new Date(eclipse.peak.date);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    items.push({
                        emoji: '🌘',
                        title: `${eclipse.kind.charAt(0).toUpperCase() + eclipse.kind.slice(1)} Lunar Eclipse`,
                        date: d,
                        priority: 5,
                        description: `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — Don't miss it!`,
                        highlight: true,
                    });
                }
            }
        } catch (e) { }

        // Meteor showers this month
        METEOR_SHOWERS.forEach((shower) => {
            if (shower.peak[0] - 1 === month) {
                const peakDate = new Date(year, month, shower.peak[1]);
                items.push({
                    emoji: '☄️',
                    title: `${shower.name} Meteor Shower`,
                    date: peakDate,
                    priority: shower.zhr >= 50 ? 4 : 2,
                    description: `Peak: ${peakDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • Up to ${shower.zhr} meteors/hour`,
                    highlight: shower.zhr >= 100,
                });
            }
        });

        // Solstices/equinoxes this month
        try {
            const seasons = Astronomy.Seasons(year);
            const seasonData = [
                { name: 'Vernal Equinox', date: seasons.mar_equinox?.date, emoji: '🌸' },
                { name: 'Summer Solstice', date: seasons.jun_solstice?.date, emoji: '☀️' },
                { name: 'Autumnal Equinox', date: seasons.sep_equinox?.date, emoji: '🍂' },
                { name: 'Winter Solstice', date: seasons.dec_solstice?.date, emoji: '❄️' },
            ];
            seasonData.forEach((s) => {
                if (s.date) {
                    const d = s.date instanceof Date ? s.date : new Date(s.date);
                    if (d.getMonth() === month) {
                        items.push({
                            emoji: s.emoji,
                            title: s.name,
                            date: d,
                            priority: 3,
                            description: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        });
                    }
                }
            });
        } catch (e) { }

        // Planet visibility tonight
        try {
            const observer = new Astronomy.Observer(location.lat, location.lon, 0);
            const tonight = new Date(year, month, date.getDate(), 22, 0, 0);
            const planetNames = ['Venus', 'Mars', 'Jupiter', 'Saturn'];
            const visiblePlanets = [];

            planetNames.forEach((p) => {
                try {
                    const equ = Astronomy.Equator(p, tonight, observer, true, true);
                    const hor = Astronomy.Horizon(tonight, observer, equ.ra, equ.dec, 'normal');
                    if (hor.altitude > 10) {
                        visiblePlanets.push(p);
                    }
                } catch (e) { }
            });

            if (visiblePlanets.length > 0) {
                items.push({
                    emoji: '🪐',
                    title: 'Planets Visible Tonight',
                    date: tonight,
                    priority: 1,
                    description: visiblePlanets.join(', '),
                });
            }
        } catch (e) { }

        items.sort((a, b) => b.priority - a.priority);
        return { items, monthName: monthNames[month], year };
    }, [date, location]);

    const handleDismiss = () => {
        setVisible(false);
        setDismissed(true);
        const key = `cosmosview-banner-${date.getFullYear()}-${date.getMonth()}`;
        sessionStorage.setItem(key, 'true');
    };

    if (!visible || events.items.length === 0) return null;

    const heroEvent = events.items.find((e) => e.highlight) || events.items[0];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleDismiss}
                style={{ animation: 'fade-in 0.5s ease-out' }}
            />

            {/* Banner Card */}
            <div
                className="relative z-10 w-[480px] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    animation: 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: 'linear-gradient(135deg, rgba(15,15,40,0.95), rgba(30,20,60,0.95))',
                    border: '1px solid rgba(126, 184, 247, 0.15)',
                }}
            >
                {/* Hero gradient */}
                <div
                    className="h-32 relative overflow-hidden"
                    style={{
                        background: heroEvent.highlight
                            ? 'linear-gradient(135deg, #ff6b35 0%, #d32f2f 50%, #7b1fa2 100%)'
                            : 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #5c6bc0 100%)',
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-5xl mb-1" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                                {heroEvent.emoji}
                            </div>
                            <h2 className="text-white text-xl font-bold drop-shadow-lg">
                                {events.monthName} {events.year}
                            </h2>
                            <p className="text-white/60 text-xs mt-0.5">Astronomical Highlights</p>
                        </div>
                    </div>
                    {/* Decorative stars */}
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-white/40"
                            style={{
                                left: `${10 + Math.random() * 80}%`,
                                top: `${10 + Math.random() * 80}%`,
                                animation: `star-twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
                            }}
                        />
                    ))}
                </div>

                {/* Events list */}
                <div className="p-5 space-y-3 max-h-[45vh] overflow-y-auto">
                    {events.items.map((event, i) => (
                        <div
                            key={i}
                            className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-all ${event.highlight
                                    ? 'bg-gradient-to-r from-orange-500/10 to-purple-500/10 ring-1 ring-orange-500/30'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                            style={{ animation: `fade-in 0.4s ease-out ${0.1 * i}s both` }}
                        >
                            <span className="text-2xl flex-shrink-0 mt-0.5">{event.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold ${event.highlight ? 'text-orange-300' : 'text-white'
                                    }`}>
                                    {event.title}
                                </h3>
                                <p className="text-xs text-white/50 mt-0.5">{event.description}</p>
                            </div>
                            {event.highlight && (
                                <span className="text-[9px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold whitespace-nowrap">
                                    DON'T MISS
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-2">
                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                            background: 'linear-gradient(135deg, rgba(126,184,247,0.2), rgba(126,184,247,0.1))',
                            color: '#7eb8f7',
                            border: '1px solid rgba(126,184,247,0.2)',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(126,184,247,0.3), rgba(126,184,247,0.2))';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(126,184,247,0.2), rgba(126,184,247,0.1))';
                        }}
                    >
                        Start Exploring the Sky ✨
                    </button>
                    <p className="text-center text-[10px] text-white/25 mt-2">
                        Data computed from astronomical algorithms • Updated in real-time
                    </p>
                </div>
            </div>
        </div>
    );
}
