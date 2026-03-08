import React, { useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * Tonight's Best Objects — AI-computed recommendations for tonight's observation.
 * Calculates which objects are most visible based on current location, time,
 * altitude, magnitude, and Moon interference.
 */

const DEEP_SKY = [
    { name: 'Orion Nebula', id: 'M42', type: 'Nebula', mag: 4.0, ra: 5.588, dec: -5.39, desc: 'Stellar nursery visible to the naked eye. One of the brightest nebulae.' },
    { name: 'Andromeda Galaxy', id: 'M31', type: 'Galaxy', mag: 3.4, ra: 0.712, dec: 41.27, desc: 'Nearest major galaxy, 2.5 million light-years away. Visible as a faint smudge.' },
    { name: 'Pleiades', id: 'M45', type: 'Cluster', mag: 1.6, ra: 3.787, dec: 24.11, desc: 'The Seven Sisters. Beautiful open cluster, best with binoculars.' },
    { name: 'Beehive Cluster', id: 'M44', type: 'Cluster', mag: 3.7, ra: 8.667, dec: 19.67, desc: 'Large, bright open cluster in Cancer. Over 1,000 stars.' },
    { name: 'Hercules Cluster', id: 'M13', type: 'Cluster', mag: 5.8, ra: 16.695, dec: 36.46, desc: 'Best globular cluster in the northern sky. 300,000 stars in a ball.' },
    { name: 'Ring Nebula', id: 'M57', type: 'Nebula', mag: 8.8, ra: 18.893, dec: 33.03, desc: 'Famous planetary nebula — a dying star\'s glowing shell.' },
    { name: 'Whirlpool Galaxy', id: 'M51', type: 'Galaxy', mag: 8.4, ra: 13.498, dec: 47.20, desc: 'Stunning face-on spiral galaxy interacting with a companion.' },
    { name: 'Lagoon Nebula', id: 'M8', type: 'Nebula', mag: 6.0, ra: 18.063, dec: -24.38, desc: 'Giant interstellar cloud and stellar nursery in Sagittarius.' },
    { name: 'Omega Centauri', id: 'NGC5139', type: 'Cluster', mag: 3.7, ra: 13.447, dec: -47.48, desc: 'Largest globular cluster in the Milky Way. 10 million stars.' },
    { name: 'Double Cluster', id: 'NGC869', type: 'Cluster', mag: 4.3, ra: 2.333, dec: 57.13, desc: 'Two brilliant open clusters side by side in Perseus.' },
];

const BRIGHT_STARS = [
    { name: 'Sirius', type: 'Star', mag: -1.46, ra: 6.752, dec: -16.72, desc: 'Brightest star in the night sky. Only 8.6 light-years away.' },
    { name: 'Canopus', type: 'Star', mag: -0.74, ra: 6.399, dec: -52.70, desc: '2nd brightest star. A white supergiant 310 light-years away.' },
    { name: 'Arcturus', type: 'Star', mag: -0.05, ra: 14.261, dec: 19.18, desc: 'Brightest star in the northern celestial hemisphere. An orange giant.' },
    { name: 'Vega', type: 'Star', mag: 0.03, ra: 18.616, dec: 38.78, desc: 'Former North Star (12,000 years ago). Will be again in 13,000 years.' },
    { name: 'Capella', type: 'Star', mag: 0.08, ra: 5.278, dec: 46.00, desc: '6th brightest star. Actually a system of 4 stars.' },
    { name: 'Betelgeuse', type: 'Star', mag: 0.42, ra: 5.919, dec: 7.41, desc: 'Red supergiant in Orion. Could explode as a supernova any millennium.' },
    { name: 'Antares', type: 'Star', mag: 1.06, ra: 16.490, dec: -26.43, desc: 'Heart of Scorpius. A red supergiant 700× the Sun\'s diameter.' },
    { name: 'Polaris', type: 'Star', mag: 1.98, ra: 2.530, dec: 89.26, desc: 'The North Star. Essential for navigation for millennia.' },
];

export default function TonightsBestPanel({ open, onClose }) {
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);

    const recommendations = useMemo(() => {
        if (!open) return [];

        const observer = new Astronomy.Observer(location.lat, location.lon, 0);
        // Use tonight's midnight
        const now = time.current;
        const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0);

        // Moon phase & altitude for interference calculation
        let moonAlt = -90;
        let moonPhase = 0;
        try {
            const moonEq = Astronomy.Equator('Moon', tonight, observer, true, true);
            const moonHor = Astronomy.Horizon(tonight, observer, moonEq.ra, moonEq.dec, 'normal');
            moonAlt = moonHor.altitude;
            moonPhase = Astronomy.MoonPhase(tonight);
        } catch (e) { }

        const moonInterference = moonAlt > 10 ? (moonPhase > 90 && moonPhase < 270 ? 0.7 : 0.3) : 0;

        const scored = [];

        // Planets
        ['Venus', 'Mars', 'Jupiter', 'Saturn'].forEach((planet) => {
            try {
                const eq = Astronomy.Equator(planet, tonight, observer, true, true);
                const hor = Astronomy.Horizon(tonight, observer, eq.ra, eq.dec, 'normal');
                const illum = Astronomy.Illumination(planet, tonight);

                if (hor.altitude > 10) {
                    scored.push({
                        name: planet,
                        type: 'Planet',
                        altitude: hor.altitude,
                        magnitude: illum.mag,
                        desc: `Magnitude ${illum.mag.toFixed(1)} • Altitude ${hor.altitude.toFixed(0)}°`,
                        score: 80 + hor.altitude * 0.5 - illum.mag * 5,
                        emoji: '🪐',
                    });
                }
            } catch (e) { }
        });

        // Moon
        if (moonAlt > 5) {
            const phaseName = moonPhase < 90 ? 'Waxing' : moonPhase < 180 ? 'Gibbous/Full' : moonPhase < 270 ? 'Waning' : 'Crescent';
            scored.push({
                name: 'Moon',
                type: 'Moon',
                altitude: moonAlt,
                magnitude: -12,
                desc: `${phaseName} • Perfect for lunar observation`,
                score: 90,
                emoji: '🌙',
            });
        }

        // Deep sky objects
        DEEP_SKY.forEach((obj) => {
            try {
                const hor = Astronomy.Horizon(tonight, observer, obj.ra, obj.dec, 'normal');
                if (hor.altitude > 15) {
                    const visScore = hor.altitude - obj.mag * 3 - moonInterference * 30;
                    scored.push({
                        name: obj.name,
                        id: obj.id,
                        type: obj.type,
                        altitude: hor.altitude,
                        magnitude: obj.mag,
                        desc: obj.desc,
                        score: visScore,
                        emoji: obj.type === 'Nebula' ? '🌫️' : obj.type === 'Galaxy' ? '🌀' : '✨',
                    });
                }
            } catch (e) { }
        });

        // Bright stars
        BRIGHT_STARS.forEach((star) => {
            try {
                const hor = Astronomy.Horizon(tonight, observer, star.ra, star.dec, 'normal');
                if (hor.altitude > 15) {
                    scored.push({
                        name: star.name,
                        type: star.type,
                        altitude: hor.altitude,
                        magnitude: star.mag,
                        desc: star.desc,
                        score: 50 + hor.altitude * 0.3 - star.mag * 2,
                        emoji: '⭐',
                    });
                }
            } catch (e) { }
        });

        scored.sort((a, b) => b.score - a.score);
        return { items: scored.slice(0, 12), moonInterference };
    }, [open, time.current, location]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 w-[420px] z-50 glass-panel overflow-y-auto animate-slideRight"
            style={{ backdropFilter: 'blur(20px)' }}
        >
            {/* Header */}
            <div
                className="sticky top-0 z-10 px-5 py-4 border-b border-cosmos-border/30 flex items-center justify-between"
                style={{ background: 'inherit' }}
            >
                <div>
                    <h2 className="text-lg font-bold text-cosmos-accent flex items-center gap-2">
                        🌟 Tonight's Best
                    </h2>
                    <p className="text-[10px] text-cosmos-muted mt-0.5">
                        {recommendations.items?.length || 0} objects recommended for tonight
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-cosmos-muted hover:text-cosmos-text text-xl"
                >
                    ×
                </button>
            </div>

            <div className="p-4 space-y-2">
                {/* Moon warning */}
                {recommendations.moonInterference > 0.5 && (
                    <div className="px-3 py-2 rounded-lg bg-yellow-900/20 border border-yellow-600/20 text-xs text-yellow-300/80">
                        🌕 Bright Moon tonight — deep-sky objects may be harder to see
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.items?.map((obj, i) => (
                    <div
                        key={`${obj.name}-${i}`}
                        className="rounded-xl px-4 py-3 bg-cosmos-border/10 hover:bg-cosmos-border/20 transition-colors"
                        style={{ animation: `fade-in 0.3s ease-out ${0.05 * i}s both` }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">{obj.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-cosmos-text">{obj.name}</h3>
                                    {obj.id && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cosmos-accent/15 text-cosmos-accent">
                                            {obj.id}
                                        </span>
                                    )}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${obj.type === 'Planet' ? 'bg-orange-500/15 text-orange-300' :
                                            obj.type === 'Star' ? 'bg-yellow-500/15 text-yellow-300' :
                                                obj.type === 'Moon' ? 'bg-blue-500/15 text-blue-300' :
                                                    'bg-purple-500/15 text-purple-300'
                                        }`}>
                                        {obj.type}
                                    </span>
                                </div>
                                <p className="text-[11px] text-cosmos-muted/70 mt-1 leading-relaxed">
                                    {obj.desc}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-cosmos-muted/50">
                                    <span>Alt: {obj.altitude.toFixed(0)}°</span>
                                    <span>Mag: {obj.magnitude.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {recommendations.items?.length === 0 && (
                    <div className="text-center py-10 text-cosmos-muted text-sm">
                        No objects above the horizon right now. Try at night!
                    </div>
                )}
            </div>
        </div>
    );
}
