import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import * as Astronomy from 'astronomy-engine';

/**
 * Information panel for planets and Moon.
 * Shows real NASA imagery, astronomical data, and fun facts.
 */

// Real NASA/JPL/ESA images — all public domain or CC
const NASA_IMAGES = {
    Sun: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/480px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    Moon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/480px-FullMoon2010.jpg',
    Mercury: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/480px-Mercury_in_true_color.jpg',
    Venus: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/PIA23791-Venus-NewlyProcessedView-20200608.jpg/480px-PIA23791-Venus-NewlyProcessedView-20200608.jpg',
    Mars: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png/480px-Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png',
    Jupiter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Jupiter_New_Horizons.jpg/480px-Jupiter_New_Horizons.jpg',
    Saturn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/480px-Saturn_during_Equinox.jpg',
};

// Detailed descriptions
const DESCRIPTIONS = {
    Sun: {
        type: 'G2V Main Sequence Star',
        diameter: '1,391,000 km',
        temp: '5,778 K (surface)',
        fact: 'The Sun contains 99.86% of the Solar System\'s mass. Light from the Sun takes 8 minutes 20 seconds to reach Earth.',
        credit: 'NASA/SDO',
    },
    Moon: {
        type: 'Natural Satellite',
        diameter: '3,474 km',
        temp: '-173°C to 127°C',
        fact: 'The Moon is tidally locked — the same side always faces Earth. It\'s slowly drifting away at 3.8 cm/year.',
        credit: 'NASA',
    },
    Mercury: {
        type: 'Terrestrial Planet',
        diameter: '4,879 km',
        temp: '-180°C to 430°C',
        fact: 'Mercury has the most extreme temperature variation of any planet. Despite being closest to the Sun, it\'s not the hottest — Venus is.',
        credit: 'NASA/MESSENGER',
    },
    Venus: {
        type: 'Terrestrial Planet',
        diameter: '12,104 km',
        temp: '462°C (surface avg)',
        fact: 'Venus rotates backwards and so slowly that a day on Venus (243 Earth days) is longer than its year (225 Earth days).',
        credit: 'NASA/JPL-Caltech',
    },
    Mars: {
        type: 'Terrestrial Planet',
        diameter: '6,779 km',
        temp: '-87°C to -5°C',
        fact: 'Mars has the tallest volcano (Olympus Mons, 21.9 km) and the deepest canyon (Valles Marineris, 7 km deep) in the Solar System.',
        credit: 'NASA/JPL/Kevin M. Gill',
    },
    Jupiter: {
        type: 'Gas Giant',
        diameter: '139,820 km',
        temp: '-110°C (cloud tops)',
        fact: 'Jupiter\'s Great Red Spot is a storm 1.3× wider than Earth that has been raging for over 350 years.',
        credit: 'NASA/Johns Hopkins APL',
    },
    Saturn: {
        type: 'Gas Giant',
        diameter: '116,460 km',
        temp: '-178°C (cloud tops)',
        fact: 'Saturn\'s rings are mostly water ice and rock, spanning 282,000 km but averaging only 10 meters thick. Saturn could float in water.',
        credit: 'NASA/JPL/SSI',
    },
};

export default function CelestialInfoPanel() {
    const { t } = useTranslation();
    const selectedBody = useAppStore((s) => s.selectedBody);
    const clearSelectedBody = useAppStore((s) => s.clearSelectedBody);
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);

    if (!selectedBody) return null;

    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    const date = time.current;
    const name = selectedBody.name;

    // Get extra info
    let info = {};
    try {
        if (name !== 'Sun') {
            const illum = Astronomy.Illumination(name, date);
            info.magnitude = illum.mag?.toFixed(1);
            info.phaseFraction = (illum.phase_fraction * 100)?.toFixed(0);
        }
        const hor = Astronomy.Horizon(date, observer, selectedBody.ra, selectedBody.dec, 'normal');
        info.altitude = hor.altitude?.toFixed(1);
        info.azimuth = hor.azimuth?.toFixed(1);

        if (name === 'Moon') {
            const phase = Astronomy.MoonPhase(date);
            if (phase < 22.5) info.phaseName = 'New Moon 🌑';
            else if (phase < 67.5) info.phaseName = 'Waxing Crescent 🌒';
            else if (phase < 112.5) info.phaseName = 'First Quarter 🌓';
            else if (phase < 157.5) info.phaseName = 'Waxing Gibbous 🌔';
            else if (phase < 202.5) info.phaseName = 'Full Moon 🌕';
            else if (phase < 247.5) info.phaseName = 'Waning Gibbous 🌖';
            else if (phase < 292.5) info.phaseName = 'Last Quarter 🌗';
            else if (phase < 337.5) info.phaseName = 'Waning Crescent 🌘';
            else info.phaseName = 'New Moon 🌑';
        }
    } catch (e) { }

    const desc = DESCRIPTIONS[name] || {};

    return (
        <div className="fixed bottom-4 right-4 z-30 w-[340px] glass-panel overflow-hidden animate-slideUp">
            {/* NASA Image */}
            {NASA_IMAGES[name] && (
                <div className="w-full h-40 overflow-hidden relative">
                    <img
                        src={NASA_IMAGES[name]}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white drop-shadow-lg">
                                {t(`planets.${name.toLowerCase()}`, name)}
                            </h3>
                            {desc.type && (
                                <p className="text-[10px] text-white/70">{desc.type}</p>
                            )}
                        </div>
                        <button
                            onClick={clearSelectedBody}
                            className="text-white/60 hover:text-white text-xl transition-colors"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-3">
                {/* Moon phase */}
                {info.phaseName && (
                    <div className="px-3 py-1.5 rounded-lg bg-cosmos-border/20 text-sm text-cosmos-text">
                        {info.phaseName}
                        {info.phaseFraction && (
                            <span className="text-xs text-cosmos-muted ml-2">({info.phaseFraction}% illuminated)</span>
                        )}
                    </div>
                )}

                {/* Data grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {info.altitude != null && (
                        <DataCell label="Altitude" value={`${info.altitude}°`} highlight={parseFloat(info.altitude) > 0} />
                    )}
                    {info.azimuth != null && (
                        <DataCell label="Azimuth" value={`${info.azimuth}°`} />
                    )}
                    {info.magnitude != null && (
                        <DataCell label="Magnitude" value={info.magnitude} />
                    )}
                    {desc.diameter && (
                        <DataCell label="Diameter" value={desc.diameter} />
                    )}
                    {desc.temp && (
                        <DataCell label="Temperature" value={desc.temp} />
                    )}
                </div>

                {/* Fun fact */}
                {desc.fact && (
                    <p className="text-xs text-cosmos-muted/80 leading-relaxed border-t border-cosmos-border/20 pt-2">
                        💡 {desc.fact}
                    </p>
                )}

                {/* Credit */}
                {desc.credit && (
                    <p className="text-[9px] text-cosmos-muted/40">Image: {desc.credit} • Public Domain</p>
                )}
            </div>
        </div>
    );
}

function DataCell({ label, value, highlight }) {
    return (
        <div className={`rounded px-2.5 py-1.5 ${highlight ? 'bg-cosmos-accent/10' : 'bg-cosmos-border/15'}`}>
            <div className="text-[9px] text-cosmos-muted uppercase tracking-wider">{label}</div>
            <div className="text-sm font-mono text-cosmos-text">{value}</div>
        </div>
    );
}
