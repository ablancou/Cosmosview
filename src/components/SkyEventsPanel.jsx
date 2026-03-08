import React, { useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * Sky Events Panel — shows upcoming astronomical events:
 * - Meteor showers with peak dates and ZHR
 * - Planet conjunctions
 * - Eclipses
 * - Solstices and equinoxes
 */

// Major annual meteor showers (fixed dates, approximate)
const METEOR_SHOWERS = [
    { name: 'Quadrantids', peak: [1, 3], end: [1, 4], zhr: 120, parent: '2003 EH1' },
    { name: 'Lyrids', peak: [4, 22], end: [4, 23], zhr: 18, parent: 'C/1861 G1 Thatcher' },
    { name: 'Eta Aquariids', peak: [5, 6], end: [5, 7], zhr: 50, parent: '1P/Halley' },
    { name: 'Delta Aquariids', peak: [7, 30], end: [7, 31], zhr: 25, parent: '96P/Machholz' },
    { name: 'Perseids', peak: [8, 12], end: [8, 13], zhr: 100, parent: '109P/Swift-Tuttle' },
    { name: 'Draconids', peak: [10, 8], end: [10, 9], zhr: 10, parent: '21P/Giacobini-Zinner' },
    { name: 'Orionids', peak: [10, 21], end: [10, 22], zhr: 20, parent: '1P/Halley' },
    { name: 'Leonids', peak: [11, 17], end: [11, 18], zhr: 15, parent: '55P/Tempel-Tuttle' },
    { name: 'Geminids', peak: [12, 14], end: [12, 15], zhr: 150, parent: '3200 Phaethon' },
    { name: 'Ursids', peak: [12, 22], end: [12, 23], zhr: 10, parent: '8P/Tuttle' },
];

export default function SkyEventsPanel({ open, onClose }) {
    const time = useAppStore((s) => s.time);
    const date = time.current;

    const events = useMemo(() => {
        const allEvents = [];
        const year = date.getFullYear();

        // === Meteor Showers ===
        METEOR_SHOWERS.forEach((shower) => {
            // Check this year and next year
            for (let y = year; y <= year + 1; y++) {
                const peakDate = new Date(y, shower.peak[0] - 1, shower.peak[1]);
                const daysUntil = Math.ceil((peakDate - date) / (1000 * 60 * 60 * 24));
                if (daysUntil >= -1 && daysUntil <= 365) {
                    allEvents.push({
                        type: 'meteor',
                        name: shower.name,
                        date: peakDate,
                        daysUntil: Math.max(0, daysUntil),
                        detail: `ZHR: ~${shower.zhr} • Parent: ${shower.parent}`,
                        emoji: '☄️',
                        zhr: shower.zhr,
                        active: daysUntil >= -1 && daysUntil <= 0,
                    });
                }
            }
        });

        // === Solstices & Equinoxes ===
        try {
            const seasons = Astronomy.Seasons(year);
            const seasonEvents = [
                { name: 'March Equinox', date: seasons.mar_equinox?.date, emoji: '🌸' },
                { name: 'June Solstice', date: seasons.jun_solstice?.date, emoji: '☀️' },
                { name: 'September Equinox', date: seasons.sep_equinox?.date, emoji: '🍂' },
                { name: 'December Solstice', date: seasons.dec_solstice?.date, emoji: '❄️' },
            ];

            seasonEvents.forEach((se) => {
                if (se.date) {
                    const d = se.date instanceof Date ? se.date : new Date(se.date);
                    const daysUntil = Math.ceil((d - date) / (1000 * 60 * 60 * 24));
                    if (daysUntil >= -1 && daysUntil <= 365) {
                        allEvents.push({
                            type: 'season',
                            name: se.name,
                            date: d,
                            daysUntil: Math.max(0, daysUntil),
                            detail: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            emoji: se.emoji,
                        });
                    }
                }
            });
        } catch (e) { }

        // === Lunar Eclipses ===
        try {
            let searchDate = date;
            for (let i = 0; i < 3; i++) {
                const eclipse = Astronomy.SearchLunarEclipse(searchDate);
                if (eclipse && eclipse.peak) {
                    const d = eclipse.peak.date instanceof Date ? eclipse.peak.date : new Date(eclipse.peak.date);
                    const daysUntil = Math.ceil((d - date) / (1000 * 60 * 60 * 24));
                    if (daysUntil >= 0) {
                        allEvents.push({
                            type: 'eclipse',
                            name: `Lunar Eclipse (${eclipse.kind})`,
                            date: d,
                            daysUntil,
                            detail: eclipse.kind,
                            emoji: '🌘',
                        });
                    }
                    // Search after this eclipse
                    searchDate = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
                } else break;
            }
        } catch (e) { }

        // === Planet Conjunctions (close approaches) ===
        const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
        try {
            for (let i = 0; i < planets.length; i++) {
                for (let j = i + 1; j < planets.length; j++) {
                    const equ1 = Astronomy.Equator(planets[i], date, new Astronomy.Observer(0, 0, 0), true, true);
                    const equ2 = Astronomy.Equator(planets[j], date, new Astronomy.Observer(0, 0, 0), true, true);
                    if (equ1 && equ2) {
                        // Angular separation
                        const ra1 = equ1.ra * 15 * Math.PI / 180;
                        const dec1 = equ1.dec * Math.PI / 180;
                        const ra2 = equ2.ra * 15 * Math.PI / 180;
                        const dec2 = equ2.dec * Math.PI / 180;
                        const sep = Math.acos(
                            Math.sin(dec1) * Math.sin(dec2) +
                            Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2)
                        ) * 180 / Math.PI;

                        if (sep < 5) { // Within 5 degrees = close conjunction
                            allEvents.push({
                                type: 'conjunction',
                                name: `${planets[i]}–${planets[j]} Conjunction`,
                                date: date,
                                daysUntil: 0,
                                detail: `${sep.toFixed(1)}° apart`,
                                emoji: '🪐',
                                active: true,
                            });
                        }
                    }
                }
            }
        } catch (e) { }

        // Sort by date
        allEvents.sort((a, b) => a.daysUntil - b.daysUntil);
        return allEvents;
    }, [date]);

    if (!open) return null;

    const formatDate = (d) => {
        if (!d) return '';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="fixed inset-y-0 right-0 w-96 z-50 glass-panel overflow-y-auto animate-slideRight"
            style={{ backdropFilter: 'blur(20px)' }}>
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-cosmos-border/30 flex items-center justify-between"
                style={{ background: 'inherit' }}>
                <h2 className="text-lg font-bold text-cosmos-accent flex items-center gap-2">
                    🔭 Sky Events
                </h2>
                <button onClick={onClose}
                    className="text-cosmos-muted hover:text-cosmos-text text-xl transition-colors">×</button>
            </div>

            <div className="p-5 space-y-4">
                {/* Active Now */}
                {events.filter(e => e.active).length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">🟢 Active Now</h3>
                        {events.filter(e => e.active).map((evt, i) => (
                            <EventCard key={`active-${i}`} event={evt} />
                        ))}
                    </div>
                )}

                {/* Meteor Showers */}
                <div>
                    <h3 className="text-xs font-bold text-cosmos-muted uppercase tracking-wider mb-2">☄️ Meteor Showers</h3>
                    {events.filter(e => e.type === 'meteor' && !e.active).slice(0, 5).map((evt, i) => (
                        <EventCard key={`meteor-${i}`} event={evt} />
                    ))}
                </div>

                {/* Eclipses */}
                {events.filter(e => e.type === 'eclipse').length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold text-cosmos-muted uppercase tracking-wider mb-2">🌘 Eclipses</h3>
                        {events.filter(e => e.type === 'eclipse').map((evt, i) => (
                            <EventCard key={`eclipse-${i}`} event={evt} />
                        ))}
                    </div>
                )}

                {/* Seasons */}
                <div>
                    <h3 className="text-xs font-bold text-cosmos-muted uppercase tracking-wider mb-2">🌍 Solstices & Equinoxes</h3>
                    {events.filter(e => e.type === 'season').map((evt, i) => (
                        <EventCard key={`season-${i}`} event={evt} />
                    ))}
                </div>

                <div className="text-[10px] text-cosmos-muted/50 pt-2 border-t border-cosmos-border/20">
                    💡 Meteor shower ZHR = Zenithal Hourly Rate under ideal conditions.
                </div>
            </div>
        </div>
    );
}

function EventCard({ event }) {
    const formatDate = (d) => d?.toLocaleDateString([], { month: 'short', day: 'numeric' }) || '';

    return (
        <div className={`rounded-lg px-3 py-2.5 mb-2 ${event.active ? 'bg-green-500/10 ring-1 ring-green-500/30' : 'bg-cosmos-border/15'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>{event.emoji}</span>
                    <span className="text-sm text-cosmos-text font-medium">{event.name}</span>
                </div>
                <div className="text-right">
                    <div className="text-xs font-mono text-cosmos-accent">{formatDate(event.date)}</div>
                    <div className="text-[10px] text-cosmos-muted">
                        {event.active ? '🟢 NOW' : `${event.daysUntil}d`}
                    </div>
                </div>
            </div>
            {event.detail && (
                <div className="text-[10px] text-cosmos-muted mt-1">{event.detail}</div>
            )}
        </div>
    );
}
