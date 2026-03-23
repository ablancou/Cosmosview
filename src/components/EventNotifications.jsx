import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * EventNotifications — Event notification system for Orbital Dome
 * Features:
 * - ISS Pass Predictions: next 3 visible passes
 * - Upcoming Events: meteor showers, eclipses, lunar phases, planet events
 * - Notification Permission toggle with push notifications
 * - Tab-based interface: "ISS Passes" | "Events" | "Alerts"
 * - Dark glassmorphism theme with Tailwind styling
 */

// Annual meteor shower data with approximate peak dates
const METEOR_SHOWERS = [
  { name: 'Quadrantids', month: 1, day: 4, zhr: 120 },
  { name: 'Lyrids', month: 4, day: 22, zhr: 20 },
  { name: 'Eta Aquariids', month: 5, day: 5, zhr: 65 },
  { name: 'Delta Aquariids', month: 7, day: 29, zhr: 20 },
  { name: 'Perseids', month: 8, day: 12, zhr: 100 },
  { name: 'Draconids', month: 10, day: 9, zhr: 10 },
  { name: 'Orionids', month: 10, day: 21, zhr: 15 },
  { name: 'Geminids', month: 12, day: 14, zhr: 150 },
];

// Planet opposition/conjunction approximate dates (example year 2026)
const PLANET_EVENTS = [
  { name: 'Mars Opposition', date: new Date(2026, 6, 1), description: 'Mars closest to Earth' },
  { name: 'Jupiter Opposition', date: new Date(2026, 8, 29), description: 'Best viewing of Jupiter' },
  { name: 'Saturn Opposition', date: new Date(2026, 8, 6), description: 'Saturn brightest' },
  { name: 'Mercury Greatest Elongation', date: new Date(2026, 2, 15), description: 'Mercury visibility peak' },
  { name: 'Venus Conjunction', date: new Date(2026, 10, 15), description: 'Venus near Sun' },
];

/**
 * Calculate ISS visibility passes for observer location
 * Returns array of passes with visibility details
 */
function calculateISSPasses(observer, currentDate, numPasses = 3) {
  const passes = [];
  let searchDate = new Date(currentDate);
  let found = 0;

  try {
    while (found < numPasses && searchDate < new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      // ISS orbital period is ~92 minutes
      // Search in ~90 minute chunks to find next rise
      const nextHorizonDate = new Date(searchDate.getTime() + 90 * 60 * 1000);

      try {
        const riseEvent = Astronomy.SearchRiseSet('ISS', observer, Astronomy.Direction.Rise, searchDate, 10);
        if (!riseEvent) {
          searchDate = nextHorizonDate;
          continue;
        }

        // Get culmination (highest point)
        const culminationDate = new Date(riseEvent.date.getTime() + 3 * 60 * 1000);
        const equ = Astronomy.Equatorial('ISS', culminationDate, observer, true, true);
        const altitude = 90 - Astronomy.AngleSeparation(equ, { ra: 0, dec: 0, distance: 0 });

        // Check if ISS is in sunlight and observer is in darkness (visibility condition)
        const sunEqu = Astronomy.Equatorial('Sun', culminationDate, observer, true, true);
        const issLit = Astronomy.Illumination('ISS', culminationDate).phase_fraction > 0.1;
        const observerDark = Astronomy.Illumination('Sun', culminationDate).phase_fraction < 0.1;

        if (altitude > 10 && issLit && observerDark) {
          const setEvent = Astronomy.SearchRiseSet('ISS', observer, Astronomy.Direction.Set, riseEvent.date, 10);
          passes.push({
            rise: riseEvent.date,
            culmination: culminationDate,
            set: setEvent ? setEvent.date : new Date(culminationDate.getTime() + 5 * 60 * 1000),
            maxAltitude: Math.max(10, Math.min(90, altitude)),
            duration: setEvent ? (setEvent.date - riseEvent.date) / 60000 : 10,
          });
          found++;
        }

        searchDate = nextHorizonDate;
      } catch (e) {
        searchDate = nextHorizonDate;
      }
    }
  } catch (e) {
    console.error('Error calculating ISS passes:', e);
  }

  return passes;
}

/**
 * Calculate next moon phases
 */
function getNextMoonPhases(currentDate, count = 2) {
  const phases = [];
  let searchDate = new Date(currentDate);

  try {
    // Search for new moons
    for (let i = 0; i < count; i++) {
      const newMoon = Astronomy.SearchMoonPhase(0, searchDate, 100);
      if (newMoon) {
        phases.push({
          type: 'New Moon',
          emoji: '🌑',
          date: newMoon.date,
          description: 'Moon between Earth and Sun',
        });
        searchDate = new Date(newMoon.date.getTime() + 1000 * 60 * 60 * 24 * 15);
      }
    }

    // Search for full moons
    searchDate = new Date(currentDate);
    for (let i = 0; i < count; i++) {
      const fullMoon = Astronomy.SearchMoonPhase(180, searchDate, 100);
      if (fullMoon) {
        phases.push({
          type: 'Full Moon',
          emoji: '🌕',
          date: fullMoon.date,
          description: 'Moon opposite Sun',
        });
        searchDate = new Date(fullMoon.date.getTime() + 1000 * 60 * 60 * 24 * 15);
      }
    }
  } catch (e) {
    console.error('Error calculating moon phases:', e);
  }

  return phases.sort((a, b) => a.date - b.date);
}

/**
 * Get next lunar eclipse
 */
function getNextLunarEclipse(currentDate) {
  try {
    const eclipse = Astronomy.SearchLunarEclipse(currentDate);
    if (eclipse && eclipse.peak) {
      return {
        type: 'Lunar Eclipse',
        emoji: '🌑',
        date: eclipse.peak.date,
        description: `${eclipse.kind} lunar eclipse`,
      };
    }
  } catch (e) {
    console.error('Error calculating lunar eclipse:', e);
  }
  return null;
}

/**
 * Get next solar eclipse
 */
function getNextSolarEclipse(currentDate) {
  try {
    const eclipse = Astronomy.SearchSolarEclipse(currentDate);
    if (eclipse && eclipse.peak) {
      return {
        type: 'Solar Eclipse',
        emoji: '🌘',
        date: eclipse.peak.date,
        description: `${eclipse.kind} solar eclipse`,
      };
    }
  } catch (e) {
    console.error('Error calculating solar eclipse:', e);
  }
  return null;
}

/**
 * Get next meteor shower
 */
function getNextMeteorShower(currentDate) {
  const now = new Date();
  const year = now.getFullYear();

  for (const shower of METEOR_SHOWERS) {
    const peakDate = new Date(year, shower.month - 1, shower.day);
    if (peakDate >= currentDate) {
      return {
        type: 'Meteor Shower',
        emoji: '☄️',
        date: peakDate,
        description: `Peak ZHR: ${shower.zhr}`,
        name: shower.name,
      };
    }
  }

  // Wrap to next year
  const shower = METEOR_SHOWERS[0];
  const peakDate = new Date(year + 1, shower.month - 1, shower.day);
  return {
    type: 'Meteor Shower',
    emoji: '☄️',
    date: peakDate,
    description: `Peak ZHR: ${shower.zhr}`,
    name: shower.name,
  };
}

/**
 * Get next planet event
 */
function getNextPlanetEvent(currentDate) {
  const year = new Date().getFullYear();
  const relevantEvents = PLANET_EVENTS.map(e => ({
    ...e,
    date: new Date(e.date.getFullYear() === 2026 ? year : e.date.getFullYear(), e.date.getMonth(), e.date.getDate()),
  })).filter(e => e.date >= currentDate).sort((a, b) => a.date - b.date);

  if (relevantEvents.length > 0) {
    return {
      type: 'Planet Event',
      emoji: '🪐',
      date: relevantEvents[0].date,
      description: relevantEvents[0].description,
      name: relevantEvents[0].name,
    };
  }

  return null;
}

/**
 * Format countdown text (e.g., "in 3 days")
 */
function formatCountdown(date) {
  const now = new Date();
  const diff = date - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diff < 0) return 'Past event';
  if (days > 0) return `in ${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Format time for display
 */
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date for display
 */
function formatDate(date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Schedule notification for an event
 */
function scheduleNotification(eventName, eventDate, notificationRef) {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const timeUntil = eventDate - now;

  if (timeUntil > 0 && timeUntil <= 24 * 60 * 60 * 1000) {
    // Schedule notification for 1 hour before event
    const notifyTime = Math.max(0, timeUntil - 60 * 60 * 1000);
    const timeoutId = setTimeout(() => {
      new Notification(`Orbital Dome Event`, {
        body: `${eventName} is coming up!`,
        icon: '/logo.png',
        tag: `event-${eventName}`,
      });
    }, notifyTime);

    // Store timeout ID for cleanup
    if (notificationRef.current) {
      notificationRef.current.push(timeoutId);
    }
  }
}

export default function EventNotifications({ open, onClose }) {
  const time = useAppStore((s) => s.time);
  const location = useAppStore((s) => s.location);
  const [activeTab, setActiveTab] = useState('iss');
  const [notificationPerm, setNotificationPerm] = useState(
    typeof window !== 'undefined' ? Notification?.permission || 'default' : 'default'
  );
  const notificationTimeoutsRef = useRef([]);

  const currentDate = time.current;

  // Calculate ISS passes
  const issPasses = useMemo(() => {
    try {
      const observer = new Astronomy.Observer(location.lat, location.lon, 0);
      return calculateISSPasses(observer, currentDate, 3);
    } catch (e) {
      console.error('ISS calculation error:', e);
      return [];
    }
  }, [location.lat, location.lon, currentDate]);

  // Calculate upcoming events
  const upcomingEvents = useMemo(() => {
    const events = [];

    // Add moon phases
    const moonPhases = getNextMoonPhases(currentDate, 1);
    events.push(...moonPhases);

    // Add lunar eclipse
    const lunarEclipse = getNextLunarEclipse(currentDate);
    if (lunarEclipse && lunarEclipse.date > currentDate) {
      events.push(lunarEclipse);
    }

    // Add solar eclipse
    const solarEclipse = getNextSolarEclipse(currentDate);
    if (solarEclipse && solarEclipse.date > currentDate) {
      events.push(solarEclipse);
    }

    // Add meteor shower
    const meteorShower = getNextMeteorShower(currentDate);
    if (meteorShower) {
      events.push(meteorShower);
    }

    // Add planet event
    const planetEvent = getNextPlanetEvent(currentDate);
    if (planetEvent) {
      events.push(planetEvent);
    }

    return events.sort((a, b) => a.date - b.date).slice(0, 5);
  }, [currentDate]);

  // Request notification permission and schedule notifications
  const handleNotificationToggle = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPerm(perm);

    if (perm === 'granted') {
      // Schedule notifications for upcoming events
      upcomingEvents.forEach(event => {
        scheduleNotification(event.name || event.type, event.date, notificationTimeoutsRef);
      });
    }
  }, [upcomingEvents]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notificationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      notificationTimeoutsRef.current = [];
    };
  }, []);

  if (!open) return null;

  const getPermissionColor = () => {
    switch (notificationPerm) {
      case 'granted':
        return 'text-green-400';
      case 'denied':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getPermissionText = () => {
    switch (notificationPerm) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      default:
        return 'Notifications not configured';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl h-[80vh] pointer-events-auto rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/30 bg-slate-900/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Event Notifications
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-700/30 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4 border-b border-slate-700/30 bg-slate-900/30">
            {[
              { id: 'iss', label: '🛰 ISS Passes' },
              { id: 'events', label: '🌌 Events' },
              { id: 'alerts', label: '🔔 Alerts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* ISS Passes Tab */}
            {activeTab === 'iss' && (
              <div className="space-y-4">
                {issPasses.length > 0 ? (
                  issPasses.map((pass, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🛰</span>
                          <div>
                            <h3 className="font-semibold text-cyan-300">Pass #{idx + 1}</h3>
                            <p className="text-sm text-slate-400">
                              {formatDate(pass.rise)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-cyan-400 font-medium">
                            Max elevation: {pass.maxAltitude.toFixed(0)}°
                          </p>
                          <p className="text-xs text-slate-500">
                            Duration: {pass.duration.toFixed(0)} min
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="p-2 rounded bg-slate-900/40 border border-slate-700/30">
                          <p className="text-slate-500 text-xs">Rise</p>
                          <p className="text-slate-200 font-mono">
                            {formatTime(pass.rise)}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-slate-900/40 border border-slate-700/30">
                          <p className="text-slate-500 text-xs">Peak</p>
                          <p className="text-slate-200 font-mono">
                            {formatTime(pass.culmination)}
                          </p>
                        </div>
                        <div className="p-2 rounded bg-slate-900/40 border border-slate-700/30">
                          <p className="text-slate-500 text-xs">Set</p>
                          <p className="text-slate-200 font-mono">
                            {formatTime(pass.set)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-lg">No visible ISS passes in the next 30 days</p>
                    <p className="text-sm mt-2">Try a different location for better visibility</p>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl mt-1">{event.emoji}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-100">
                              {event.name || event.type}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {event.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {formatDate(event.date)} · {formatTime(event.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-400">
                            {formatCountdown(event.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-lg">No upcoming events found</p>
                  </div>
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-orange-500/20">
                  <h3 className="font-semibold text-slate-100 mb-3">Push Notifications</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-700/30">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Browser Notifications</p>
                        <p className={`text-xs mt-1 ${getPermissionColor()}`}>
                          {getPermissionText()}
                        </p>
                      </div>
                      <button
                        onClick={handleNotificationToggle}
                        disabled={notificationPerm === 'denied'}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          notificationPerm === 'granted'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : notificationPerm === 'denied'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed opacity-50'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30'
                        }`}
                      >
                        {notificationPerm === 'granted' ? '✓ Enabled' : 'Enable'}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 text-sm text-slate-400">
                      <p className="text-xs text-slate-500 mb-1">How it works:</p>
                      <ul className="space-y-1 text-xs">
                        <li>✓ Notifications for events within 24 hours</li>
                        <li>✓ Alert sent 1 hour before each event</li>
                        <li>✓ Works even if Orbital Dome is closed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/30">
                  <h3 className="font-semibold text-slate-100 mb-3">Upcoming Notifications</h3>

                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingEvents.slice(0, 3).map((event, idx) => {
                        const isWithin24h = (event.date - currentDate) / (1000 * 60 * 60) <= 24;
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded text-sm ${
                              isWithin24h
                                ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                                : 'bg-slate-900/40 border border-slate-700/30 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{event.emoji} {event.name || event.type}</span>
                              <span className="text-xs">
                                {isWithin24h ? '🔔 ' : ''}{formatCountdown(event.date)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No upcoming notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/30 bg-slate-900/50 flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Location: {location.city} ({location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°)
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
