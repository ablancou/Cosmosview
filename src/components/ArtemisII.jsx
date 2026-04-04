import React, { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   ARTEMIS II — Live Mission Dashboard
   The first crewed lunar mission since Apollo 17 (1972)
   Launched April 1, 2026 · Lunar flyby April 6 · Return April 11
   ═══════════════════════════════════════════════════════════════════════════ */

const MISSION_TIMELINE = [
  { id: 'launch', label: 'Launch', date: '2026-04-01T18:35:00-04:00', description: 'Liftoff from Kennedy Space Center, LC-39B aboard SLS Block 1', status: 'completed', detail: 'The most powerful rocket ever flown with crew. 8.8 million pounds of thrust.' },
  { id: 'orbit', label: 'Earth Orbit', date: '2026-04-01T19:23:00-04:00', description: 'Orion enters parking orbit at ~185 km altitude', status: 'completed', detail: 'Systems checkout and verification before committing to lunar trajectory.' },
  { id: 'tli', label: 'Trans-Lunar Injection', date: '2026-04-02T00:00:00-04:00', description: 'ICPS upper stage fires for 5 min 50 sec to escape Earth orbit', status: 'completed', detail: 'Accelerates Orion to ~39,400 km/h. Point of no return for lunar trajectory.' },
  { id: 'outbound', label: 'Outbound Coast', date: '2026-04-02', description: '~4 days traversing cislunar space toward the Moon', status: 'active', detail: 'Crew conducts experiments, tests life support, and photographs Earth receding.' },
  { id: 'flyby', label: 'Lunar Flyby', date: '2026-04-06', description: 'Closest approach: ~6,500 km from lunar far side', status: 'upcoming', detail: 'Farthest any humans have traveled from Earth (~400,000+ km). Free-return trajectory gravity assist.' },
  { id: 'return', label: 'Return Coast', date: '2026-04-07', description: '~4 days returning to Earth using free-return trajectory', status: 'upcoming', detail: 'Gravity assist from the Moon slingshots Orion back toward Earth.' },
  { id: 'reentry', label: 'Re-entry & Splashdown', date: '2026-04-11', description: 'Orion enters atmosphere at ~40,000 km/h, splashdown in Pacific', status: 'upcoming', detail: 'Skip re-entry technique: bounces off atmosphere once to reduce G-forces and heat.' },
];

const CREW = [
  { name: 'Reid Wiseman', role: 'Commander', agency: 'NASA', bio: 'Navy test pilot, ISS Expedition 41. Selected as Artemis II commander. Chief of the Astronaut Office (2020-2023).', img: 'RW' },
  { name: 'Victor Glover', role: 'Pilot', agency: 'NASA', bio: 'Navy test pilot, SpaceX Crew-1 mission to ISS (2020). First Black astronaut on a lunar mission.', img: 'VG' },
  { name: 'Christina Koch', role: 'Mission Specialist', agency: 'NASA', bio: 'Holds record for longest single spaceflight by a woman (328 days). Electrical engineer.', img: 'CK' },
  { name: 'Jeremy Hansen', role: 'Mission Specialist', agency: 'CSA', bio: 'Canadian Forces fighter pilot. First Canadian to travel beyond low Earth orbit.', img: 'JH' },
];

const KEY_STATS = [
  { label: 'Mission Duration', value: '~10 days' },
  { label: 'Distance to Moon', value: '384,400 km' },
  { label: 'Closest Approach', value: '~6,500 km' },
  { label: 'Max Velocity', value: '39,400 km/h' },
  { label: 'Crew Size', value: '4' },
  { label: 'Vehicle', value: 'Orion / SLS' },
];

// Trajectory waypoints for visualization (simplified 2D projection)
const TRAJECTORY_POINTS = [
  { x: 10, y: 50, label: 'Earth' },
  { x: 20, y: 35, label: 'TLI' },
  { x: 40, y: 20, label: '' },
  { x: 60, y: 15, label: '' },
  { x: 78, y: 25, label: '' },
  { x: 88, y: 45, label: 'Moon' },
  { x: 85, y: 55, label: 'Flyby' },
  { x: 78, y: 65, label: '' },
  { x: 60, y: 75, label: '' },
  { x: 40, y: 78, label: '' },
  { x: 20, y: 65, label: '' },
  { x: 10, y: 50, label: 'Splashdown' },
];

const NASA_LINKS = {
  tracker: 'https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/',
  liveTracker: 'https://artemis2.live/',
  multimedia: 'https://www.nasa.gov/artemis-ii-multimedia/',
  nasaPlus: 'https://plus.nasa.gov/',
  nasaLive: 'https://www.nasa.gov/live/',
  trajectory: 'https://svs.gsfc.nasa.gov/5610/',
  crewPage: 'https://www.nasa.gov/feature/our-artemis-crew/',
  nasaYouTube: 'https://www.youtube.com/@NASA',
};

export default function ArtemisII({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const missionDay = useMemo(() => {
    const launch = new Date('2026-04-01T18:35:00-04:00');
    const now = new Date();
    const diff = Math.floor((now - launch) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff + 1);
  }, []);

  const hoursToFlyby = useMemo(() => {
    const flyby = new Date('2026-04-06T12:00:00-04:00');
    const now = new Date();
    const hrs = Math.floor((flyby - now) / (1000 * 60 * 60));
    return hrs;
  }, []);

  if (!open) return null;

  const linkBtn = (url, label, accent = false) => (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
      background: accent ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.06)',
      border: `1px solid ${accent ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.2)'}`,
      borderRadius: '8px', color: accent ? '#7eb8f7' : 'rgba(200,215,255,0.8)',
      fontSize: '11px', textDecoration: 'none', letterSpacing: '1px', fontFamily: 'inherit',
      transition: 'all 0.2s',
    }}>
      {label} →
    </a>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#060612', fontFamily: "'SF Mono', 'Fira Code', monospace", overflowY: 'auto', color: 'rgba(200,215,255,0.9)' }}>
      <style>{`
        .a2-card { background: rgba(15,20,40,0.8); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; }
        .a2-glow { box-shadow: 0 0 30px rgba(59,130,246,0.1); }
        .a2-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); color: rgba(150,180,255,0.9); cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; touch-action: manipulation; }
        .a2-btn:hover, .a2-active { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.5); }
        @keyframes a2Pulse { 0%,100%{box-shadow:0 0 8px rgba(255,100,100,0.3)} 50%{box-shadow:0 0 20px rgba(255,100,100,0.6)} }
        .a2-live-badge { animation: a2Pulse 2s ease-in-out infinite; background: rgba(255,60,60,0.15); border: 1px solid rgba(255,60,60,0.4); color: #ff6b6b; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; letter-spacing: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: isMobile ? '16px' : '24px 32px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,6,18,0.95)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(126,184,247,0.5)', textTransform: 'uppercase' }}>Mission Dashboard</div>
            <h1 style={{ margin: '4px 0 0 0', fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: '#7eb8f7', letterSpacing: '2px' }}>ARTEMIS II</h1>
          </div>
          <span className="a2-live-badge">LIVE · DAY {missionDay}</span>
        </div>
        <button onClick={onClose} style={{ width: '40px', height: '40px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: 'rgba(126,184,247,0.8)', fontSize: '20px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>×</button>
      </div>

      {/* Mission Status Banner */}
      <div className="a2-card a2-glow" style={{ margin: isMobile ? '12px 16px' : '16px 32px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)' }}>CURRENT STATUS</div>
          <div style={{ fontSize: '15px', color: '#7eb8f7', marginTop: '4px' }}>
            {hoursToFlyby > 0
              ? `Outbound Coast — T-${hoursToFlyby}h to Lunar Flyby`
              : hoursToFlyby > -24
                ? 'LUNAR FLYBY IN PROGRESS'
                : `Return Coast — Day ${missionDay} of 10`
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {linkBtn(NASA_LINKS.tracker, 'NASA TRACKER', true)}
          {linkBtn(NASA_LINKS.liveTracker, 'LIVE MAP', true)}
          {linkBtn(NASA_LINKS.nasaPlus, 'NASA+ STREAM', true)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '8px 16px' : '8px 32px', overflowX: 'auto' }}>
        {['overview', 'trajectory', 'crew', 'links'].map(t => (
          <button key={t} className={`a2-btn ${activeTab === t ? 'a2-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'trajectory' ? 'Trajectory' : t === 'crew' ? 'Crew' : 'Watch & Links'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '16px' : '20px 32px', minHeight: '50vh' }}>

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {KEY_STATS.map(s => (
                <div key={s.label} className="a2-card" style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7eb8f7' }}>{s.value}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginTop: '4px', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mission Timeline */}
            <div className="a2-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Mission Timeline</div>
              {MISSION_TIMELINE.map((evt, i) => {
                const isActive = evt.status === 'active';
                const isDone = evt.status === 'completed';
                return (
                  <div key={evt.id} style={{ display: 'flex', gap: '14px', marginBottom: '16px', opacity: evt.status === 'upcoming' ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: isActive ? '#3b82f6' : isDone ? '#00cc88' : 'transparent',
                        border: `2px solid ${isActive ? '#3b82f6' : isDone ? '#00cc88' : 'rgba(123,140,255,0.3)'}`,
                        boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
                      }} />
                      {i < MISSION_TIMELINE.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '20px', background: isDone ? 'rgba(0,204,136,0.3)' : 'rgba(59,130,246,0.1)' }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '4px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: isActive ? '#7eb8f7' : isDone ? '#c8d7ff' : 'rgba(200,215,255,0.5)' }}>{evt.label}</span>
                        {isActive && <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59,130,246,0.2)', color: '#7eb8f7', border: '1px solid rgba(59,130,246,0.3)' }}>NOW</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(200,215,255,0.6)', marginTop: '2px' }}>{evt.description}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(126,184,247,0.4)', marginTop: '4px' }}>{evt.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TRAJECTORY ═══ */}
        {activeTab === 'trajectory' && (
          <div>
            <div className="a2-card a2-glow" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Free-Return Trajectory</div>

              {/* SVG Trajectory Diagram */}
              <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', display: 'block' }}>
                {/* Background grid */}
                {[20,40,60,80].map(v => <line key={`h${v}`} x1="0" y1={v} x2="100" y2={v} stroke="rgba(59,130,246,0.05)" strokeWidth="0.3" />)}
                {[20,40,60,80].map(v => <line key={`v${v}`} x1={v} y1="0" x2={v} y2="100" stroke="rgba(59,130,246,0.05)" strokeWidth="0.3" />)}

                {/* Earth */}
                <circle cx="10" cy="50" r="6" fill="url(#earthGrad)" />
                <defs>
                  <radialGradient id="earthGrad"><stop offset="0%" stopColor="#4488cc" /><stop offset="100%" stopColor="#1a3366" /></radialGradient>
                  <radialGradient id="moonGrad"><stop offset="0%" stopColor="#cccccc" /><stop offset="100%" stopColor="#888888" /></radialGradient>
                </defs>
                <text x="10" y="62" textAnchor="middle" fill="rgba(126,184,247,0.6)" fontSize="3" fontFamily="monospace">EARTH</text>

                {/* Moon */}
                <circle cx="88" cy="45" r="3" fill="url(#moonGrad)" />
                <text x="88" y="53" textAnchor="middle" fill="rgba(126,184,247,0.6)" fontSize="3" fontFamily="monospace">MOON</text>

                {/* Trajectory path */}
                <path d={`M ${TRAJECTORY_POINTS.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth="0.6" strokeDasharray="2 1" />

                {/* Outbound path (solid) */}
                <path d={`M ${TRAJECTORY_POINTS.slice(0, 6).map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#3b82f6" strokeWidth="0.8" />

                {/* Waypoints */}
                {TRAJECTORY_POINTS.filter(p => p.label && p.label !== 'Earth' && p.label !== 'Moon').map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="1.2" fill="#3b82f6" stroke="rgba(59,130,246,0.4)" strokeWidth="0.3" />
                    <text x={p.x} y={p.y - 3} textAnchor="middle" fill="rgba(126,184,247,0.7)" fontSize="2.5" fontFamily="monospace">{p.label}</text>
                  </g>
                ))}

                {/* Current position indicator (approximate) */}
                <circle cx="45" cy="18" r="1.5" fill="#ff6b6b" stroke="rgba(255,100,100,0.5)" strokeWidth="0.5">
                  <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="45" y="13" textAnchor="middle" fill="#ff6b6b" fontSize="2.5" fontFamily="monospace">ORION</text>
              </svg>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                {linkBtn(NASA_LINKS.trajectory, 'NASA SVS TRAJECTORY ANIMATION')}
              </div>
            </div>

            {/* Trajectory Details */}
            <div className="a2-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>Trajectory Parameters</div>
              {[
                { label: 'Launch Vehicle', value: 'SLS Block 1 (8.8M lbs thrust)' },
                { label: 'Spacecraft', value: 'Orion MPCV + ESM' },
                { label: 'Parking Orbit', value: '~185 km circular' },
                { label: 'TLI Delta-V', value: '~3.1 km/s (5 min 50 sec burn)' },
                { label: 'Outbound Transit', value: '~4 days' },
                { label: 'Closest Lunar Approach', value: '~6,500 km (far side)' },
                { label: 'Max Distance from Earth', value: '~400,000+ km' },
                { label: 'Return Transit', value: '~4 days (free-return)' },
                { label: 'Re-entry Speed', value: '~40,000 km/h (Mach 32)' },
                { label: 'Re-entry Technique', value: 'Skip entry (atmospheric bounce)' },
                { label: 'Splashdown', value: 'Pacific Ocean' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 10 ? '1px solid rgba(59,130,246,0.06)' : 'none' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(126,184,247,0.5)' }}>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(200,215,255,0.8)', textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CREW ═══ */}
        {activeTab === 'crew' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
            {CREW.map(c => (
              <div key={c.name} className="a2-card a2-glow" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#7eb8f7', flexShrink: 0 }}>
                    {c.img}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#c8d7ff' }}>{c.name}</div>
                    <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(126,184,247,0.6)', marginTop: '2px' }}>{c.role} · {c.agency}</div>
                    <p style={{ fontSize: '12px', color: 'rgba(200,215,255,0.6)', marginTop: '8px', lineHeight: 1.6 }}>{c.bio}</p>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ gridColumn: isMobile ? '1' : '1 / -1', textAlign: 'center', marginTop: '8px' }}>
              {linkBtn(NASA_LINKS.crewPage, 'OFFICIAL NASA CREW PAGE', true)}
            </div>
          </div>
        )}

        {/* ═══ WATCH & LINKS ═══ */}
        {activeTab === 'links' && (
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(126,184,247,0.5)', marginBottom: '16px', textTransform: 'uppercase' }}>
              Official NASA Resources (Public Domain)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { url: NASA_LINKS.tracker, title: 'Real-Time Mission Tracker', desc: 'Track Orion spacecraft position in real-time' },
                { url: NASA_LINKS.liveTracker, title: 'Artemis II Live Tracker', desc: 'Interactive 3D visualization of mission trajectory' },
                { url: NASA_LINKS.nasaPlus, title: 'NASA+ Streaming', desc: 'Free, ad-free live mission coverage and commentary' },
                { url: NASA_LINKS.nasaLive, title: 'NASA Live', desc: 'Official NASA live broadcast page' },
                { url: NASA_LINKS.multimedia, title: 'Mission Multimedia', desc: 'Official photos, videos, and press resources' },
                { url: NASA_LINKS.trajectory, title: 'SVS Trajectory Animation', desc: 'NASA Scientific Visualization Studio trajectory data' },
                { url: NASA_LINKS.nasaYouTube, title: 'NASA YouTube', desc: 'Live streams, press conferences, and mission coverage' },
                { url: NASA_LINKS.crewPage, title: 'Meet the Crew', desc: 'Detailed astronaut bios and mission roles' },
              ].map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="a2-card" style={{ padding: '16px', textDecoration: 'none', display: 'block', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#7eb8f7', marginBottom: '4px' }}>{link.title}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(200,215,255,0.5)' }}>{link.desc}</div>
                </a>
              ))}
            </div>

            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(59,130,246,0.05)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.1)', fontSize: '11px', color: 'rgba(200,215,255,0.5)', lineHeight: 1.6 }}>
              All NASA imagery and data are in the public domain per NASA media usage guidelines. Attribution: NASA/Artemis.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 32px', borderTop: '1px solid rgba(59,130,246,0.08)', textAlign: 'center', fontSize: '9px', color: 'rgba(126,184,247,0.3)', letterSpacing: '2px' }}>
        DATA SOURCES: NASA · NASA SVS · CSA · ARTEMIS PROGRAM
      </div>
    </div>
  );
}
