import React, { useState, useEffect, useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * AstroWeather — Astronomical Weather component for stargazing conditions
 * Provides:
 * - Real-time stargazing score (0-100) based on cloud cover, humidity, visibility, wind, moon phase
 * - Tonight's hour-by-hour cloud cover forecast
 * - 3-day outlook with quick ratings
 * - Personalized stargazing recommendations
 * - Uses free Open-Meteo API (no API key needed)
 */

const WEATHER_ICONS = {
  clear: '☀️',
  partlyCloudy: '⛅',
  cloudy: '☁️',
  rain: '🌧️',
};

const SCORE_COLOR = (score) => {
  if (score >= 60) return 'text-green-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-red-400';
};

const SCORE_BG = (score) => {
  if (score >= 60) return 'from-green-500/20 to-green-400/10';
  if (score >= 30) return 'from-yellow-500/20 to-yellow-400/10';
  return 'from-red-500/20 to-red-400/10';
};

export default function AstroWeather({ open, onClose }) {
  const time = useAppStore((s) => s.time);
  const location = useAppStore((s) => s.location);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch weather data from Open-Meteo API
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=cloud_cover,visibility,temperature_2m,relative_humidity_2m,wind_speed_10m&daily=sunset,sunrise&timezone=auto&forecast_days=3`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [open, location.lat, location.lon]);

  // Calculate stargazing score (0-100)
  const stargaze = useMemo(() => {
    if (!weatherData) return { score: 0, breakdown: {} };

    const now = time.current;
    const currentHourIdx = now.getHours();

    const hourlyData = weatherData.hourly;
    const cloudCover = hourlyData.cloud_cover[currentHourIdx] || 50;
    const humidity = hourlyData.relative_humidity_2m[currentHourIdx] || 50;
    const visibility = hourlyData.visibility[currentHourIdx] || 10000;
    const windSpeed = hourlyData.wind_speed_10m[currentHourIdx] || 5;

    // Moon phase illumination
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    let moonIllumination = 0;
    let moonPhaseAngle = 0;
    try {
      const illum = Astronomy.Illumination('Moon', now);
      moonIllumination = illum.phase_fraction; // 0-1
      moonPhaseAngle = Astronomy.MoonPhase(now);
    } catch (e) {
      // Silent fail, use defaults
    }

    // Score calculation
    let score = 0;

    // Cloud cover (most important: 0% = 50pts, 100% = 0pts)
    const cloudScore = Math.max(0, 50 * (1 - cloudCover / 100));
    score += cloudScore;

    // Humidity (low = better, max 10pts, 0% = 10pts, 100% = 0pts)
    const humidityScore = Math.max(0, 10 * (1 - humidity / 100));
    score += humidityScore;

    // Visibility (high = better, max 15pts, 10km = 15pts, <2km = 0pts)
    const visibilityScore = Math.min(15, Math.max(0, (visibility / 10000) * 15));
    score += visibilityScore;

    // Wind speed (low = better for telescope, max 10pts, 0m/s = 10pts, >15m/s = 0pts)
    const windScore = Math.max(0, 10 * (1 - Math.min(1, windSpeed / 15)));
    score += windScore;

    // Moon phase (new moon = 15pts, full moon = 0pts)
    // 0° and 360° = new moon (good), 180° = full moon (bad)
    const normalizedPhase = Math.abs(moonPhaseAngle - 180) / 180; // 0 at full moon, 1 at new moon
    const moonScore = normalizedPhase * 15;
    score += moonScore;

    const finalScore = Math.min(100, Math.round(score));

    return {
      score: finalScore,
      breakdown: {
        cloudCover: Math.round(cloudScore),
        humidity: Math.round(humidityScore),
        visibility: Math.round(visibilityScore),
        wind: Math.round(windScore),
        moon: Math.round(moonScore),
      },
      cloudCover,
      humidity,
      visibility,
      windSpeed,
      moonIllumination,
      moonPhaseAngle,
    };
  }, [weatherData, time, location]);

  // Get sunset/sunrise times and best viewing window
  const timingData = useMemo(() => {
    if (!weatherData) return null;

    const now = time.current;
    const currentDate = now.getDate();
    const dailyData = weatherData.daily;

    // Find today's data (assuming first daily entry is today)
    const todayIdx = 0;
    const sunsetStr = dailyData.sunset[todayIdx];
    const sunriseStr = dailyData.sunrise[todayIdx];

    let sunset = null, sunrise = null;
    try {
      sunset = new Date(sunsetStr);
      sunrise = new Date(sunriseStr);
    } catch (e) {
      return null;
    }

    // Calculate best viewing window (lowest cloud cover between sunset and sunrise)
    const hourlyData = weatherData.hourly;
    let bestHour = sunset.getHours();
    let minCloudCover = 100;

    for (let h = sunset.getHours(); h < 24; h++) {
      const cc = hourlyData.cloud_cover[h] || 100;
      if (cc < minCloudCover) {
        minCloudCover = cc;
        bestHour = h;
      }
    }

    // Also check early morning hours
    for (let h = 0; h <= sunrise.getHours(); h++) {
      const cc = hourlyData.cloud_cover[h] || 100;
      if (cc < minCloudCover) {
        minCloudCover = cc;
        bestHour = h;
      }
    }

    const bestEndHour = (bestHour + 4) % 24;

    return {
      sunset,
      sunrise,
      bestHour,
      bestEndHour,
      minCloudCover,
    };
  }, [weatherData, time]);

  // Hour-by-hour cloud cover chart from sunset to sunrise
  const hourlyChart = useMemo(() => {
    if (!weatherData || !timingData) return [];

    const hourlyData = weatherData.hourly;
    const chartData = [];

    for (let h = timingData.sunset.getHours(); h < 24; h++) {
      chartData.push({
        hour: h,
        cloudCover: hourlyData.cloud_cover[h] || 0,
        temp: hourlyData.temperature_2m[h] || 0,
      });
    }

    for (let h = 0; h <= timingData.sunrise.getHours(); h++) {
      chartData.push({
        hour: h,
        cloudCover: hourlyData.cloud_cover[h] || 0,
        temp: hourlyData.temperature_2m[h] || 0,
      });
    }

    return chartData;
  }, [weatherData, timingData]);

  // 3-day outlook
  const outlookDays = useMemo(() => {
    if (!weatherData) return [];

    const dailyData = weatherData.daily;
    const days = [];

    for (let i = 0; i < Math.min(3, dailyData.sunset.length); i++) {
      const avgCloud = (dailyData.cloud_cover ? dailyData.cloud_cover[i] : 50) || 50;
      let emoji = WEATHER_ICONS.clear;
      let rating = '';

      if (avgCloud < 30) {
        emoji = WEATHER_ICONS.clear;
        rating = 'Clear';
      } else if (avgCloud < 60) {
        emoji = WEATHER_ICONS.partlyCloudy;
        rating = 'Partly Clear';
      } else if (avgCloud < 80) {
        emoji = WEATHER_ICONS.cloudy;
        rating = 'Cloudy';
      } else {
        emoji = WEATHER_ICONS.rain;
        rating = 'Overcast';
      }

      // Quick score for each night
      const dayScore = Math.max(0, 100 * (1 - avgCloud / 100));

      days.push({
        date: new Date(dailyData.sunset[i]),
        emoji,
        rating,
        cloudCover: Math.round(avgCloud),
        score: Math.round(dayScore),
      });
    }

    return days;
  }, [weatherData]);

  // Generate recommendations based on conditions
  const recommendations = useMemo(() => {
    if (!stargaze || !stargaze.cloudCover) return [];

    const recs = [];

    // Cloud cover recommendations
    if (stargaze.cloudCover < 20) {
      recs.push('Tonight is excellent for deep-sky photography. The skies are clear.');
    } else if (stargaze.cloudCover < 50) {
      recs.push('Good conditions for visual observation. Some clouds may appear later.');
    } else {
      recs.push('Significant cloud cover expected. Wait for clearer nights.');
    }

    // Humidity recommendations
    if (stargaze.humidity > 80) {
      recs.push('High humidity may cause dew on optics — bring a dew heater.');
    } else if (stargaze.humidity > 60) {
      recs.push('Moderate humidity. Consider dew prevention equipment.');
    }

    // Wind recommendations
    if (stargaze.windSpeed > 15) {
      recs.push('Strong winds — not ideal for high-magnification viewing.');
    } else if (stargaze.windSpeed > 10) {
      recs.push('Moderate wind. Avoid high-mag observations; use lower power.');
    }

    // Visibility recommendations
    if (stargaze.visibility < 5000) {
      recs.push('Poor visibility due to atmospheric haze. Planets may be difficult to resolve.');
    }

    // Moon phase recommendations
    if (stargaze.moonIllumination > 0.8) {
      recs.push('Moon is bright. Focus on bright deep-sky objects or lunar features.');
    } else if (stargaze.moonIllumination < 0.2) {
      recs.push('New moon phase — perfect for faint nebulae and galaxies.');
    }

    return recs.length > 0 ? recs : ['Check back soon for detailed recommendations.'];
  }, [stargaze]);

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Loading skeleton
  if (!open) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col animate-slideUp">
          <div className="flex items-center justify-between p-6 border-b border-cosmos-border">
            <h2 className="text-xl font-semibold text-cosmos-text">Astronomical Weather</h2>
            <button
              onClick={onClose}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-cosmos-accent/10 to-transparent rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col animate-slideUp">
          <div className="flex items-center justify-between p-6 border-b border-cosmos-border">
            <h2 className="text-xl font-semibold text-cosmos-text">Astronomical Weather</h2>
            <button
              onClick={onClose}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <p className="text-red-400 text-center mb-4">Unable to load weather data</p>
            <p className="text-cosmos-muted text-sm text-center">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-cosmos-accent/20 hover:bg-cosmos-accent/30 text-cosmos-accent rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cosmos-border">
          <h2 className="text-xl font-semibold text-cosmos-text">Astronomical Weather</h2>
          <button
            onClick={onClose}
            className="text-cosmos-muted hover:text-cosmos-text transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stargazing Score Section */}
          <div className="p-6 border-b border-cosmos-border/50">
            <h3 className="text-sm font-semibold text-cosmos-muted mb-4 uppercase tracking-wide">
              Tonight's Stargazing Score
            </h3>
            <div className="flex items-center gap-8">
              {/* Large circular progress indicator */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(126, 184, 247, 0.1)"
                      strokeWidth="3"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        stargaze.score >= 60
                          ? '#4ade80'
                          : stargaze.score >= 30
                            ? '#facc15'
                            : '#f87171'
                      }
                      strokeWidth="3"
                      strokeDasharray={`${(stargaze.score / 100) * 283} 283`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>

                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-4xl font-bold ${SCORE_COLOR(stargaze.score)}`}>
                      {stargaze.score}
                    </div>
                    <div className="text-xs text-cosmos-muted">/ 100</div>
                  </div>
                </div>

                {/* Rating label */}
                <div className="text-center">
                  <div className="text-sm font-semibold text-cosmos-text">
                    {stargaze.score >= 60 ? '🌟 Excellent' : stargaze.score >= 30 ? '⭐ Fair' : '☁️ Poor'}
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="flex-1 space-y-3">
                {[
                  { label: 'Cloud Cover', value: stargaze.breakdown.cloudCover || 0, max: 50 },
                  { label: 'Humidity', value: stargaze.breakdown.humidity || 0, max: 10 },
                  { label: 'Visibility', value: stargaze.breakdown.visibility || 0, max: 15 },
                  { label: 'Wind', value: stargaze.breakdown.wind || 0, max: 10 },
                  { label: 'Moon Phase', value: stargaze.breakdown.moon || 0, max: 15 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-cosmos-muted w-20">{item.label}</span>
                    <div className="flex-1 h-2 bg-cosmos-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cosmos-accent to-cosmos-highlight rounded-full"
                        style={{ width: `${(item.value / item.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-cosmos-text font-medium w-8 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tonight's Forecast */}
          {timingData && (
            <div className="p-6 border-b border-cosmos-border/50">
              <h3 className="text-sm font-semibold text-cosmos-muted mb-4 uppercase tracking-wide">
                Tonight's Cloud Cover Forecast
              </h3>

              {/* Times */}
              <div className="mb-4 text-xs text-cosmos-muted flex justify-between">
                <span>Sunset: {formatTime(timingData.sunset)}</span>
                <span>Best: ~{timingData.bestHour}:00</span>
                <span>Sunrise: {formatTime(timingData.sunrise)}</span>
              </div>

              {/* Bar chart using divs */}
              <div className="flex items-end gap-1 h-32 bg-gradient-to-b from-cosmos-accent/5 to-transparent p-3 rounded-lg border border-cosmos-border">
                {hourlyChart.map((data, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-cosmos-accent to-cosmos-highlight rounded-t-sm hover:from-cosmos-highlight hover:to-cosmos-accent transition-all relative group"
                    style={{ height: `${data.cloudCover}%` }}
                    title={`${data.hour}:00 — ${data.cloudCover}% clouds, ${data.temp}°C`}
                  >
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full mt-1 text-xs text-cosmos-muted opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                      {data.hour}:00
                    </div>
                  </div>
                ))}
              </div>

              {/* Best window recommendation */}
              <div className={`mt-4 p-3 rounded-lg bg-gradient-to-r ${SCORE_BG(stargaze.score)} border border-cosmos-border`}>
                <p className={`text-sm font-semibold ${SCORE_COLOR(stargaze.score)}`}>
                  Best viewing: ~{timingData.bestHour}:00 - {timingData.bestEndHour}:00 ({Math.round(100 - timingData.minCloudCover)}% clear)
                </p>
              </div>
            </div>
          )}

          {/* 3-Day Outlook */}
          <div className="p-6 border-b border-cosmos-border/50">
            <h3 className="text-sm font-semibold text-cosmos-muted mb-4 uppercase tracking-wide">
              3-Day Outlook
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {outlookDays.map((day, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-cosmos-border bg-gradient-to-br from-cosmos-accent/5 to-transparent hover:from-cosmos-accent/10 transition-colors"
                >
                  <div className="text-2xl mb-2">{day.emoji}</div>
                  <div className="text-xs text-cosmos-muted mb-1">
                    {day.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm font-semibold text-cosmos-text mb-2">{day.rating}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-cosmos-accent/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cosmos-accent to-cosmos-highlight"
                        style={{ width: `${day.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-cosmos-text">{day.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-cosmos-muted mb-4 uppercase tracking-wide">
              Stargazing Tips
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-3 rounded-lg bg-cosmos-accent/5 border border-cosmos-border hover:bg-cosmos-accent/10 transition-colors"
                >
                  <span className="text-cosmos-accent flex-shrink-0">💡</span>
                  <p className="text-sm text-cosmos-text leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
