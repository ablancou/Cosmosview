import React from 'react';
import useAppStore from '../store/useAppStore';

/* ══════════════════════════════════════════
   Educational tooltips — shown once per feature
   on first activation.
   ══════════════════════════════════════════ */

const TOOLTIPS = {
    earthGlobe: {
        emoji: '🌍',
        title: 'Earth Observatory',
        desc: 'Photorealistic 3D globe with day/night cycle, atmosphere glow, cloud layer, and real-time satellite orbits. Drag to rotate, scroll to zoom.',
    },
    tonight: {
        emoji: '🌟',
        title: "Tonight's Best Objects",
        desc: 'Shows stars, planets and deep-sky objects visible from your location right now. Tap any object to fly to it in the sky.',
    },
    events: {
        emoji: '🔭',
        title: 'Upcoming Sky Events',
        desc: 'Meteor showers, eclipses, conjunctions and more — filtered for your location with visibility info and countdown timers.',
    },
    moon: {
        emoji: '🌙',
        title: 'Moon Dashboard',
        desc: 'Current lunar phase, moonrise/set times, illumination percentage, and upcoming lunar events.',
    },
    lunarFlyover: {
        emoji: '🚀',
        title: 'Lunar Flyover',
        desc: 'Cinematic low-orbit flight over the Moon\'s surface using NASA LRO textures. Real crater terrain, dramatic lighting, and spacecraft-window perspective. Use arrow keys to look around.',
    },
    orrery: {
        emoji: '☀️',
        title: 'Solar System Orrery',
        desc: 'Interactive 3D model of all planets orbiting the Sun. Real-time positions, orbital paths, and planetary data.',
    },
    orbitalTracker: {
        emoji: '📡',
        title: 'Orbital Tracker',
        desc: 'Real-time 3D visualization of 30+ satellites — ISS, Hubble, Starlink, GPS and more with live telemetry.',
    },
    apod: {
        emoji: '🛸',
        title: 'NASA Picture of the Day',
        desc: "Daily curated astronomy image from NASA with expert explanation. Discover nebulae, galaxies, and cosmic phenomena.",
    },
    liveCams: {
        emoji: '🌐',
        title: 'Live Observatory Cameras',
        desc: 'Real-time video feeds from observatories around the world — Hawaii, Chile, Sweden, Arizona and more.',
    },
    arMode: {
        emoji: '📹',
        title: 'AR Camera Mode',
        desc: 'Point your device at the sky to see star and constellation names overlaid on the real sky. 100% free — works using your camera and motion sensors, no internet needed.',
    },
    quiz: {
        emoji: '🧠',
        title: 'AstroQuiz Challenge',
        desc: '50 astronomy questions across multiple categories. Earn XP, maintain streaks, and learn about the universe.',
    },
    photoPlanner: {
        emoji: '🗓',
        title: 'Astrophotography Planner',
        desc: 'Plan stargazing sessions with Moon phase data, light pollution estimates, and optimal viewing windows.',
    },
    compare: {
        emoji: '🌗',
        title: 'Multi-Location Compare',
        desc: 'Compare the sky view from two different locations side by side. Great for planning observation trips.',
    },
    tutorial: {
        emoji: '❓',
        title: 'App Guide',
        desc: 'Step-by-step tutorial showing how to navigate, search for objects, and use all the features.',
    },
    quickStart: {
        emoji: '🚀',
        title: 'Quick Start',
        desc: 'Curated suggestions to get the most out of Orbital Dome — from sunsets to satellite tracking.',
    },
    share: {
        emoji: '🔗',
        title: 'Share This Sky',
        desc: 'Generate a unique link that captures your exact sky view — location, time, and everything visible. Anyone who opens it sees the same sky you see.',
    },
    eventNotif: {
        emoji: '🔔',
        title: 'Alerts & ISS Passes',
        desc: 'Get notified about ISS visible passes over your location, upcoming eclipses, meteor showers, and more. Never miss an event.',
    },
    telescope: {
        emoji: '🔭',
        title: 'Telescope Mode',
        desc: 'Simulate viewing deep-sky objects through different telescopes. See how nebulae, galaxies, and star clusters look at various magnifications and apertures.',
    },
    astroWeather: {
        emoji: '🌤️',
        title: 'Stargazing Weather',
        desc: 'Real-time cloud cover, visibility, humidity, and a stargazing score for your location. Tells you the best viewing window tonight.',
    },
    accessibility: {
        emoji: '♿',
        title: 'Accessibility Settings',
        desc: 'High contrast mode, screen reader support, reduced motion, font scaling, and color-blind modes. Astronomy for everyone.',
    },
    lightPollution: {
        emoji: '🌃',
        title: 'Light Pollution Simulator',
        desc: 'See how light pollution affects YOUR sky. Slide from Bortle 1 (pristine dark sky) to Bortle 9 (inner city) and watch stars disappear in real time. Discover what you\'re missing.',
    },
    asteroidTracker: {
        emoji: '☄️',
        title: 'Near-Earth Asteroid Tracker',
        desc: '3D visualization of potentially hazardous asteroids orbiting near Earth. Track Apophis, Bennu, and more with real orbital data from NASA.',
    },
    exoplanets: {
        emoji: '🪐',
        title: 'Exoplanet Explorer',
        desc: 'Visit confirmed alien worlds! Explore TRAPPIST-1, Proxima Centauri, and more star systems with real NASA data. See habitable zone planets that could harbor life.',
    },
    dsnLive: {
        emoji: '📡',
        title: 'Deep Space Network Live',
        desc: 'Watch NASA\'s Deep Space Network communicate with spacecraft across the solar system — Voyager, JWST, Mars rovers, and more. Real mission data in real time.',
    },
};

/**
 * Check if a tooltip has been seen.
 */
export function hasSeenTooltip(featureId) {
    try {
        return !!localStorage.getItem(`od_tip_${featureId}`);
    } catch {
        return false;
    }
}

/**
 * Mark a tooltip as seen.
 */
export function markTooltipSeen(featureId) {
    try {
        localStorage.setItem(`od_tip_${featureId}`, '1');
    } catch {
        // ignore localStorage errors
    }
}

/**
 * Check if there is tooltip content for a feature.
 */
export function hasTooltipFor(featureId) {
    return !!TOOLTIPS[featureId];
}

/**
 * FeatureTooltip overlay component.
 * Shows a brief explanation the first time a feature is activated.
 */
export default function FeatureTooltip({ featureId, onDismiss }) {
    const darkMode = useAppStore((s) => s.darkMode);
    const tooltip = TOOLTIPS[featureId];

    if (!tooltip) {
        onDismiss();
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-6"
            onClick={onDismiss}
            style={{ background: 'rgba(0,0,0,0.55)' }}
        >
            <div
                className="max-w-sm w-full p-5 rounded-2xl animate-slideUp"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: darkMode ? 'rgba(12,14,28,0.97)' : 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: `1px solid ${darkMode ? 'rgba(126,184,247,0.15)' : 'rgba(0,0,0,0.1)'}`,
                    boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
                }}
            >
                {/* Emoji + Title */}
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{tooltip.emoji}</span>
                    <h3
                        className="text-base font-bold"
                        style={{ color: darkMode ? '#e8ecf4' : '#1a1a2e' }}
                    >
                        {tooltip.title}
                    </h3>
                </div>

                {/* Description */}
                <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)' }}
                >
                    {tooltip.desc}
                </p>

                {/* Action button */}
                <button
                    onClick={onDismiss}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                        background: darkMode ? 'rgba(126,184,247,0.15)' : 'rgba(74,144,217,0.12)',
                        color: 'var(--color-cosmos-accent)',
                        border: `1px solid ${darkMode ? 'rgba(126,184,247,0.25)' : 'rgba(74,144,217,0.25)'}`,
                    }}
                >
                    Let's Go!
                </button>
            </div>
        </div>
    );
}
