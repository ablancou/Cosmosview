import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const DSN_COMPLEXES = [
  { id: 'goldstone', name: 'Goldstone', location: 'California, USA', lat: 35.43, lon: -116.89, antennas: ['DSS-14 (70m)', 'DSS-24 (34m)', 'DSS-25 (34m)', 'DSS-26 (34m)'] },
  { id: 'canberra', name: 'Canberra', location: 'Australia', lat: -35.40, lon: 148.98, antennas: ['DSS-43 (70m)', 'DSS-34 (34m)', 'DSS-35 (34m)', 'DSS-36 (34m)'] },
  { id: 'madrid', name: 'Madrid', location: 'Spain', lat: 40.43, lon: -3.95, antennas: ['DSS-63 (70m)', 'DSS-54 (34m)', 'DSS-55 (34m)', 'DSS-56 (34m)'] },
];

const SPACECRAFT = [
  { name: 'Voyager 1', mission: 'Interstellar', distance_AU: 163.7, distance_light_hours: 22.8, band: 'S/X', data_rate_bps: 160, launched: 1977, icon: '🛰️', description: 'Farthest human-made object from Earth' },
  { name: 'Voyager 2', mission: 'Interstellar', distance_AU: 137.2, distance_light_hours: 19.1, band: 'S/X', data_rate_bps: 160, launched: 1977, icon: '🛰️', description: 'Only spacecraft to visit Uranus and Neptune' },
  { name: 'New Horizons', mission: 'Kuiper Belt', distance_AU: 59.8, distance_light_hours: 8.3, band: 'X', data_rate_bps: 1000, launched: 2006, icon: '🚀', description: 'First to explore Pluto and Kuiper Belt' },
  { name: 'JWST', mission: 'L2 Orbit', distance_AU: 0.01, distance_light_hours: 0.0, band: 'Ka', data_rate_bps: 28000000, launched: 2021, icon: '🔭', description: 'Most powerful space telescope ever built' },
  { name: 'Mars Perseverance', mission: 'Mars Surface', distance_AU: 1.5, distance_light_hours: 0.21, band: 'X/Ka', data_rate_bps: 2000000, launched: 2020, icon: '🤖', description: 'Searching for ancient Martian life' },
  { name: 'Mars Ingenuity', mission: 'Mars Surface', distance_AU: 1.5, distance_light_hours: 0.21, band: 'UHF', data_rate_bps: 250000, launched: 2020, icon: '🚁', description: 'First powered flight on another world' },
  { name: 'Juno', mission: 'Jupiter Orbit', distance_AU: 5.2, distance_light_hours: 0.72, band: 'X/Ka', data_rate_bps: 25000, launched: 2011, icon: '🪐', description: 'Studying Jupiter atmosphere and magnetosphere' },
  { name: 'OSIRIS-APEX', mission: 'Apophis Flyby', distance_AU: 1.2, distance_light_hours: 0.17, band: 'X', data_rate_bps: 900000, launched: 2016, icon: '☄️', description: 'Redirected to study asteroid Apophis' },
  { name: 'Lucy', mission: 'Trojan Asteroids', distance_AU: 2.8, distance_light_hours: 0.39, band: 'X', data_rate_bps: 100000, launched: 2021, icon: '💎', description: 'Studying Trojan asteroids of Jupiter' },
  { name: 'Parker Solar Probe', mission: 'Solar', distance_AU: 0.06, distance_light_hours: 0.01, band: 'Ka', data_rate_bps: 500000, launched: 2018, icon: '☀️', description: 'Closest spacecraft to the Sun' },
  { name: 'Europa Clipper', mission: 'Jupiter/Europa', distance_AU: 3.5, distance_light_hours: 0.49, band: 'X/Ka', data_rate_bps: 50000, launched: 2024, icon: '🧊', description: 'Investigating Europas ocean for habitability' },
  { name: 'Psyche', mission: 'Asteroid 16 Psyche', distance_AU: 2.1, distance_light_hours: 0.29, band: 'X', data_rate_bps: 120000, launched: 2023, icon: '🪨', description: 'Exploring a metal-rich asteroid' },
];

const DSNLivePanel = ({ open, onClose }) => {
  const [activeConnections, setActiveConnections] = useState([]);
  const [selectedSpacecraft, setSelectedSpacecraft] = useState(null);
  const connectionIntervalRef = useRef(null);

  // Generate realistic DSN connection patterns
  const generateConnections = useCallback(() => {
    const numConnections = Math.floor(Math.random() * 3) + 3; // 3-5 connections
    const newConnections = [];
    const usedAntennas = new Set();
    const usedSpacecraft = new Set();

    for (let i = 0; i < numConnections; i++) {
      let antennaIdx, antennaName, complexId;
      let spacecraftIdx;

      // Pick unique antenna
      do {
        complexId = DSN_COMPLEXES[Math.floor(Math.random() * DSN_COMPLEXES.length)].id;
        const complex = DSN_COMPLEXES.find(c => c.id === complexId);
        antennaIdx = Math.floor(Math.random() * complex.antennas.length);
        antennaName = complex.antennas[antennaIdx];
      } while (usedAntennas.has(`${complexId}-${antennaIdx}`));

      // Pick unique spacecraft
      do {
        spacecraftIdx = Math.floor(Math.random() * SPACECRAFT.length);
      } while (usedSpacecraft.has(spacecraftIdx));

      const spacecraft = SPACECRAFT[spacecraftIdx];
      const signalStrength = Math.floor(Math.random() * 40) + 60; // 60-100%

      usedAntennas.add(`${complexId}-${antennaIdx}`);
      usedSpacecraft.add(spacecraftIdx);

      newConnections.push({
        id: `${complexId}-${antennaIdx}-${spacecraftIdx}`,
        complexId,
        antennaName,
        antennaIdx,
        spacecraftName: spacecraft.name,
        spacecraftIdx,
        signalStrength,
        dataRate: spacecraft.data_rate_bps,
        band: spacecraft.band,
      });
    }

    setActiveConnections(newConnections);
  }, []);

  // Initialize simulation
  useEffect(() => {
    if (!open) return;

    generateConnections();
    connectionIntervalRef.current = setInterval(() => {
      generateConnections();
    }, 8000 + Math.random() * 2000); // 8-10 seconds

    return () => {
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
      }
    };
  }, [open, generateConnections]);

  if (!open) return null;

  return (
    <div style={styles.panelOverlay}>
      <style>{animationStyles}</style>

      {/* Close Button */}
      <button onClick={onClose} style={styles.closeButton} aria-label="Close DSN Live Panel">
        ✕
      </button>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>NASA Deep Space Network Live</h1>
        <p style={styles.subtitle}>Real-time communications with interplanetary missions</p>
      </div>

      {/* Main Content */}
      <div style={styles.contentContainer}>
        {/* DSN Complexes Section */}
        <div style={styles.complexesSection}>
          <h2 style={styles.sectionTitle}>DSN Complexes</h2>
          <div style={styles.complexesGrid}>
            {DSN_COMPLEXES.map((complex) => {
              const activeAtComplex = activeConnections.filter(c => c.complexId === complex.id);
              return (
                <ComplexCard
                  key={complex.id}
                  complex={complex}
                  activeConnections={activeAtComplex}
                />
              );
            })}
          </div>
        </div>

        {/* Signal Visualization Section */}
        <div style={styles.visualizationSection}>
          <h2 style={styles.sectionTitle}>Active Transmissions</h2>
          <SignalVisualization
            connections={activeConnections}
            complexes={DSN_COMPLEXES}
            spacecraft={SPACECRAFT}
          />
        </div>

        {/* Spacecraft Roster Section */}
        <div style={styles.rosterSection}>
          <h2 style={styles.sectionTitle}>Spacecraft Roster</h2>
          <SpacecraftRoster
            spacecraft={SPACECRAFT}
            activeConnections={activeConnections}
            selectedSpacecraft={selectedSpacecraft}
            onSelectSpacecraft={setSelectedSpacecraft}
          />
        </div>
      </div>
    </div>
  );
};

// Complex Card Component
const ComplexCard = ({ complex, activeConnections }) => {
  return (
    <div style={styles.complexCard}>
      <div style={styles.complexHeader}>
        <h3 style={styles.complexName}>{complex.name}</h3>
        <p style={styles.complexLocation}>{complex.location}</p>
      </div>

      <div style={styles.antennasContainer}>
        {complex.antennas.map((antenna, idx) => {
          const isActive = activeConnections.some(c => c.antennaIdx === idx);
          const connection = activeConnections.find(c => c.antennaIdx === idx);
          const size = antenna.includes('70m') ? 50 : 35;

          return (
            <div key={idx} style={styles.antennaWrapper}>
              <div
                style={{
                  ...styles.antennaDish,
                  width: size,
                  height: size,
                  opacity: isActive ? 1 : 0.4,
                  animation: isActive ? 'antennaPulse 1.5s ease-in-out infinite' : 'none',
                  boxShadow: isActive ? '0 0 20px #22dd77, inset 0 0 10px #22dd77' : '0 0 10px rgba(34, 221, 119, 0.3)',
                }}
              >
                <div style={styles.antennaCenter} />
              </div>
              <p style={styles.antennaLabel}>{antenna}</p>
              {connection && (
                <p style={styles.connectionInfo}>
                  → {connection.spacecraftName.split(' ')[0]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.complexStats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Active:</span>
          <span style={styles.statValue}>{activeConnections.length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Lat/Lon:</span>
          <span style={styles.statValue}>{complex.lat.toFixed(2)}°, {complex.lon.toFixed(2)}°</span>
        </div>
      </div>
    </div>
  );
};

// Signal Visualization Component
const SignalVisualization = ({ connections, complexes, spacecraft }) => {
  const svgRef = useRef(null);

  // Position calculations for spacecraft in circular arrangement
  const getSpacecraftPosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 150;
    const centerX = 300;
    const centerY = 200;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Complex positions
  const getComplexPosition = (complexId) => {
    const positions = {
      goldstone: { x: 100, y: 100 },
      canberra: { x: 100, y: 300 },
      madrid: { x: 500, y: 200 },
    };
    return positions[complexId] || { x: 300, y: 200 };
  };

  const activeSpacecraft = [...new Set(connections.map(c => c.spacecraftIdx))];
  const activeSpacecraftCount = activeSpacecraft.length;

  return (
    <div style={styles.visualizationContainer}>
      <svg
        ref={svgRef}
        width="100%"
        height="450"
        viewBox="0 0 600 400"
        style={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connection Lines and Pulses */}
        {connections.map((connection, idx) => {
          const complexPos = getComplexPosition(connection.complexId);
          const spacecraftPos = getSpacecraftPosition(
            connections.findIndex(c => c.spacecraftIdx === connection.spacecraftIdx),
            activeSpacecraftCount
          );
          const distance = Math.sqrt(
            Math.pow(spacecraftPos.x - complexPos.x, 2) +
            Math.pow(spacecraftPos.y - complexPos.y, 2)
          );

          return (
            <g key={connection.id}>
              {/* Gradient Definition */}
              <defs>
                <linearGradient
                  id={`grad-${idx}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#22dd77" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7eb8f7" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Signal Beam */}
              <line
                x1={complexPos.x}
                y1={complexPos.y}
                x2={spacecraftPos.x}
                y2={spacecraftPos.y}
                stroke={`url(#grad-${idx})`}
                strokeWidth="2"
                opacity="0.7"
                style={{ animation: `beamPulse ${2 + idx * 0.3}s ease-in-out infinite` }}
              />

              {/* Animated Signal Pulse Dots */}
              {[0, 0.33, 0.66].map((offset) => (
                <circle
                  key={`pulse-${offset}`}
                  cx={complexPos.x}
                  cy={complexPos.y}
                  r="4"
                  fill="#22dd77"
                  opacity="0.8"
                  style={{
                    animation: `signalTravel ${2}s linear infinite`,
                    animationDelay: `${offset * 2}s`,
                  }}
                  vectorEffect="non-scaling-stroke"
                >
                  <animateMotion dur="2s" repeatCount="indefinite">
                    <mpath href={`#path-${connection.id}`} />
                  </animateMotion>
                </circle>
              ))}

              {/* Invisible path for animateMotion */}
              <path
                id={`path-${connection.id}`}
                d={`M ${complexPos.x},${complexPos.y} L ${spacecraftPos.x},${spacecraftPos.y}`}
                style={{ display: 'none' }}
              />

              {/* Distance Label */}
              <text
                x={(complexPos.x + spacecraftPos.x) / 2}
                y={(complexPos.y + spacecraftPos.y) / 2 - 10}
                fill="#7eb8f7"
                fontSize="11"
                textAnchor="middle"
                opacity="0.8"
              >
                {spacecraft[connection.spacecraftIdx]?.distance_light_hours.toFixed(1)}h
              </text>
            </g>
          );
        })}

        {/* Complex Positions */}
        {complexes.map((complex) => {
          const pos = getComplexPosition(complex.id);
          return (
            <g key={`complex-${complex.id}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill="none"
                stroke="#7eb8f7"
                strokeWidth="2"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill="#7eb8f7"
                opacity="0.6"
              />
              <text
                x={pos.x}
                y={pos.y + 25}
                fill="#7eb8f7"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                {complex.name}
              </text>
            </g>
          );
        })}

        {/* Active Spacecraft Positions */}
        {activeSpacecraft.map((spacecraftIdx, displayIdx) => {
          const sc = spacecraft[spacecraftIdx];
          const pos = getSpacecraftPosition(displayIdx, activeSpacecraftCount);
          return (
            <g key={`spacecraft-${spacecraftIdx}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="14"
                fill="none"
                stroke="#22dd77"
                strokeWidth="2"
                style={{ animation: 'spacecraftPulse 1.5s ease-in-out infinite' }}
              />
              <text
                x={pos.x}
                y={pos.y + 3}
                fontSize="18"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {sc.icon}
              </text>
              <text
                x={pos.x}
                y={pos.y + 30}
                fill="#22dd77"
                fontSize="11"
                textAnchor="middle"
                fontWeight="bold"
              >
                {sc.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Connection Stats Below */}
      <div style={styles.connectionStats}>
        {connections.map((conn) => {
          const sc = spacecraft[conn.spacecraftIdx];
          const formatDataRate = (bps) => {
            if (bps < 1000) return `${bps} bps`;
            if (bps < 1000000) return `${(bps / 1000).toFixed(1)} kbps`;
            return `${(bps / 1000000).toFixed(1)} Mbps`;
          };

          return (
            <div key={conn.id} style={styles.connectionCard}>
              <div style={styles.connectionCardHeader}>
                <span>{conn.antennaName}</span>
                <span style={styles.complexBadge}>{conn.complexId.toUpperCase()}</span>
              </div>
              <div style={styles.connectionDetails}>
                <div>
                  <span style={styles.connectionLabel}>Spacecraft:</span>
                  <span>{sc.name}</span>
                </div>
                <div>
                  <span style={styles.connectionLabel}>Band:</span>
                  <span>{conn.band}</span>
                </div>
                <div>
                  <span style={styles.connectionLabel}>Signal:</span>
                  <div style={styles.signalBar}>
                    <div
                      style={{
                        ...styles.signalFill,
                        width: `${conn.signalStrength}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span style={styles.connectionLabel}>Rate:</span>
                  <span>{formatDataRate(conn.dataRate)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Spacecraft Roster Component
const SpacecraftRoster = ({ spacecraft, activeConnections, selectedSpacecraft, onSelectSpacecraft }) => {
  const formatDataRate = (bps) => {
    if (bps < 1000) return `${bps} bps`;
    if (bps < 1000000) return `${(bps / 1000).toFixed(1)} kbps`;
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  };

  const formatDistance = (au, lightHours) => {
    if (au < 0.1) return `${(au * 150).toFixed(1)}M km`;
    if (au < 1) return `${(au * 150).toFixed(1)}M km`;
    return `${au.toFixed(1)} AU`;
  };

  return (
    <div style={styles.rosterContainer}>
      {spacecraft.map((sc, idx) => {
        const isActive = activeConnections.some(c => c.spacecraftIdx === idx);
        const isSelected = selectedSpacecraft?.name === sc.name;

        return (
          <div
            key={sc.name}
            style={{
              ...styles.spacecraftItem,
              ...(isActive && styles.spacecraftItemActive),
              ...(isSelected && styles.spacecraftItemSelected),
            }}
            onClick={() => onSelectSpacecraft(isSelected ? null : sc)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectSpacecraft(isSelected ? null : sc);
              }
            }}
          >
            <div style={styles.spacecraftItemIcon}>{sc.icon}</div>

            <div style={styles.spacecraftItemContent}>
              <div style={styles.spacecraftItemHeader}>
                <h3 style={styles.spacecraftName}>{sc.name}</h3>
                {isActive && <div style={styles.activeBadge} />}
              </div>
              <p style={styles.spacecraftMission}>{sc.mission}</p>
              <div style={styles.spacecraftMeta}>
                <span style={styles.metaItem}>
                  <span style={styles.metaLabel}>Distance:</span> {formatDistance(sc.distance_AU, sc.distance_light_hours)}
                </span>
                <span style={styles.metaItem}>
                  <span style={styles.metaLabel}>Data Rate:</span> {formatDataRate(sc.data_rate_bps)}
                </span>
                <span style={styles.metaItem}>
                  <span style={styles.metaLabel}>Band:</span> {sc.band}
                </span>
              </div>
              {isSelected && (
                <p style={styles.spacecraftDescription}>{sc.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Styles
const styles = {
  panelOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 8, 15, 0.98)',
    zIndex: 1000,
    overflow: 'auto',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
  },

  closeButton: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(34, 221, 119, 0.2)',
    border: '2px solid #22dd77',
    color: '#22dd77',
    fontSize: '24px',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: 'rgba(34, 221, 119, 0.4)',
      transform: 'scale(1.1)',
    },
  },

  header: {
    padding: '40px 30px 20px',
    borderBottom: '1px solid rgba(126, 184, 247, 0.3)',
  },

  title: {
    margin: '0 0 10px 0',
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #22dd77 0%, #7eb8f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },

  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(126, 184, 247, 0.7)',
  },

  contentContainer: {
    flex: 1,
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#7eb8f7',
    margin: '0 0 20px 0',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textShadow: '0 0 10px rgba(126, 184, 247, 0.5)',
  },

  // Complexes Section
  complexesSection: {},

  complexesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },

  complexCard: {
    background: 'rgba(34, 221, 119, 0.05)',
    border: '1px solid rgba(34, 221, 119, 0.3)',
    borderRadius: '12px',
    padding: '25px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    ':hover': {
      borderColor: 'rgba(34, 221, 119, 0.6)',
      background: 'rgba(34, 221, 119, 0.08)',
    },
  },

  complexHeader: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(126, 184, 247, 0.3)',
  },

  complexName: {
    margin: '0 0 5px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#22dd77',
  },

  complexLocation: {
    margin: 0,
    fontSize: '12px',
    color: 'rgba(126, 184, 247, 0.6)',
  },

  antennasContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'space-around',
    marginBottom: '20px',
  },

  antennaWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },

  antennaDish: {
    borderRadius: '50%',
    border: '2px solid #22dd77',
    background: 'radial-gradient(circle at 30% 30%, rgba(34, 221, 119, 0.3), rgba(34, 221, 119, 0.05))',
    position: 'relative',
    transition: 'all 0.3s ease',
  },

  antennaCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '40%',
    height: '40%',
    borderRadius: '50%',
    backgroundColor: 'rgba(34, 221, 119, 0.5)',
    boxShadow: '0 0 8px rgba(34, 221, 119, 0.8)',
  },

  antennaLabel: {
    margin: 0,
    fontSize: '10px',
    color: 'rgba(126, 184, 247, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },

  connectionInfo: {
    margin: 0,
    fontSize: '9px',
    color: '#22dd77',
    fontWeight: '600',
    height: '14px',
  },

  complexStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '15px',
    borderTop: '1px solid rgba(126, 184, 247, 0.2)',
  },

  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },

  statLabel: {
    color: 'rgba(126, 184, 247, 0.6)',
  },

  statValue: {
    color: '#22dd77',
    fontWeight: '600',
  },

  // Visualization Section
  visualizationSection: {},

  visualizationContainer: {
    background: 'rgba(8, 8, 15, 0.6)',
    border: '1px solid rgba(126, 184, 247, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },

  svg: {
    width: '100%',
    height: '450px',
    minHeight: '450px',
  },

  connectionStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
    marginTop: '20px',
  },

  connectionCard: {
    background: 'rgba(34, 221, 119, 0.08)',
    border: '1px solid rgba(34, 221, 119, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '11px',
  },

  connectionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    color: '#22dd77',
    fontWeight: '600',
  },

  complexBadge: {
    background: 'rgba(34, 221, 119, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
  },

  connectionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: 'rgba(126, 184, 247, 0.8)',
  },

  connectionLabel: {
    fontWeight: '600',
    color: 'rgba(126, 184, 247, 0.6)',
    marginRight: '6px',
  },

  signalBar: {
    width: '80px',
    height: '4px',
    background: 'rgba(34, 221, 119, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '2px',
  },

  signalFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22dd77, #7eb8f7)',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },

  // Roster Section
  rosterSection: {},

  rosterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '10px',
  },

  spacecraftItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    background: 'rgba(34, 221, 119, 0.03)',
    border: '1px solid rgba(126, 184, 247, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    ':hover': {
      background: 'rgba(34, 221, 119, 0.08)',
      borderColor: 'rgba(126, 184, 247, 0.4)',
    },
  },

  spacecraftItemActive: {
    background: 'rgba(34, 221, 119, 0.15)',
    borderColor: 'rgba(34, 221, 119, 0.6)',
    boxShadow: '0 0 15px rgba(34, 221, 119, 0.3)',
  },

  spacecraftItemSelected: {
    background: 'rgba(34, 221, 119, 0.2)',
    borderColor: 'rgba(34, 221, 119, 0.8)',
  },

  spacecraftItemIcon: {
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
  },

  spacecraftItemContent: {
    flex: 1,
    minWidth: 0,
  },

  spacecraftItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },

  spacecraftName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#22dd77',
  },

  activeBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22dd77',
    boxShadow: '0 0 8px #22dd77',
    animation: 'pulse 1.5s ease-in-out infinite',
  },

  spacecraftMission: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    color: 'rgba(126, 184, 247, 0.7)',
  },

  spacecraftMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '11px',
    color: 'rgba(126, 184, 247, 0.6)',
  },

  metaItem: {
    display: 'flex',
    gap: '4px',
  },

  metaLabel: {
    fontWeight: '600',
    color: 'rgba(126, 184, 247, 0.5)',
  },

  spacecraftDescription: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: 'rgba(126, 184, 247, 0.7)',
    fontStyle: 'italic',
    paddingTop: '8px',
    borderTop: '1px solid rgba(126, 184, 247, 0.2)',
  },
};

// Animation Styles
const animationStyles = `
  @keyframes antennaPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  @keyframes beamPulse {
    0%, 100% {
      stroke-width: 2;
      opacity: 0.7;
    }
    50% {
      stroke-width: 3;
      opacity: 1;
    }
  }

  @keyframes signalTravel {
    0% {
      r: 4;
      opacity: 0.8;
    }
    50% {
      r: 3;
      opacity: 0.9;
    }
    100% {
      r: 2;
      opacity: 0.1;
    }
  }

  @keyframes spacecraftPulse {
    0%, 100% {
      stroke-width: 2;
      r: 14;
    }
    50% {
      stroke-width: 3;
      r: 16;
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 8px #22dd77;
      opacity: 1;
    }
    50% {
      box-shadow: 0 0 16px #22dd77;
      opacity: 0.7;
    }
  }

  /* Scrollbar styling */
  div::-webkit-scrollbar {
    width: 8px;
  }

  div::-webkit-scrollbar-track {
    background: rgba(34, 221, 119, 0.05);
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb {
    background: rgba(34, 221, 119, 0.3);
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 221, 119, 0.5);
  }
`;

export default DSNLivePanel;
