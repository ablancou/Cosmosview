import React, { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   LUNAR MISSIONS DASHBOARD — Futuristic mission control interface
   Tracks every major lunar mission in history + upcoming through 2030
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Mission Database ───
const MISSIONS = [
  // ═══ APOLLO ═══
  { id:'apollo-11', name:'Apollo 11', country:'USA', agency:'NASA', year:1969, date:'1969-07-20', type:'crewed-landing', status:'completed', site:'Sea of Tranquility', crew:['Neil Armstrong','Buzz Aldrin','Michael Collins'], description:'First humans on the Moon. Armstrong\'s "one small step" changed history forever.', samples:'21.6 kg', duration:'8d 3h', icon:'🇺🇸' },
  { id:'apollo-12', name:'Apollo 12', country:'USA', agency:'NASA', year:1969, date:'1969-11-19', type:'crewed-landing', status:'completed', site:'Ocean of Storms', crew:['Pete Conrad','Alan Bean','Richard Gordon'], description:'Precision landing near Surveyor 3 probe. Recovered parts for Earth return.', samples:'34.3 kg', duration:'10d 4h', icon:'🇺🇸' },
  { id:'apollo-13', name:'Apollo 13', country:'USA', agency:'NASA', year:1970, date:'1970-04-11', type:'crewed-flyby', status:'completed', crew:['Jim Lovell','Jack Swigert','Fred Haise'], description:'Aborted after oxygen tank explosion. "Successful failure" — crew returned safely.', duration:'5d 22h', icon:'🇺🇸' },
  { id:'apollo-14', name:'Apollo 14', country:'USA', agency:'NASA', year:1971, date:'1971-02-05', type:'crewed-landing', status:'completed', site:'Fra Mauro', crew:['Alan Shepard','Edgar Mitchell','Stuart Roosa'], description:'Shepard hit two golf balls on the Moon. Collected oldest Moon rock (4.51 Gy).', samples:'42.3 kg', duration:'9d 0h', icon:'🇺🇸' },
  { id:'apollo-15', name:'Apollo 15', country:'USA', agency:'NASA', year:1971, date:'1971-07-30', type:'crewed-landing', status:'completed', site:'Hadley Rille', crew:['David Scott','James Irwin','Alfred Worden'], description:'First Lunar Rover. Discovered Genesis Rock. Most scientifically productive Apollo.', samples:'77.3 kg', duration:'12d 7h', icon:'🇺🇸' },
  { id:'apollo-16', name:'Apollo 16', country:'USA', agency:'NASA', year:1972, date:'1972-04-20', type:'crewed-landing', status:'completed', site:'Descartes Highlands', crew:['John Young','Charles Duke','Ken Mattingly'], description:'First highlands landing. Deployed cosmic ray detector and UV camera.', samples:'95.7 kg', duration:'11d 1h', icon:'🇺🇸' },
  { id:'apollo-17', name:'Apollo 17', country:'USA', agency:'NASA', year:1972, date:'1972-12-11', type:'crewed-landing', status:'completed', site:'Taurus-Littrow', crew:['Eugene Cernan','Harrison Schmitt','Ronald Evans'], description:'Last humans on the Moon. Schmitt was first scientist-astronaut. Record EVA time.', samples:'110.5 kg', duration:'12d 13h', icon:'🇺🇸' },

  // ═══ LUNA PROGRAM ═══
  { id:'luna-2', name:'Luna 2', country:'USSR', agency:'Soviet Space Program', year:1959, date:'1959-09-14', type:'impactor', status:'completed', description:'First human-made object to reach the Moon. Impact confirmed solid surface.', icon:'☭' },
  { id:'luna-3', name:'Luna 3', country:'USSR', agency:'Soviet Space Program', year:1959, date:'1959-10-07', type:'flyby', status:'completed', description:'First photographs of the far side of the Moon. Revealed asymmetric geology.', icon:'☭' },
  { id:'luna-9', name:'Luna 9', country:'USSR', agency:'Soviet Space Program', year:1966, date:'1966-02-03', type:'lander', status:'completed', site:'Oceanus Procellarum', description:'First soft landing on the Moon. Transmitted panoramic images of the surface.', icon:'☭' },
  { id:'luna-16', name:'Luna 16', country:'USSR', agency:'Soviet Space Program', year:1970, date:'1970-09-20', type:'sample-return', status:'completed', site:'Mare Fecunditatis', description:'First robotic sample return — 101g of lunar regolith returned to Earth.', samples:'0.101 kg', icon:'☭' },
  { id:'luna-17', name:'Luna 17', country:'USSR', agency:'Soviet Space Program', year:1970, date:'1970-11-17', type:'rover', status:'completed', site:'Mare Imbrium', description:'Deployed Lunokhod 1 — first robotic rover. Traveled 10.5 km over 11 months.', icon:'☭' },
  { id:'luna-24', name:'Luna 24', country:'USSR', agency:'Soviet Space Program', year:1976, date:'1976-08-18', type:'sample-return', status:'completed', site:'Mare Crisium', description:'Last Soviet lunar mission. Returned 170g including deep drill core samples.', samples:'0.170 kg', icon:'☭' },

  // ═══ MODERN ERA ═══
  { id:'clementine', name:'Clementine', country:'USA', agency:'NASA/DoD', year:1994, date:'1994-01-25', type:'orbiter', status:'completed', description:'Mapped entire Moon topography. First evidence of water ice at the poles.', icon:'🇺🇸' },
  { id:'lro', name:'Lunar Reconnaissance Orbiter', country:'USA', agency:'NASA', year:2009, date:'2009-06-18', type:'orbiter', status:'active', description:'Still operating! Highest-resolution lunar imagery ever. Maps used in this simulation.', icon:'🇺🇸' },

  // ═══ CHANG\'E ═══
  { id:'change-1', name:'Chang\'e 1', country:'China', agency:'CNSA', year:2007, date:'2007-10-24', type:'orbiter', status:'completed', description:'First Chinese lunar mission. Created complete 3D topographic map of the Moon.', icon:'🇨🇳' },
  { id:'change-3', name:'Chang\'e 3', country:'China', agency:'CNSA', year:2013, date:'2013-12-14', type:'lander-rover', status:'completed', site:'Mare Imbrium', description:'First soft landing since 1976. Deployed Yutu rover for surface exploration.', icon:'🇨🇳' },
  { id:'change-4', name:'Chang\'e 4', country:'China', agency:'CNSA', year:2019, date:'2019-01-03', type:'lander-rover', status:'completed', site:'Von Kármán Crater (Far Side)', description:'First-ever landing on far side of the Moon. Yutu-2 rover still operating.', icon:'🇨🇳' },
  { id:'change-5', name:'Chang\'e 5', country:'China', agency:'CNSA', year:2020, date:'2020-12-01', type:'sample-return', status:'completed', site:'Oceanus Procellarum', description:'Returned 1,731g of lunar samples — youngest basalt samples ever collected (2 Gy).', samples:'1.731 kg', icon:'🇨🇳' },
  { id:'change-6', name:'Chang\'e 6', country:'China', agency:'CNSA', year:2024, date:'2024-06-25', type:'sample-return', status:'completed', site:'Apollo Basin (Far Side)', description:'First sample return from lunar far side. Unprecedented geological data.', icon:'🇨🇳' },

  // ═══ CHANDRAYAAN ═══
  { id:'chandrayaan-1', name:'Chandrayaan-1', country:'India', agency:'ISRO', year:2008, date:'2008-10-22', type:'orbiter', status:'completed', description:'Confirmed water molecules on Moon surface. Major scientific breakthrough.', icon:'🇮🇳' },
  { id:'chandrayaan-3', name:'Chandrayaan-3', country:'India', agency:'ISRO', year:2023, date:'2023-08-23', type:'lander-rover', status:'completed', site:'South Polar Region', description:'4th country to soft-land on Moon. First landing near south pole. Deployed Pragyan rover.', icon:'🇮🇳' },

  // ═══ JAPAN ═══
  { id:'slim', name:'SLIM (Moon Sniper)', country:'Japan', agency:'JAXA', year:2024, date:'2024-01-19', type:'lander', status:'completed', site:'Shioli Crater', description:'Precision landing within 10m of target. 5th country to soft-land. Solar panels initially inverted.', icon:'🇯🇵' },

  // ═══ COMMERCIAL ═══
  { id:'beresheet', name:'Beresheet', country:'Israel', agency:'SpaceIL', year:2019, date:'2019-04-11', type:'lander', status:'failed', description:'First private lunar landing attempt. Crashed due to gyroscope failure.', icon:'🇮🇱' },
  { id:'im-1', name:'IM-1 Odysseus', country:'USA', agency:'Intuitive Machines', year:2024, date:'2024-02-22', type:'lander', status:'completed', site:'Malapert A', description:'First commercial soft landing on the Moon. Tipped 30° but completed science operations.', icon:'🏢' },
  { id:'blue-ghost-1', name:'Blue Ghost 1', country:'USA', agency:'Firefly Aerospace', year:2025, date:'2025-03-02', type:'lander', status:'completed', site:'Mare Crisium', description:'10 NASA payloads delivered. 346-hour surface operation. Awarded 2025 Collier Trophy.', icon:'🏢' },

  // ═══ UPCOMING ═══
  { id:'artemis-2', name:'Artemis II', country:'USA', agency:'NASA', year:2026, date:'2026-04-01', type:'crewed-flyby', status:'upcoming', crew:['Reid Wiseman','Victor Glover','Christina Koch','Jeremy Hansen'], description:'First crewed lunar flyby since Apollo 17. 10-day mission. First Canadian near the Moon.', liveUrl:'https://www.nasa.gov/artemis-ii/', icon:'🚀' },
  { id:'change-7', name:'Chang\'e 7', country:'China', agency:'CNSA', year:2026, date:'2026-08-01', type:'lander-rover', status:'upcoming', site:'South Pole', description:'Orbiter + lander + rover + mini-hopper to explore permanently shadowed craters for water ice.', icon:'🇨🇳' },
  { id:'blue-moon-pathfinder', name:'Blue Moon Pathfinder', country:'USA', agency:'Blue Origin', year:2026, date:'2026-06-01', type:'lander', status:'upcoming', site:'Near Shackleton Crater', description:'Uncrewed test of Blue Origin cryogenic lander. Demonstrates precision landing for Artemis.', icon:'🏢' },
  { id:'im-3', name:'IM-3 Trinity', country:'USA', agency:'Intuitive Machines', year:2026, date:'2026-09-01', type:'lander', status:'upcoming', site:'Reiner Gamma', description:'4 NASA CLPS payloads to investigate mysterious lunar swirl. Magnetic anomaly study.', icon:'🏢' },
  { id:'griffin-1', name:'Griffin Mission 1', country:'USA', agency:'Astrobotic', year:2026, date:'2026-07-01', type:'lander', status:'upcoming', site:'Nobile Crater', description:'Large lander carrying FLIP rover + CubeRover near south pole.', icon:'🏢' },
  { id:'artemis-3', name:'Artemis III', country:'USA', agency:'NASA', year:2027, date:'2027-06-01', type:'crewed-demo', status:'planned', description:'LEO demonstration of SpaceX Starship HLS and Blue Origin lander. Test AxEMU spacesuits.', liveUrl:'https://www.nasa.gov/artemis/', icon:'🚀' },
  { id:'artemis-4', name:'Artemis IV', country:'USA', agency:'NASA', year:2028, date:'2028-03-01', type:'crewed-landing', status:'planned', description:'First crewed lunar landing since 1972. Historic return of humans to the Moon surface.', liveUrl:'https://www.nasa.gov/artemis/', icon:'🚀' },
  { id:'luna-26', name:'Luna 26', country:'Russia', agency:'Roscosmos', year:2028, date:'2028-01-01', type:'orbiter', status:'planned', description:'Polar orbiter for resource mapping and relay communications. Russia\'s return to lunar exploration.', icon:'🇷🇺' },
  { id:'change-8', name:'Chang\'e 8', country:'China', agency:'CNSA', year:2029, date:'2029-01-01', type:'lander', status:'planned', site:'South Pole', description:'In-situ resource utilization experiments. Foundation for International Lunar Research Station.', icon:'🇨🇳' },
  { id:'chandrayaan-5', name:'LUPEX (Chandrayaan-5)', country:'India/Japan', agency:'ISRO/JAXA', year:2029, date:'2029-01-01', type:'lander-rover', status:'planned', site:'South Pole', description:'Joint India-Japan mission. Pressurized rover to explore polar ice deposits.', icon:'🇮🇳' },
  { id:'artemis-5', name:'Artemis V', country:'USA', agency:'NASA', year:2029, date:'2029-06-01', type:'crewed-landing', status:'planned', description:'Second crewed landing. Begin building permanent lunar base infrastructure.', liveUrl:'https://www.nasa.gov/artemis/', icon:'🚀' },
];

const TYPE_LABELS = {
  'crewed-landing': 'Crewed Landing',
  'crewed-flyby': 'Crewed Flyby',
  'crewed-demo': 'Crewed Demo',
  'lander': 'Robotic Lander',
  'lander-rover': 'Lander + Rover',
  'orbiter': 'Orbiter',
  'impactor': 'Impactor',
  'flyby': 'Flyby',
  'rover': 'Rover',
  'sample-return': 'Sample Return',
  'failed': 'Failed',
};

const STATUS_COLORS = {
  completed: '#00cc88',
  active: '#00aaff',
  failed: '#ff4466',
  upcoming: '#ffaa00',
  planned: '#7b8cff',
};

const COUNTRY_COLORS = {
  'USA': '#3b82f6',
  'USSR': '#ef4444',
  'China': '#f59e0b',
  'India': '#10b981',
  'Japan': '#8b5cf6',
  'Israel': '#06b6d4',
  'Russia': '#ef4444',
  'India/Japan': '#10b981',
};

export default function LunarMissions({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedMission, setSelectedMission] = useState(null);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const filtered = useMemo(() => {
    return MISSIONS.filter(m => {
      if (filterCountry !== 'all' && m.country !== filterCountry) return false;
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      return true;
    });
  }, [filterCountry, filterStatus]);

  const stats = useMemo(() => {
    const total = MISSIONS.length;
    const completed = MISSIONS.filter(m => m.status === 'completed').length;
    const upcoming = MISSIONS.filter(m => m.status === 'upcoming' || m.status === 'planned').length;
    const crewed = MISSIONS.filter(m => m.type.startsWith('crewed')).length;
    const countries = [...new Set(MISSIONS.map(m => m.country))].length;
    const samples = MISSIONS.filter(m => m.samples).reduce((sum, m) => sum + parseFloat(m.samples), 0);
    const decades = {};
    MISSIONS.forEach(m => { const dec = Math.floor(m.year / 10) * 10; decades[dec] = (decades[dec] || 0) + 1; });
    return { total, completed, upcoming, crewed, countries, samples, decades };
  }, []);

  const upcomingMissions = useMemo(() =>
    MISSIONS.filter(m => m.status === 'upcoming' || m.status === 'planned').sort((a, b) => a.year - b.year),
    []
  );

  if (!open) return null;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:50, background:'#060612',
      fontFamily:"'SF Mono', 'Fira Code', monospace",
      overflowY:'auto', overflowX:'hidden',
      color:'rgba(200,215,255,0.9)',
    }}>
      <style>{`
        .lm-glow { box-shadow: 0 0 20px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05); }
        .lm-card { background: rgba(15,20,40,0.8); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; transition: all 0.3s ease; }
        .lm-card:hover { border-color: rgba(59,130,246,0.4); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,0.15); }
        .lm-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3); background: rgba(59,130,246,0.08); color: rgba(150,180,255,0.9); cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; touch-action: manipulation; }
        .lm-btn:hover, .lm-btn-active { background: rgba(59,130,246,0.2); border-color: rgba(59,130,246,0.5); color: #7eb8f7; }
        .lm-stat { text-align: center; }
        .lm-stat-value { font-size: 28px; font-weight: bold; color: #7eb8f7; line-height: 1.2; }
        .lm-stat-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(126,184,247,0.5); margin-top: 4px; }
        .lm-timeline-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid; flex-shrink: 0; }
        .lm-scroll::-webkit-scrollbar { width: 4px; }
        .lm-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 4px; }
        @keyframes lm-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .lm-live { animation: lm-pulse 2s ease-in-out infinite; }
        @keyframes lm-scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .lm-scanline::after { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:linear-gradient(90deg,transparent,rgba(59,130,246,0.03),transparent); animation:lm-scan 4s linear infinite; pointer-events:none; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ padding: isMobile ? '16px' : '24px 32px', borderBottom:'1px solid rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, background:'rgba(6,6,18,0.95)', backdropFilter:'blur(12px)' }}>
        <div>
          <div style={{ fontSize:'10px', letterSpacing:'3px', color:'rgba(126,184,247,0.5)', textTransform:'uppercase' }}>Mission Control</div>
          <h1 style={{ margin:'4px 0 0 0', fontSize: isMobile ? '18px' : '22px', fontWeight:'bold', color:'#7eb8f7', letterSpacing:'2px' }}>LUNAR MISSIONS</h1>
        </div>
        <button onClick={onClose} style={{ width:'40px', height:'40px', border:'1px solid rgba(59,130,246,0.3)', background:'rgba(59,130,246,0.08)', color:'rgba(126,184,247,0.8)', fontSize:'20px', cursor:'pointer', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', touchAction:'manipulation' }}>×</button>
      </div>

      {/* ─── Stats Bar ─── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap:'12px', padding: isMobile ? '16px' : '20px 32px', borderBottom:'1px solid rgba(59,130,246,0.08)' }}>
        <div className="lm-stat"><div className="lm-stat-value">{stats.total}</div><div className="lm-stat-label">Total Missions</div></div>
        <div className="lm-stat"><div className="lm-stat-value">{stats.completed}</div><div className="lm-stat-label">Completed</div></div>
        <div className="lm-stat"><div className="lm-stat-value">{stats.upcoming}</div><div className="lm-stat-label">Upcoming</div></div>
        <div className="lm-stat"><div className="lm-stat-value">{stats.crewed}</div><div className="lm-stat-label">Crewed</div></div>
        <div className="lm-stat"><div className="lm-stat-value">{stats.countries}</div><div className="lm-stat-label">Countries</div></div>
        <div className="lm-stat"><div className="lm-stat-value">{stats.samples.toFixed(0)}<span style={{fontSize:'14px'}}>kg</span></div><div className="lm-stat-label">Samples Returned</div></div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div style={{ display:'flex', gap:'8px', padding: isMobile ? '12px 16px' : '16px 32px', borderBottom:'1px solid rgba(59,130,246,0.08)', overflowX:'auto', flexWrap:'nowrap' }}>
        {[
          { id:'timeline', label:'Timeline' },
          { id:'upcoming', label:'Upcoming' },
          { id:'charts', label:'Analytics' },
        ].map(tab => (
          <button key={tab.id} className={`lm-btn ${activeTab === tab.id ? 'lm-btn-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Content Area ─── */}
      <div style={{ padding: isMobile ? '16px' : '20px 32px', minHeight:'60vh' }}>

        {/* ═══ TIMELINE TAB ═══ */}
        {activeTab === 'timeline' && (
          <div>
            {/* Filters */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ padding:'6px 12px', background:'rgba(15,20,40,0.8)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'6px', color:'rgba(200,215,255,0.9)', fontFamily:'inherit', fontSize:'11px' }}>
                <option value="all">All Countries</option>
                {[...new Set(MISSIONS.map(m => m.country))].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'6px 12px', background:'rgba(15,20,40,0.8)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'6px', color:'rgba(200,215,255,0.9)', fontFamily:'inherit', fontSize:'11px' }}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="planned">Planned</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Timeline */}
            <div style={{ position:'relative', paddingLeft:'28px' }}>
              {/* Vertical line */}
              <div style={{ position:'absolute', left:'5px', top:0, bottom:0, width:'2px', background:'linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(59,130,246,0.1))' }} />

              {filtered.map((m, i) => (
                <div key={m.id} style={{ position:'relative', marginBottom:'16px', cursor:'pointer' }} onClick={() => setSelectedMission(selectedMission?.id === m.id ? null : m)}>
                  {/* Dot */}
                  <div className="lm-timeline-dot" style={{ position:'absolute', left:'-28px', top:'14px', borderColor: STATUS_COLORS[m.status] || '#555', background: selectedMission?.id === m.id ? STATUS_COLORS[m.status] : 'transparent' }} />

                  {/* Card */}
                  <div className="lm-card lm-scanline" style={{ padding:'14px 18px', position:'relative', overflow:'hidden' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'16px' }}>{m.icon}</span>
                          <span style={{ fontWeight:'bold', color:'#c8d7ff', fontSize:'13px' }}>{m.name}</span>
                          <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'10px', background: `${STATUS_COLORS[m.status]}22`, color: STATUS_COLORS[m.status], border:`1px solid ${STATUS_COLORS[m.status]}44` }}>
                            {m.status.toUpperCase()}
                          </span>
                          {m.liveUrl && m.status === 'upcoming' && (
                            <span className="lm-live" style={{ fontSize:'10px', color:'#ffaa00', fontWeight:'bold' }}>WATCH LIVE</span>
                          )}
                        </div>
                        <div style={{ fontSize:'10px', color:'rgba(126,184,247,0.5)', marginTop:'4px', letterSpacing:'1px' }}>
                          {m.year} · {m.agency} · {TYPE_LABELS[m.type] || m.type}
                        </div>
                      </div>
                      <div style={{ fontSize:'11px', color:'rgba(126,184,247,0.4)', whiteSpace:'nowrap' }}>{m.date?.split('-')[0]}</div>
                    </div>

                    {/* Expanded details */}
                    {selectedMission?.id === m.id && (
                      <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid rgba(59,130,246,0.1)', fontSize:'12px', lineHeight:1.7 }}>
                        <p style={{ margin:'0 0 8px 0', color:'rgba(200,215,255,0.7)' }}>{m.description}</p>
                        {m.site && <div><span style={{color:'rgba(126,184,247,0.5)'}}>LANDING SITE:</span> {m.site}</div>}
                        {m.crew && <div><span style={{color:'rgba(126,184,247,0.5)'}}>CREW:</span> {m.crew.join(', ')}</div>}
                        {m.samples && <div><span style={{color:'rgba(126,184,247,0.5)'}}>SAMPLES:</span> {m.samples}</div>}
                        {m.duration && <div><span style={{color:'rgba(126,184,247,0.5)'}}>DURATION:</span> {m.duration}</div>}
                        {m.liveUrl && (
                          <a href={m.liveUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', marginTop:'8px', padding:'6px 14px', background:'rgba(255,170,0,0.15)', border:'1px solid rgba(255,170,0,0.3)', borderRadius:'6px', color:'#ffaa00', fontSize:'11px', textDecoration:'none', letterSpacing:'1px' }}>
                            MISSION PAGE →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ UPCOMING TAB ═══ */}
        {activeTab === 'upcoming' && (
          <div>
            <div style={{ fontSize:'10px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'20px', textTransform:'uppercase' }}>
              Next Missions · {upcomingMissions.length} scheduled through 2030
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:'16px' }}>
              {upcomingMissions.map(m => {
                const launchDate = new Date(m.date);
                const now = new Date();
                const daysUntil = Math.ceil((launchDate - now) / (1000 * 60 * 60 * 24));
                const isImminent = daysUntil <= 30 && daysUntil > 0;

                return (
                  <div key={m.id} className="lm-card lm-glow" style={{ padding:'20px', position:'relative', overflow:'hidden' }}>
                    {isImminent && <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #ffaa00, #ff6600)' }} />}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <span style={{ fontSize:'20px', marginRight:'8px' }}>{m.icon}</span>
                        <span style={{ fontWeight:'bold', fontSize:'15px', color:'#c8d7ff' }}>{m.name}</span>
                      </div>
                      <span style={{ fontSize:'10px', padding:'3px 10px', borderRadius:'10px', background:`${STATUS_COLORS[m.status]}22`, color:STATUS_COLORS[m.status], border:`1px solid ${STATUS_COLORS[m.status]}44`, whiteSpace:'nowrap' }}>
                        {m.status === 'upcoming' ? (daysUntil > 0 ? `T-${daysUntil}d` : 'IMMINENT') : 'PLANNED'}
                      </span>
                    </div>

                    <div style={{ fontSize:'10px', color:'rgba(126,184,247,0.5)', margin:'8px 0', letterSpacing:'1px' }}>
                      {m.agency} · {m.year} · {TYPE_LABELS[m.type] || m.type}
                    </div>

                    <p style={{ fontSize:'12px', color:'rgba(200,215,255,0.7)', margin:'8px 0', lineHeight:1.6 }}>{m.description}</p>

                    {m.crew && (
                      <div style={{ marginTop:'8px', padding:'8px 12px', background:'rgba(59,130,246,0.05)', borderRadius:'6px', border:'1px solid rgba(59,130,246,0.1)' }}>
                        <div style={{ fontSize:'9px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'4px' }}>CREW</div>
                        {m.crew.map(c => <div key={c} style={{ fontSize:'11px', color:'rgba(200,215,255,0.8)' }}>{c}</div>)}
                      </div>
                    )}

                    {m.site && <div style={{ fontSize:'11px', marginTop:'8px', color:'rgba(126,184,247,0.6)' }}>Target: {m.site}</div>}

                    {m.liveUrl && (
                      <a href={m.liveUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'12px', padding:'8px 16px', background:'rgba(255,170,0,0.1)', border:'1px solid rgba(255,170,0,0.3)', borderRadius:'8px', color:'#ffaa00', fontSize:'11px', textDecoration:'none', letterSpacing:'1px', fontFamily:'inherit' }}>
                        <span className="lm-live" style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ffaa00', display:'inline-block' }} />
                        WATCH LIVE WHEN AVAILABLE
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {activeTab === 'charts' && (
          <div>
            {/* Missions by Decade — Bar Chart */}
            <div className="lm-card" style={{ padding:'20px', marginBottom:'20px' }}>
              <div style={{ fontSize:'10px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'16px', textTransform:'uppercase' }}>Missions by Decade</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap: isMobile ? '4px' : '8px', height:'160px', paddingBottom:'24px', position:'relative' }}>
                {Object.entries(stats.decades).sort((a,b) => +a[0] - +b[0]).map(([decade, count]) => {
                  const maxCount = Math.max(...Object.values(stats.decades));
                  const height = (count / maxCount) * 120;
                  return (
                    <div key={decade} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end' }}>
                      <div style={{ fontSize:'11px', color:'#7eb8f7', marginBottom:'4px' }}>{count}</div>
                      <div style={{ width:'100%', maxWidth:'48px', height:`${height}px`, background:'linear-gradient(to top, rgba(59,130,246,0.6), rgba(59,130,246,0.2))', borderRadius:'4px 4px 0 0', transition:'height 0.5s ease' }} />
                      <div style={{ fontSize:'9px', color:'rgba(126,184,247,0.4)', marginTop:'6px', letterSpacing:'1px' }}>{decade}s</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missions by Country */}
            <div className="lm-card" style={{ padding:'20px', marginBottom:'20px' }}>
              <div style={{ fontSize:'10px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'16px', textTransform:'uppercase' }}>Missions by Country / Agency</div>
              {(() => {
                const byCountry = {};
                MISSIONS.forEach(m => { byCountry[m.country] = (byCountry[m.country] || 0) + 1; });
                const sorted = Object.entries(byCountry).sort((a,b) => b[1] - a[1]);
                const maxC = sorted[0]?.[1] || 1;
                return sorted.map(([country, count]) => (
                  <div key={country} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                    <div style={{ width:'80px', fontSize:'11px', color:'rgba(200,215,255,0.7)', textAlign:'right', flexShrink:0 }}>{country}</div>
                    <div style={{ flex:1, height:'20px', background:'rgba(15,20,40,0.5)', borderRadius:'4px', overflow:'hidden', position:'relative' }}>
                      <div style={{ width:`${(count/maxC)*100}%`, height:'100%', background:`linear-gradient(90deg, ${COUNTRY_COLORS[country] || '#3b82f6'}88, ${COUNTRY_COLORS[country] || '#3b82f6'}44)`, borderRadius:'4px', transition:'width 0.6s ease' }} />
                    </div>
                    <div style={{ width:'24px', fontSize:'12px', color:'#7eb8f7', fontWeight:'bold' }}>{count}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Mission Types */}
            <div className="lm-card" style={{ padding:'20px', marginBottom:'20px' }}>
              <div style={{ fontSize:'10px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'16px', textTransform:'uppercase' }}>Mission Types</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {(() => {
                  const byType = {};
                  MISSIONS.forEach(m => { const label = TYPE_LABELS[m.type] || m.type; byType[label] = (byType[label] || 0) + 1; });
                  return Object.entries(byType).sort((a,b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} style={{ padding:'8px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:'20px', fontSize:'11px' }}>
                      <span style={{ color:'rgba(200,215,255,0.7)' }}>{type}</span>
                      <span style={{ marginLeft:'8px', color:'#7eb8f7', fontWeight:'bold' }}>{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Milestone Timeline */}
            <div className="lm-card" style={{ padding:'20px' }}>
              <div style={{ fontSize:'10px', letterSpacing:'2px', color:'rgba(126,184,247,0.5)', marginBottom:'16px', textTransform:'uppercase' }}>Key Milestones</div>
              {[
                { year: 1959, text: 'First object to reach the Moon (Luna 2)' },
                { year: 1966, text: 'First soft landing (Luna 9)' },
                { year: 1969, text: 'First humans on the Moon (Apollo 11)' },
                { year: 1970, text: 'First robotic sample return (Luna 16)' },
                { year: 1972, text: 'Last humans on the Moon (Apollo 17)' },
                { year: 1994, text: 'First evidence of polar water ice (Clementine)' },
                { year: 2013, text: 'First landing in 37 years (Chang\'e 3)' },
                { year: 2019, text: 'First far-side landing (Chang\'e 4)' },
                { year: 2023, text: 'First south pole landing (Chandrayaan-3)' },
                { year: 2024, text: 'First commercial landing (IM-1 Odysseus)' },
                { year: 2028, text: 'Humans return to Moon surface (Artemis IV)', future: true },
              ].map((ms, i) => (
                <div key={i} style={{ display:'flex', gap:'12px', marginBottom:'12px', opacity: ms.future ? 0.6 : 1 }}>
                  <div style={{ width:'40px', fontSize:'11px', color:'#7eb8f7', fontWeight:'bold', flexShrink:0, textAlign:'right' }}>{ms.year}</div>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: ms.future ? 'rgba(123,140,255,0.5)' : 'rgba(0,204,136,0.6)', marginTop:'4px', flexShrink:0 }} />
                  <div style={{ fontSize:'12px', color:'rgba(200,215,255,0.7)', lineHeight:1.5 }}>{ms.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'16px 32px', borderTop:'1px solid rgba(59,130,246,0.08)', textAlign:'center', fontSize:'9px', color:'rgba(126,184,247,0.3)', letterSpacing:'2px' }}>
        DATA SOURCES: NASA · ESA · CNSA · ISRO · JAXA · ROSCOSMOS
      </div>
    </div>
  );
}
