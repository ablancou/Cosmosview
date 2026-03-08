import React, { useState, useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * Comprehensive Moon Dashboard — slide-out panel with:
 * - Real-time phase visualization (canvas-drawn Moon disc)
 * - Phase name and illumination percentage
 * - Monthly phase calendar
 * - Next full moon & new moon countdown
 * - Rise/Set times
 * - Distance, apparent size, supermoon detection
 * - Upcoming lunar eclipses
 */
export default function MoonDashboard({ open, onClose }) {
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);
    const date = time.current;
    const [calendarMonth, setCalendarMonth] = useState(date.getMonth());
    const [calendarYear, setCalendarYear] = useState(date.getFullYear());

    // === Current phase data ===
    const moonData = useMemo(() => {
        const observer = new Astronomy.Observer(location.lat, location.lon, 0);

        // Phase angle (0-360)
        let phaseAngle = 0;
        try { phaseAngle = Astronomy.MoonPhase(date); } catch (e) { }

        // Illumination
        let illumination = 0;
        let magnitude = 0;
        try {
            const illum = Astronomy.Illumination('Moon', date);
            illumination = illum.phase_fraction;
            magnitude = illum.mag;
        } catch (e) { }

        // Phase name and emoji
        let phaseName, phaseEmoji;
        if (phaseAngle < 22.5) { phaseName = 'New Moon'; phaseEmoji = '🌑'; }
        else if (phaseAngle < 67.5) { phaseName = 'Waxing Crescent'; phaseEmoji = '🌒'; }
        else if (phaseAngle < 112.5) { phaseName = 'First Quarter'; phaseEmoji = '🌓'; }
        else if (phaseAngle < 157.5) { phaseName = 'Waxing Gibbous'; phaseEmoji = '🌔'; }
        else if (phaseAngle < 202.5) { phaseName = 'Full Moon'; phaseEmoji = '🌕'; }
        else if (phaseAngle < 247.5) { phaseName = 'Waning Gibbous'; phaseEmoji = '🌖'; }
        else if (phaseAngle < 292.5) { phaseName = 'Last Quarter'; phaseEmoji = '🌗'; }
        else if (phaseAngle < 337.5) { phaseName = 'Waning Crescent'; phaseEmoji = '🌘'; }
        else { phaseName = 'New Moon'; phaseEmoji = '🌑'; }

        // Horizontal position
        let altitude = null, azimuth = null;
        try {
            const equ = Astronomy.Equator('Moon', date, observer, true, true);
            const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, 'normal');
            altitude = hor.altitude;
            azimuth = hor.azimuth;
        } catch (e) { }

        // Distance
        let distanceKm = null, angularDiam = null, isSupermoon = false;
        try {
            // Moon distance from Earth
            const vec = Astronomy.GeoVector('Moon', date, true);
            distanceKm = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z) * 149597870.7;
            // Angular diameter (Moon actual diameter = 3474km)
            angularDiam = 2 * Math.atan(3474 / (2 * distanceKm)) * (180 / Math.PI) * 60; // arcminutes
            // Supermoon: full moon within ~10% of perigee (~363,300 km)
            isSupermoon = distanceKm < 363300 && (phaseAngle > 160 && phaseAngle < 200);
        } catch (e) { }

        // Rise/Set times
        let riseTime = null, setTime = null;
        try {
            const rise = Astronomy.SearchRiseSet('Moon', observer, +1, date, 1);
            if (rise) riseTime = rise.date;
            const setResult = Astronomy.SearchRiseSet('Moon', observer, -1, date, 1);
            if (setResult) setTime = setResult.date;
        } catch (e) { }

        // Next full moon and new moon
        let nextFullMoon = null, nextNewMoon = null;
        try {
            // Search forward for next full moon (phase near 180°)
            nextFullMoon = Astronomy.SearchMoonPhase(180, date, 30);
            nextNewMoon = Astronomy.SearchMoonPhase(0, date, 30);
        } catch (e) { }

        // Next lunar eclipse
        let nextEclipse = null;
        try {
            const eclipse = Astronomy.SearchLunarEclipse(date);
            if (eclipse && eclipse.peak) {
                nextEclipse = {
                    date: eclipse.peak.date,
                    kind: eclipse.kind,
                };
            }
        } catch (e) { }

        return {
            phaseAngle, illumination, magnitude, phaseName, phaseEmoji,
            altitude, azimuth, distanceKm, angularDiam, isSupermoon,
            riseTime, setTime, nextFullMoon, nextNewMoon, nextEclipse,
        };
    }, [date, location]);

    // === Monthly calendar phases ===
    const calendarDays = useMemo(() => {
        const days = [];
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

        // Pad start
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(calendarYear, calendarMonth, d, 12, 0, 0);
            let phase = 0;
            try { phase = Astronomy.MoonPhase(dayDate); } catch (e) { }

            let emoji;
            if (phase < 22.5) emoji = '🌑';
            else if (phase < 67.5) emoji = '🌒';
            else if (phase < 112.5) emoji = '🌓';
            else if (phase < 157.5) emoji = '🌔';
            else if (phase < 202.5) emoji = '🌕';
            else if (phase < 247.5) emoji = '🌖';
            else if (phase < 292.5) emoji = '🌗';
            else if (phase < 337.5) emoji = '🌘';
            else emoji = '🌑';

            const isToday = d === date.getDate() &&
                calendarMonth === date.getMonth() &&
                calendarYear === date.getFullYear();

            days.push({ day: d, emoji, phase, isToday });
        }

        return days;
    }, [calendarMonth, calendarYear, date]);

    const formatTime = (d) => {
        if (!d) return '—';
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (d) => {
        if (!d) return '—';
        const dt = d instanceof Date ? d : new Date(d);
        return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const daysUntil = (futureDate) => {
        if (!futureDate) return '—';
        const dt = futureDate instanceof Date ? futureDate : new Date(futureDate);
        const diff = Math.ceil((dt - date) / (1000 * 60 * 60 * 24));
        return diff < 0 ? '—' : `${diff}d`;
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (!open) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 z-50 glass-panel overflow-y-auto animate-slideRight"
            style={{ backdropFilter: 'blur(20px)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-5 py-4 border-b border-cosmos-border/30 flex items-center justify-between"
                style={{ background: 'inherit' }}>
                <h2 className="text-lg font-bold text-cosmos-accent flex items-center gap-2">
                    🌙 Moon Dashboard
                </h2>
                <button onClick={onClose}
                    className="text-cosmos-muted hover:text-cosmos-text text-xl transition-colors">×</button>
            </div>

            <div className="p-5 space-y-5">
                {/* Current Phase Hero */}
                <div className="text-center">
                    <div className="text-6xl mb-2">{moonData.phaseEmoji}</div>
                    <h3 className="text-xl font-bold text-cosmos-text">{moonData.phaseName}</h3>
                    <p className="text-sm text-cosmos-muted mt-1">
                        {(moonData.illumination * 100).toFixed(1)}% illuminated
                    </p>
                    {moonData.isSupermoon && (
                        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold">
                            ⭐ SUPERMOON
                        </div>
                    )}
                </div>

                {/* Position & Distance */}
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Altitude" value={moonData.altitude != null ? `${moonData.altitude.toFixed(1)}°` : '—'}
                        icon={moonData.altitude > 0 ? '🔼' : '🔽'}
                        highlight={moonData.altitude > 0} />
                    <InfoCard label="Azimuth" value={moonData.azimuth != null ? `${moonData.azimuth.toFixed(1)}°` : '—'} icon="🧭" />
                    <InfoCard label="Distance" value={moonData.distanceKm ? `${Math.round(moonData.distanceKm).toLocaleString()} km` : '—'} icon="📏" />
                    <InfoCard label="Apparent Size" value={moonData.angularDiam ? `${moonData.angularDiam.toFixed(1)}'` : '—'} icon="🔭" />
                </div>

                {/* Rise / Set */}
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Moonrise" value={formatTime(moonData.riseTime)} icon="🌅" highlight={true} />
                    <InfoCard label="Moonset" value={formatTime(moonData.setTime)} icon="🌇" />
                </div>

                {/* Next Events */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-cosmos-muted uppercase tracking-wider">Upcoming</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <EventRow emoji="🌕" label="Full Moon"
                            date={formatDate(moonData.nextFullMoon?.date)}
                            countdown={daysUntil(moonData.nextFullMoon?.date)} />
                        <EventRow emoji="🌑" label="New Moon"
                            date={formatDate(moonData.nextNewMoon?.date)}
                            countdown={daysUntil(moonData.nextNewMoon?.date)} />
                        {moonData.nextEclipse && (
                            <EventRow emoji="🌘" label={`Lunar Eclipse (${moonData.nextEclipse.kind})`}
                                date={formatDate(moonData.nextEclipse.date)}
                                countdown={daysUntil(moonData.nextEclipse.date)} />
                        )}
                    </div>
                </div>

                {/* Phase Calendar */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-cosmos-muted uppercase tracking-wider">Phase Calendar</h4>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                                else setCalendarMonth(m => m - 1);
                            }} className="text-cosmos-muted hover:text-cosmos-accent text-sm">◀</button>
                            <span className="text-xs text-cosmos-text font-mono">
                                {monthNames[calendarMonth]} {calendarYear}
                            </span>
                            <button onClick={() => {
                                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                                else setCalendarMonth(m => m + 1);
                            }} className="text-cosmos-muted hover:text-cosmos-accent text-sm">▶</button>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-[10px] text-cosmos-muted">{d}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => (
                            <div key={i}
                                className={`text-center py-1 rounded text-xs ${day === null ? '' :
                                        day.isToday ? 'bg-cosmos-accent/20 ring-1 ring-cosmos-accent/40' :
                                            'hover:bg-cosmos-border/20'
                                    }`}
                                title={day ? `Day ${day.day}: Phase ${day.phase.toFixed(0)}°` : ''}>
                                {day && (
                                    <>
                                        <div className="text-sm leading-none">{day.emoji}</div>
                                        <div className={`text-[9px] mt-0.5 ${day.isToday ? 'text-cosmos-accent font-bold' : 'text-cosmos-muted'}`}>
                                            {day.day}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Moon Facts */}
                <div className="text-xs text-cosmos-muted/60 border-t border-cosmos-border/20 pt-3 space-y-1">
                    <p>💡 The Moon is moving away from Earth at 3.8 cm/year.</p>
                    <p>💡 The same side always faces Earth due to tidal locking.</p>
                    <p>💡 A "Supermoon" is a full moon within 10% of perigee distance.</p>
                </div>
            </div>
        </div>
    );
}

// === Sub-components ===
function InfoCard({ label, value, icon, highlight }) {
    return (
        <div className={`rounded-lg px-3 py-2 ${highlight ? 'bg-cosmos-accent/10' : 'bg-cosmos-border/15'}`}>
            <div className="text-[10px] text-cosmos-muted uppercase tracking-wider">{icon} {label}</div>
            <div className="text-sm font-mono text-cosmos-text mt-0.5">{value}</div>
        </div>
    );
}

function EventRow({ emoji, label, date, countdown }) {
    return (
        <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-cosmos-border/15">
            <div className="flex items-center gap-2">
                <span>{emoji}</span>
                <span className="text-xs text-cosmos-text">{label}</span>
            </div>
            <div className="text-right">
                <div className="text-xs font-mono text-cosmos-accent">{date}</div>
                <div className="text-[10px] text-cosmos-muted">{countdown}</div>
            </div>
        </div>
    );
}
