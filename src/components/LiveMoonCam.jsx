import React, { useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE MOON CAM — Curated live & recent telescope feeds of the Moon.
   Sources: Virtual Telescope Project, Slooh, McDonald Observatory,
   Royal Observatory Greenwich, NASA, and community telescopes.
   ═══════════════════════════════════════════════════════════════════════════ */

const FEED_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live Now' },
  { id: 'telescope', label: 'Telescopes' },
  { id: 'mission', label: 'Missions' },
  { id: 'timelapse', label: 'Timelapse' },
];

const FEEDS = [
  /* ── Live Telescope Feeds ── */
  {
    id: 'virtual-telescope',
    name: 'Virtual Telescope Project',
    desc: 'Live telescope observations from Manciano, Italy. Real-time lunar surface and celestial events.',
    category: 'telescope',
    type: 'live',
    url: 'https://www.virtualtelescope.eu/webtv/',
    youtubeChannel: '@VirtualTelescopeProject',
    youtubeEmbed: 'https://www.youtube.com/embed/live_stream?channel=UC1h0E9SwGiYJ5pjR-sVcdbQ',
    thumbnail: null,
    source: 'Italy',
    badge: 'LIVE',
  },
  {
    id: 'nasa-live',
    name: 'NASA Live',
    desc: 'Official NASA TV stream. Artemis II mission coverage, spacewalks, and ISS views.',
    category: 'mission',
    type: 'live',
    url: 'https://www.nasa.gov/live/',
    youtubeEmbed: 'https://www.youtube.com/embed/21X5lGlDOfg?autoplay=0',
    thumbnail: null,
    source: 'NASA',
    badge: 'LIVE',
  },
  {
    id: 'artemis-ii-tracker',
    name: 'Artemis II — Live Tracking',
    desc: 'Track the Artemis II crew as they fly around the Moon. Live telemetry and camera views.',
    category: 'mission',
    type: 'live',
    url: 'https://www.nasa.gov/artemis-ii/',
    youtubeEmbed: 'https://www.youtube.com/embed/live_stream?channel=UCLA_DiR1FfKNvjuUpBHmylQ',
    thumbnail: null,
    source: 'NASA',
    badge: 'LIVE',
  },
  /* ── Telescope Archives & Recurring Streams ── */
  {
    id: 'mcdonald-obs',
    name: 'McDonald Observatory',
    desc: 'Live deep-sky tours and lunar close-ups from the Davis Mountains, Texas.',
    category: 'telescope',
    type: 'recurring',
    url: 'https://mcdonaldobservatory.org/visitors/livestream',
    youtubeEmbed: 'https://www.youtube.com/embed/live_stream?channel=UCOxl8GZPbPGxZcFSFsoGwrw',
    thumbnail: null,
    source: 'Texas, USA',
    badge: null,
  },
  {
    id: 'royal-observatory',
    name: 'Royal Observatory Greenwich',
    desc: 'AMAT telescope: detailed Moon surface views, live events and lunar occultations.',
    category: 'telescope',
    type: 'recurring',
    url: 'https://www.rmg.co.uk/whats-on/space-live',
    youtubeEmbed: 'https://www.youtube.com/embed/live_stream?channel=UC_x5XG1OV2P6uZZ5FSM9Ttw',
    thumbnail: null,
    source: 'London, UK',
    badge: null,
  },
  {
    id: 'slooh',
    name: 'Slooh Telescopes',
    desc: 'Remote telescopes in Chile & Canary Islands. Lunar surface close-ups and guided tours.',
    category: 'telescope',
    type: 'recurring',
    url: 'https://www.slooh.com',
    youtubeEmbed: 'https://www.youtube.com/embed/live_stream?channel=UC8bVCpkOgrusowNMwKL8Jmg',
    thumbnail: null,
    source: 'Chile / Canarias',
    badge: null,
  },
  /* ── Curated Moon Videos ── */
  {
    id: 'moon-4k-nasa',
    name: 'Tour of the Moon in 4K',
    desc: 'NASA SVS: stunning 4K flyover using Lunar Reconnaissance Orbiter data.',
    category: 'timelapse',
    type: 'video',
    youtubeEmbed: 'https://www.youtube.com/embed/nr5Pj6GQL2o',
    thumbnail: null,
    source: 'NASA SVS',
    badge: '4K',
  },
  {
    id: 'moon-rotation-4k',
    name: 'Moon Phases — Full Year',
    desc: 'Every phase of the Moon across a full year, rendered from LRO data.',
    category: 'timelapse',
    type: 'video',
    youtubeEmbed: 'https://www.youtube.com/embed/5UhOh10MZGM',
    thumbnail: null,
    source: 'NASA SVS',
    badge: '4K',
  },
  {
    id: 'earthrise',
    name: 'Earthrise in HD',
    desc: 'The iconic Earthrise reconstructed from Lunar Orbiter imagery — full HD.',
    category: 'timelapse',
    type: 'video',
    youtubeEmbed: 'https://www.youtube.com/embed/XCrJ3NflOpE',
    thumbnail: null,
    source: 'NASA',
    badge: 'HD',
  },
  {
    id: 'lunar-south-pole',
    name: 'Lunar South Pole Fly-Over',
    desc: 'Fly over the lunar south pole, future landing site for Artemis III.',
    category: 'timelapse',
    type: 'video',
    youtubeEmbed: 'https://www.youtube.com/embed/UIKmSQqp8wY',
    thumbnail: null,
    source: 'NASA/GSFC',
    badge: null,
  },
];

export default function LiveMoonCam({ open, onClose }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [playingFeed, setPlayingFeed] = useState(null);

  const filteredFeeds = FEEDS.filter(f => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'live') return f.type === 'live';
    return f.category === activeFilter;
  });

  const handlePlay = useCallback((feed) => {
    setPlayingFeed(feed);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setPlayingFeed(null);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl mx-auto flex flex-col overflow-hidden animate-slideUp"
        style={{
          maxHeight: 'min(92vh, 750px)',
          background: 'rgba(8,10,22,0.97)',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(126,184,247,0.1)',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔭</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Live Moon Cam</h2>
              <p className="text-[10px] text-white/40 mt-0.5">Real telescope feeds & lunar footage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-5 py-3 overflow-x-auto no-scrollbar">
          {FEED_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0"
              style={{
                background: activeFilter === cat.id ? 'rgba(126,184,247,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeFilter === cat.id ? '#7eb8f7' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${activeFilter === cat.id ? 'rgba(126,184,247,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {cat.label}
              {cat.id === 'live' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 align-middle" style={{
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                  animation: 'pulse-glow-red 2s ease-in-out infinite',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Feed grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          <div className="grid gap-3">
            {filteredFeeds.map(feed => (
              <button
                key={feed.id}
                onClick={() => handlePlay(feed)}
                className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] group"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Preview area */}
                <div className="relative h-36 sm:h-44 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,15,35,1) 0%, rgba(8,10,22,1) 100%)',
                  }}
                >
                  {/* Decorative moon gradient */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <div className="w-24 h-24 rounded-full" style={{
                      background: 'radial-gradient(circle at 35% 35%, rgba(200,200,200,0.4), rgba(80,80,80,0.1) 70%, transparent)',
                    }} />
                  </div>

                  {/* Play button */}
                  <div className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <path d="M6.5 4.5v11l9-5.5-9-5.5z" />
                    </svg>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {feed.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider" style={{
                        background: feed.badge === 'LIVE' ? 'rgba(239,68,68,0.25)' : 'rgba(126,184,247,0.15)',
                        color: feed.badge === 'LIVE' ? '#ef4444' : '#7eb8f7',
                        border: `1px solid ${feed.badge === 'LIVE' ? 'rgba(239,68,68,0.3)' : 'rgba(126,184,247,0.25)'}`,
                      }}>
                        {feed.badge === 'LIVE' && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{
                            background: '#ef4444',
                            animation: 'pulse-glow-red 2s ease-in-out infinite',
                          }} />
                        )}
                        {feed.badge}
                      </span>
                    )}
                    {feed.type === 'recurring' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium" style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        Scheduled
                      </span>
                    )}
                  </div>

                  {/* Source */}
                  <span className="absolute bottom-3 right-3 text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {feed.source}
                  </span>
                </div>

                {/* Info */}
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-white/85 mb-1">{feed.name}</h3>
                  <p className="text-[11px] leading-relaxed text-white/35">{feed.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {filteredFeeds.length === 0 && (
            <div className="text-center py-12 text-white/25 text-sm">
              No feeds in this category right now.
            </div>
          )}
        </div>

        {/* Attribution */}
        <div className="px-5 py-2 border-t border-white/5 text-center">
          <p className="text-[9px] text-white/20">
            Streams sourced from NASA, Virtual Telescope Project, observatories & YouTube.
            Availability depends on live schedule.
          </p>
        </div>
      </div>

      {/* ═══ Video Player Overlay ═══ */}
      {playingFeed && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/90" onClick={handleClosePlayer} />
          <div className="relative z-10 w-full max-w-3xl mx-4">
            {/* Close button */}
            <button
              onClick={handleClosePlayer}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors z-20"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>

            {/* Title */}
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-white text-sm font-semibold">{playingFeed.name}</h3>
              {playingFeed.badge === 'LIVE' && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{
                  background: 'rgba(239,68,68,0.25)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{
                    background: '#ef4444',
                    animation: 'pulse-glow-red 2s ease-in-out infinite',
                  }} />
                  LIVE
                </span>
              )}
            </div>

            {/* YouTube embed */}
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`${playingFeed.youtubeEmbed}${playingFeed.youtubeEmbed.includes('?') ? '&' : '?'}rel=0&modestbranding=1`}
                title={playingFeed.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>

            {/* Description */}
            <p className="mt-3 text-[11px] text-white/35">{playingFeed.desc}</p>

            {/* External link */}
            {playingFeed.url && (
              <a
                href={playingFeed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium transition-colors"
                style={{ color: '#7eb8f7' }}
              >
                Visit source
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 1h6v6M9 1L1 9" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
