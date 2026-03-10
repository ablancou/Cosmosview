import React, { useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * AstroPhotoPlanner — Astrophotography planning tool.
 * 
 * Features:
 * - Tonight's conditions rating (moon phase, darkness hours)
 * - Best DSOs visible tonight with optimal viewing windows
 * - 7-day forecast of astrophotography quality
 * - Moon rise/set times and illumination
 * - Darkness window (astronomical twilight to twilight)
 */

// Top DSO targets for astrophotography
const PHOTO_TARGETS = [
    { id: 'M31', name: 'Andromeda Galaxy', ra: 0.712, dec: 41.27, type: 'GX', mag: 3.4, bestMonths: [8, 9, 10, 11, 12, 1] },
    { id: 'M42', name: 'Orion Nebula', ra: 5.588, dec: -5.39, type: 'EN', mag: 4.0, bestMonths: [11, 12, 1, 2, 3] },
    { id: 'M45', name: 'Pleiades', ra: 3.787, dec: 24.11, type: 'OC', mag: 1.6, bestMonths: [10, 11, 12, 1, 2] },
    { id: 'M51', name: 'Whirlpool Galaxy', ra: 13.498, dec: 47.20, type: 'GX', mag: 8.4, bestMonths: [3, 4, 5, 6] },
    { id: 'M81', name: "Bode's Galaxy", ra: 9.926, dec: 69.07, type: 'GX', mag: 6.9, bestMonths: [2, 3, 4, 5] },
    { id: 'M101', name: 'Pinwheel Galaxy', ra: 14.054, dec: 54.35, type: 'GX', mag: 7.9, bestMonths: [3, 4, 5, 6, 7] },
    { id: 'M104', name: 'Sombrero Galaxy', ra: 12.667, dec: -11.62, type: 'GX', mag: 8.0, bestMonths: [3, 4, 5, 6] },
    { id: 'NGC3372', name: 'Carina Nebula', ra: 10.733, dec: -59.87, type: 'EN', mag: 1.0, bestMonths: [1, 2, 3, 4, 5] },
    { id: 'M16', name: 'Eagle Nebula', ra: 18.313, dec: -13.79, type: 'EN', mag: 6.0, bestMonths: [6, 7, 8, 9] },
    { id: 'M8', name: 'Lagoon Nebula', ra: 18.063, dec: -24.38, type: 'EN', mag: 6.0, bestMonths: [6, 7, 8] },
    { id: 'M13', name: 'Hercules Cluster', ra: 16.695, dec: 36.46, type: 'GC', mag: 5.8, bestMonths: [5, 6, 7, 8, 9] },
    { id: 'M57', name: 'Ring Nebula', ra: 18.893, dec: 33.03, type: 'PN', mag: 8.8, bestMonths: [6, 7, 8, 9, 10] },
    { id: 'M27', name: 'Dumbbell Nebula', ra: 19.993, dec: 22.72, type: 'PN', mag: 7.5, bestMonths: [7, 8, 9, 10] },
    { id: 'M33', name: 'Triangulum Galaxy', ra: 1.564, dec: 30.66, type: 'GX', mag: 5.7, bestMonths: [9, 10, 11, 12] },
    { id: 'M1', name: 'Crab Nebula', ra: 5.575, dec: 22.01, type: 'SNR', mag: 8.4, bestMonths: [11, 12, 1, 2] },
];

const TYPE_EMOJIS = { GX: '🌀', EN: '🔴', OC: '✨', GC: '⭐', PN: '🟢', SNR: '🟠' };
const TYPE_NAMES = { GX: 'Galaxy', EN: 'Emission Nebula', OC: 'Open Cluster', GC: 'Globular Cluster', PN: 'Planetary Nebula', SNR: 'Supernova Remnant' };

function getConditionRating(moonIllum, darkHours) {
    // 0-100 score
    const moonScore = (1 - moonIllum) * 50; // Low moon = good
    const darkScore = Math.min(darkHours / 8, 1) * 50; // More dark hours = good
    return Math.round(moonScore + darkScore);
}

function getRatingLabel(score) {
    if (score >= 80) return { label: 'Excellent', color: '#00ff88', emoji: '🌟' };
    if (score >= 60) return { label: 'Good', color: '#88ff44', emoji: '✅' };
    if (score >= 40) return { label: 'Fair', color: '#ffaa00', emoji: '🟡' };
    if (score >= 20) return { label: 'Poor', color: '#ff6644', emoji: '🔶' };
    return { label: 'Bad', color: '#ff4444', emoji: '❌' };
}

export default function AstroPhotoPlanner({ open, onClose }) {
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);
    const date = time.current;

    const planData = useMemo(() => {
        const observer = new Astronomy.Observer(location.lat, location.lon, 0);
        const month = date.getMonth() + 1;

        // Moon illumination
        let moonIllum = 0;
        try {
            const illum = Astronomy.Illumination('Moon', date);
            moonIllum = illum.phase_fraction || 0;
        } catch { }

        // Moon phase angle
        let moonPhase = 0;
        try { moonPhase = Astronomy.MoonPhase(date); } catch { }

        // Approximate darkness hours (simplified)
        let darkHours = 8;
        try {
            // Sun altitude at midnight
            const midnight = new Date(date);
            midnight.setHours(0, 0, 0, 0);
            const sunMid = Astronomy.Horizon(midnight, observer, 0, 0, 'normal');
            // Estimate based on latitude and season
            const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            const latRad = location.lat * Math.PI / 180;
            const declination = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
            const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(declination * Math.PI / 180));
            const dayLength = (2 * hourAngle * 180 / Math.PI) / 15; // hours
            darkHours = Math.max(0, 24 - dayLength - 3); // subtract twilight
        } catch { }

        const tonightScore = getConditionRating(moonIllum, darkHours);
        const tonightRating = getRatingLabel(tonightScore);

        // 7-day forecast
        const forecast = [];
        for (let d = 0; d < 7; d++) {
            const futureDate = new Date(date.getTime() + d * 86400000);
            let fMoonIllum = 0;
            try {
                const fIllum = Astronomy.Illumination('Moon', futureDate);
                fMoonIllum = fIllum.phase_fraction || 0;
            } catch { }
            const fScore = getConditionRating(fMoonIllum, darkHours);
            forecast.push({
                date: futureDate,
                score: fScore,
                rating: getRatingLabel(fScore),
                moonIllum: fMoonIllum,
            });
        }

        // Best targets tonight
        const targets = PHOTO_TARGETS.map((t) => {
            let maxAlt = -90;
            let bestTime = null;
            const inSeason = t.bestMonths.includes(month);

            // Check altitude every 2 hours through the night
            for (let h = 20; h <= 30; h += 1) { // 8pm to 6am
                const checkTime = new Date(date);
                checkTime.setHours(h % 24, 0, 0, 0);
                if (h >= 24) checkTime.setDate(checkTime.getDate() + 1);
                try {
                    const hor = Astronomy.Horizon(checkTime, observer, t.ra * 15, t.dec, 'normal');
                    if (hor.altitude > maxAlt) {
                        maxAlt = hor.altitude;
                        bestTime = checkTime;
                    }
                } catch { }
            }

            return {
                ...t,
                maxAlt,
                bestTime,
                visible: maxAlt > 15,
                inSeason,
                score: maxAlt > 15 ? Math.round((maxAlt / 90) * 40 + (inSeason ? 40 : 10) + (1 - moonIllum) * 20) : 0,
            };
        })
            .filter(t => t.visible)
            .sort((a, b) => b.score - a.score);

        return { moonIllum, moonPhase, darkHours, tonightScore, tonightRating, forecast, targets };
    }, [date, location.lat, location.lon]);

    if (!open) return null;

    const { moonIllum, darkHours, tonightScore, tonightRating, forecast, targets } = planData;

    // Moon phase name
    const moonPhaseName = planData.moonPhase < 45 ? '🌑 New' : planData.moonPhase < 135 ? '🌓 First Q' :
        planData.moonPhase < 225 ? '🌕 Full' : planData.moonPhase < 315 ? '🌗 Last Q' : '🌑 New';

    return (
        <div className="fixed inset-y-0 right-0 w-[420px] z-50 glass-panel overflow-y-auto animate-slideRight"
            style={{ backdropFilter: 'blur(20px)' }}>
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-cosmos-border/30 flex items-center justify-between"
                style={{ background: 'inherit' }}>
                <h2 className="text-lg font-bold text-cosmos-accent flex items-center gap-2">
                    📸 Astrophotography Planner
                </h2>
                <button onClick={onClose}
                    className="text-cosmos-muted hover:text-cosmos-text text-xl transition-colors">×</button>
            </div>

            <div className="p-5 space-y-5">
                {/* Tonight's Rating */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,200,200,0.1)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-cosmos-muted uppercase tracking-wider">Tonight's Conditions</span>
                        <span className="text-2xl">{tonightRating.emoji}</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold" style={{ color: tonightRating.color }}>{tonightScore}</span>
                        <span className="text-sm mb-1" style={{ color: tonightRating.color }}>{tonightRating.label}</span>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="rounded-lg p-2 bg-cosmos-border/10 text-center">
                            <div className="text-[9px] text-cosmos-muted uppercase">Moon</div>
                            <div className="text-xs font-mono text-cosmos-text">{Math.round(moonIllum * 100)}%</div>
                            <div className="text-[8px] text-cosmos-muted">{moonPhaseName}</div>
                        </div>
                        <div className="rounded-lg p-2 bg-cosmos-border/10 text-center">
                            <div className="text-[9px] text-cosmos-muted uppercase">Dark Hours</div>
                            <div className="text-xs font-mono text-cosmos-text">{darkHours.toFixed(1)}h</div>
                        </div>
                        <div className="rounded-lg p-2 bg-cosmos-border/10 text-center">
                            <div className="text-[9px] text-cosmos-muted uppercase">Targets</div>
                            <div className="text-xs font-mono text-cosmos-text">{targets.length}</div>
                            <div className="text-[8px] text-cosmos-muted">visible</div>
                        </div>
                    </div>
                </div>

                {/* 7-Day Forecast */}
                <div>
                    <h3 className="text-xs text-cosmos-muted uppercase tracking-wider mb-2">📅 7-Day Forecast</h3>
                    <div className="flex gap-1">
                        {forecast.map((f, i) => {
                            const dayLabel = i === 0 ? 'Today' : f.date.toLocaleDateString([], { weekday: 'short' });
                            return (
                                <div key={i} className="flex-1 rounded-lg p-1.5 text-center bg-cosmos-border/10">
                                    <div className="text-[8px] text-cosmos-muted">{dayLabel}</div>
                                    <div className="text-base my-0.5">{f.rating.emoji}</div>
                                    <div className="text-[10px] font-mono" style={{ color: f.rating.color }}>{f.score}</div>
                                    <div className="text-[7px] text-cosmos-muted/50">🌙{Math.round(f.moonIllum * 100)}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Best Targets Tonight */}
                <div>
                    <h3 className="text-xs text-cosmos-muted uppercase tracking-wider mb-2">🎯 Best Targets Tonight</h3>
                    <div className="space-y-1.5">
                        {targets.slice(0, 8).map((t) => (
                            <div key={t.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-cosmos-border/10 hover:bg-cosmos-border/20 transition-all cursor-pointer"
                                onClick={() => {
                                    const { setSearchTarget } = useAppStore.getState();
                                    setSearchTarget({ ra: t.ra, dec: t.dec, name: t.name });
                                }}
                            >
                                <span className="text-lg">{TYPE_EMOJIS[t.type]}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-cosmos-text font-medium truncate">{t.name}</div>
                                    <div className="text-[9px] text-cosmos-muted">
                                        {t.id} • {TYPE_NAMES[t.type]} • mag {t.mag}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono" style={{ color: t.score >= 70 ? '#00ff88' : t.score >= 40 ? '#ffaa00' : '#ff6644' }}>
                                        {t.maxAlt.toFixed(0)}° alt
                                    </div>
                                    <div className="text-[8px] text-cosmos-muted">
                                        Best: {t.bestTime ? t.bestTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </div>
                                    {t.inSeason && <div className="text-[7px] text-green-400">IN SEASON</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tips */}
                <div className="text-[10px] text-cosmos-muted/50 pt-2 border-t border-cosmos-border/20 space-y-1">
                    <p>💡 <strong>Lower moon illumination</strong> = darker skies = better photos.</p>
                    <p>📐 Objects higher than 30° altitude have less atmospheric distortion.</p>
                    <p>👆 Tap any target to navigate to it in the sky view.</p>
                </div>
            </div>
        </div>
    );
}
