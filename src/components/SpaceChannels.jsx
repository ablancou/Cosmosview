import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   SPACE CHANNELS — Curated space content: live streams, YouTube channels,
   and recommended viewing for space enthusiasts
   ═══════════════════════════════════════════════════════════════════════════ */

const LIVE_STREAMS = [
  {
    id: 'nasa-live',
    name: 'NASA Live',
    url: 'https://www.nasa.gov/live/',
    description: 'Official NASA live broadcast — mission coverage, press conferences, and ISS views',
    language: 'EN',
    type: 'live',
  },
  {
    id: 'nasa-plus',
    name: 'NASA+',
    url: 'https://plus.nasa.gov/',
    description: 'Free ad-free streaming service with documentaries, live events, and original series',
    language: 'EN',
    type: 'live',
  },
  {
    id: 'nasa-youtube',
    name: 'NASA YouTube',
    url: 'https://www.youtube.com/@NASA',
    description: 'Official channel with live launches, ISS feed, and mission coverage. 14M+ subscribers',
    language: 'EN',
    type: 'channel',
  },
  {
    id: 'nasa-espanol',
    name: 'NASA en Español',
    url: 'https://www.youtube.com/@NASAenEspanol',
    description: 'NASA content in Spanish — launches, science, and educational videos',
    language: 'ES',
    type: 'channel',
  },
];

const YOUTUBE_CHANNELS = [
  {
    id: 'everyday-astronaut',
    name: 'Everyday Astronaut',
    url: 'https://www.youtube.com/@EverydayAstronaut',
    host: 'Tim Dodd',
    subscribers: '1.9M+',
    description: 'Deep-dive documentary-style videos on rockets, launches, and space technology. The best visual explanations of rocket science on the internet.',
    language: 'EN',
    specialty: 'Rocket Science & Launches',
  },
  {
    id: 'startalk',
    name: 'StarTalk',
    url: 'https://www.youtube.com/@StarTalk',
    host: 'Neil deGrasse Tyson',
    subscribers: '6M+',
    description: 'Science meets pop culture. Astrophysics, cosmology, and fascinating interviews with experts and comedians.',
    language: 'EN',
    specialty: 'Astrophysics & Pop Science',
  },
  {
    id: 'spacex',
    name: 'SpaceX',
    url: 'https://www.youtube.com/@SpaceX',
    host: 'SpaceX',
    subscribers: '13M+',
    description: 'Official SpaceX channel — live Falcon 9 and Starship launches, landing footage, and mission highlights.',
    language: 'EN',
    specialty: 'Live Launches & Engineering',
  },
  {
    id: 'date-un-vlog',
    name: 'Date un Vlog',
    url: 'https://www.youtube.com/@DateunVlog',
    host: 'Javier Santaolalla',
    subscribers: '4M+',
    description: 'Ex-investigador del CERN explica fisica, cosmologia y el universo con humor. Participo en el descubrimiento del boson de Higgs.',
    language: 'ES',
    specialty: 'Fisica & Cosmologia',
  },
  {
    id: 'scott-manley',
    name: 'Scott Manley',
    url: 'https://www.youtube.com/@scottmanley',
    host: 'Scott Manley',
    subscribers: '1.5M+',
    description: 'Astrophysicist and programmer covering orbital mechanics, space news, and launch analysis with incredible detail.',
    language: 'EN',
    specialty: 'Orbital Mechanics & Analysis',
  },
  {
    id: 'fraser-cain',
    name: 'Fraser Cain / Universe Today',
    url: 'https://www.youtube.com/@universetoday',
    host: 'Fraser Cain',
    subscribers: '1M+',
    description: 'Space news, astronomy Q&A, and deep dives into cosmic phenomena. Running since 1999.',
    language: 'EN',
    specialty: 'Space News & Astronomy',
  },
  {
    id: 'astrum',
    name: 'Astrum',
    url: 'https://www.youtube.com/@aabornet',
    host: 'Alex McColgan',
    subscribers: '2M+',
    description: 'Stunning visual tours of planets, moons, and space missions with cinematic quality.',
    language: 'EN',
    specialty: 'Planetary Science & Visuals',
  },
  {
    id: 'arvin-ash',
    name: 'Arvin Ash',
    url: 'https://www.youtube.com/@ArvinAsh',
    host: 'Arvin Ash',
    subscribers: '1.2M+',
    description: 'Complex physics and cosmology explained simply. Covers quantum mechanics, black holes, and the nature of reality.',
    language: 'EN',
    specialty: 'Physics & Cosmology',
  },
];

export default function SpaceChannels({ open, onClose }) {
  const [filter, setFilter] = useState('all');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!open) return null;

  const filteredChannels = filter === 'all'
    ? YOUTUBE_CHANNELS
    : YOUTUBE_CHANNELS.filter(c => c.language === filter);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#060612', fontFamily: "'SF Mono', 'Fira Code', monospace", overflowY: 'auto', color: 'rgba(200,215,255,0.9)' }}>
      <style>{`
        .sc-card { background: rgba(15,20,40,0.8); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; transition: all 0.3s; }
        .sc-card:hover { border-color: rgba(59,130,246,0.35); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,0.1); }
        .sc-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); color: rgba(150,180,255,0.9); cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 11px; letter-spacing: 1px; touch-action: manipulation; }
        .sc-btn:hover, .sc-active { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.5); }
        @keyframes scLive { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .sc-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff4444; animation: scLive 1.5s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ padding: isMobile ? '16px' : '24px 32px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,6,18,0.95)', backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(126,184,247,0.5)', textTransform: 'uppercase' }}>Curated Content</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#7eb8f7', letterSpacing: '2px' }}>SPACE CHANNELS</h1>
        </div>
        <button onClick={onClose} style={{ width: '40px', height: '40px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: 'rgba(126,184,247,0.8)', fontSize: '20px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>×</button>
      </div>

      <div style={{ padding: isMobile ? '16px' : '20px 32px' }}>

        {/* ─── Live Streams Section ─── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginBottom: '14px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sc-live-dot" /> Live Streams & Official Sources
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
            {LIVE_STREAMS.map(s => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="sc-card" style={{ padding: '16px', textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#7eb8f7' }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: s.language === 'ES' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: s.language === 'ES' ? '#f59e0b' : '#7eb8f7', border: `1px solid ${s.language === 'ES' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                      {s.language}
                    </span>
                    {s.type === 'live' && <span className="sc-live-dot" />}
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(200,215,255,0.5)', margin: '8px 0 0 0', lineHeight: 1.5 }}>{s.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ─── YouTube Channels Section ─── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', textTransform: 'uppercase' }}>
              Recommended Channels
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'EN', label: 'English' },
                { id: 'ES', label: 'Español' },
              ].map(f => (
                <button key={f.id} className={`sc-btn ${filter === f.id ? 'sc-active' : ''}`} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
            {filteredChannels.map(ch => (
              <a key={ch.id} href={ch.url} target="_blank" rel="noopener noreferrer" className="sc-card" style={{ padding: '18px', textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#c8d7ff' }}>{ch.name}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(126,184,247,0.5)', marginTop: '2px' }}>
                      {ch.host} · {ch.subscribers} subscribers
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: ch.language === 'ES' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.1)', color: ch.language === 'ES' ? '#f59e0b' : 'rgba(126,184,247,0.6)', border: `1px solid ${ch.language === 'ES' ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.15)'}` }}>
                    {ch.language}
                  </span>
                </div>

                <p style={{ fontSize: '11px', color: 'rgba(200,215,255,0.6)', margin: '10px 0', lineHeight: 1.6 }}>{ch.description}</p>

                <div style={{ fontSize: '10px', padding: '4px 10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '12px', color: 'rgba(126,184,247,0.6)', display: 'inline-block' }}>
                  {ch.specialty}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 32px', borderTop: '1px solid rgba(59,130,246,0.08)', textAlign: 'center', fontSize: '9px', color: 'rgba(126,184,247,0.3)', letterSpacing: '2px', marginTop: '20px' }}>
        ALL LINKS OPEN IN NEW TAB · ORBITAL DOME IS NOT AFFILIATED WITH THESE CHANNELS
      </div>
    </div>
  );
}
