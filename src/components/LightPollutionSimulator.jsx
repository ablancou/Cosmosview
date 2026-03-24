import React, { useState, useEffect, useCallback, useRef } from 'react';

const BORTLE_DATA = {
  1: {
    name: 'Excellent Dark Sky',
    limitingMagnitude: '7.6-8.0',
    starsVisible: 7500,
    description: 'Zodiacal light and gegenschein visible. Perfect for astronomical observation.',
  },
  2: {
    name: 'Typical Dark Site',
    limitingMagnitude: '7.1-7.5',
    starsVisible: 5500,
    description: 'Zodiacal light easily visible. Excellent viewing conditions.',
  },
  3: {
    name: 'Rural Sky',
    limitingMagnitude: '6.6-7.0',
    starsVisible: 4000,
    description: 'Some light pollution visible on the horizon.',
  },
  4: {
    name: 'Rural/Suburban Transition',
    limitingMagnitude: '6.1-6.5',
    starsVisible: 2500,
    description: 'Light domes from nearby towns visible on horizon.',
  },
  5: {
    name: 'Suburban Sky',
    limitingMagnitude: '5.6-6.0',
    starsVisible: 1500,
    description: 'Milky Way very faint or invisible. Noticeable sky glow.',
  },
  6: {
    name: 'Bright Suburban',
    limitingMagnitude: '5.1-5.5',
    starsVisible: 900,
    description: 'Milky Way completely invisible. Significant light pollution.',
  },
  7: {
    name: 'Suburban/Urban Transition',
    limitingMagnitude: '4.6-5.0',
    starsVisible: 500,
    description: 'Sky glow visible everywhere. Only bright stars visible.',
  },
  8: {
    name: 'City Sky',
    limitingMagnitude: '4.1-4.5',
    starsVisible: 250,
    description: 'Only bright constellations and planets visible. Heavy light pollution.',
  },
  9: {
    name: 'Inner City',
    limitingMagnitude: '3.5-4.0',
    starsVisible: 100,
    description: 'Only brightest stars and planets visible. Extreme light pollution.',
  },
};

const getGlowColor = (bortle) => {
  const colors = {
    1: 'rgba(255, 200, 100, 0)',
    2: 'rgba(255, 200, 100, 0.05)',
    3: 'rgba(255, 200, 100, 0.1)',
    4: 'rgba(255, 210, 100, 0.15)',
    5: 'rgba(255, 180, 80, 0.25)',
    6: 'rgba(255, 160, 60, 0.35)',
    7: 'rgba(255, 140, 40, 0.45)',
    8: 'rgba(255, 100, 20, 0.55)',
    9: 'rgba(255, 80, 0, 0.65)',
  };
  return colors[bortle] || colors[5];
};

const getSkyOverlay = (bortle) => {
  const overlays = {
    1: 'rgba(10, 10, 30, 0)',
    2: 'rgba(15, 15, 40, 0.05)',
    3: 'rgba(20, 15, 40, 0.1)',
    4: 'rgba(30, 20, 40, 0.15)',
    5: 'rgba(40, 25, 50, 0.25)',
    6: 'rgba(60, 30, 60, 0.35)',
    7: 'rgba(80, 40, 80, 0.45)',
    8: 'rgba(100, 50, 80, 0.55)',
    9: 'rgba(120, 60, 60, 0.65)',
  };
  return overlays[bortle] || overlays[5];
};

function LightPollutionSimulator({ open, onClose }) {
  const [bortle, setBortle] = useState(5);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBortleChange = useCallback((e) => {
    setBortle(parseInt(e.target.value, 10));
  }, []);

  const currentData = BORTLE_DATA[bortle];

  if (!open) return null;

  return (
    <>
      {/* Light Pollution Overlay Effect */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 998,
          background: `radial-gradient(ellipse at center bottom, ${getGlowColor(bortle)} 0%, transparent 70%), ${getSkyOverlay(bortle)}`,
          transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Panel Overlay (clickable to close) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 999,
          backgroundColor: 'transparent',
        }}
      />

      {/* Main Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          ...(isMobile
            ? {
                bottom: 0,
                left: 0,
                right: 0,
                height: 'auto',
                maxHeight: '70vh',
                borderRadius: '20px 20px 0 0',
              }
            : {
                top: 0,
                right: 0,
                width: '380px',
                height: '100%',
                borderRadius: '0',
              }),
          zIndex: 1000,
          backgroundColor: 'rgba(12, 14, 28, 0.96)',
          border: `1px solid rgba(126, 184, 247, 0.12)`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          animation: isMobile
            ? 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'slideLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 16px 20px',
            borderBottom: '1px solid rgba(126, 184, 247, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              letterSpacing: '0.5px',
            }}
          >
            Light Pollution
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: 'rgba(126, 184, 247, 0.6)',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#7eb8f7')}
            onMouseLeave={(e) => (e.target.style.color = 'rgba(126, 184, 247, 0.6)')}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Slider Section */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#e0e0e0',
                  letterSpacing: '0.3px',
                }}
              >
                Bortle Scale
              </label>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#7eb8f7',
                  minWidth: '24px',
                  textAlign: 'right',
                }}
              >
                {bortle}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="9"
              value={bortle}
              onChange={handleBortleChange}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right,
                  #7eb8f7 0%,
                  #7eb8f7 ${((bortle - 1) / 8) * 100}%,
                  rgba(126, 184, 247, 0.2) ${((bortle - 1) / 8) * 100}%,
                  rgba(126, 184, 247, 0.2) 100%)`,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
              onInput={(e) => {
                const percent = ((e.target.value - 1) / 8) * 100;
                e.target.style.background = `linear-gradient(to right,
                  #7eb8f7 0%,
                  #7eb8f7 ${percent}%,
                  rgba(126, 184, 247, 0.2) ${percent}%,
                  rgba(126, 184, 247, 0.2) 100%)`;
              }}
            />

            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                borderRadius: 50%;
                background: #7eb8f7;
                cursor: pointer;
                box-shadow: 0 0 8px rgba(126, 184, 247, 0.6);
                border: 2px solid rgba(126, 184, 247, 0.8);
              }
              input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                borderRadius: 50%;
                background: #7eb8f7;
                cursor: pointer;
                box-shadow: 0 0 8px rgba(126, 184, 247, 0.6);
                border: 2px solid rgba(126, 184, 247, 0.8);
              }
            `}</style>

            {/* Scale Labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '11px',
                color: 'rgba(224, 224, 224, 0.5)',
              }}
            >
              <span>Dark Sky</span>
              <span>City</span>
            </div>
          </div>

          {/* Data Display */}
          <div
            style={{
              backgroundColor: 'rgba(126, 184, 247, 0.05)',
              border: '1px solid rgba(126, 184, 247, 0.1)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '15px',
                fontWeight: '600',
                color: '#7eb8f7',
                letterSpacing: '0.3px',
              }}
            >
              {currentData.name}
            </h3>

            <p
              style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#c0c0c0',
              }}
            >
              {currentData.description}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(224, 224, 224, 0.6)',
                    marginBottom: '4px',
                    letterSpacing: '0.2px',
                  }}
                >
                  Limiting Magnitude
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#e0e0e0',
                  }}
                >
                  {currentData.limitingMagnitude}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(224, 224, 224, 0.6)',
                    marginBottom: '4px',
                    letterSpacing: '0.2px',
                  }}
                >
                  Stars Visible
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#e0e0e0',
                  }}
                >
                  ~{currentData.starsVisible.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(224, 224, 224, 0.5)',
              lineHeight: '1.6',
              padding: '12px',
              backgroundColor: 'rgba(126, 184, 247, 0.03)',
              borderRadius: '8px',
              borderLeft: '3px solid rgba(126, 184, 247, 0.3)',
            }}
          >
            <p style={{ margin: 0 }}>
              The Bortle scale measures light pollution from 1 (pristine dark skies) to 9
              (inner city). The overlay shows how sky brightness changes at each level,
              affecting visibility of stars and deep-sky objects.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideLeft {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default LightPollutionSimulator;
