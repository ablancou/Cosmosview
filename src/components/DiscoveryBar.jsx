import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   DISCOVERY BAR — Subtle contextual hint strip at the bottom of the screen.
   Slowly rotates through tips to help users discover features.
   Toggleable, barely visible (90%+ transparent), never obstructive.
   ═══════════════════════════════════════════════════════════════════════════ */

const HINTS = [
  { text: 'Pinch to zoom the sky', icon: '👆', action: null },
  { text: 'Tap a star to learn its name', icon: '⭐', action: null },
  { text: 'Try Lunar Flyover — orbit the Moon in 3D', icon: '🚀', action: 'lunarFlyover' },
  { text: 'Artemis II is LIVE — track the mission now', icon: '🏛️', action: 'artemisII' },
  { text: 'Explore 35+ lunar missions in the dashboard', icon: '🛰️', action: 'lunarMissions' },
  { text: 'Watch space live — curated NASA & YouTube channels', icon: '📺', action: 'spaceChannels' },
  { text: 'Live Moon Cam — real telescope feeds of the lunar surface', icon: '🔭', action: 'liveMoonCam' },
  { text: 'Open the menu to explore all features', icon: '☰', action: null },
  { text: 'Try Night Vision mode for dark-adapted viewing', icon: '👁️', action: 'nightVision' },
  { text: 'View Earth from space in the Observatory', icon: '🌍', action: 'earthGlobe' },
  { text: 'See tonight\'s best visible objects', icon: '🌟', action: 'tonight' },
  { text: 'Swipe to rotate the sky · Double-tap to center', icon: '🔄', action: null },
  { text: 'NASA\'s Photo of the Day — updated daily', icon: '🛸', action: 'apod' },
];

const ROTATE_INTERVAL = 6000; // ms between hint changes
const FADE_DURATION = 800; // ms for fade transition

export default function DiscoveryBar({ onAction, darkMode = true }) {
  const [visible, setVisible] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    try {
      const stored = window.sessionStorage?.getItem('discoveryBarDismissed');
      if (stored === 'true') setDismissed(true);
    } catch { /* ignore */ }
  }, []);

  const rotateHint = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % HINTS.length);
      setFading(false);
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (!visible || dismissed) return;
    timerRef.current = setInterval(rotateHint, ROTATE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [visible, dismissed, rotateHint]);

  const handleDismiss = () => {
    setDismissed(true);
    try { window.sessionStorage?.setItem('discoveryBarDismissed', 'true'); } catch { /* ignore */ }
  };

  const handleRestore = () => {
    setDismissed(false);
    try { window.sessionStorage?.removeItem('discoveryBarDismissed'); } catch { /* ignore */ }
  };

  const handleHintClick = () => {
    const hint = HINTS[currentIdx];
    if (hint.action && onAction) {
      onAction(hint.action);
    }
  };

  if (dismissed) {
    /* Tiny restore pill — bottom-left */
    return (
      <button
        onClick={handleRestore}
        className="fixed z-[30] rounded-full flex items-center justify-center transition-all active:scale-90"
        style={{
          bottom: '24px',
          left: '24px',
          width: '32px',
          height: '32px',
          background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`,
          opacity: 0.4,
        }}
        aria-label="Show tips"
      >
        <span style={{ fontSize: '12px' }}>💡</span>
      </button>
    );
  }

  const hint = HINTS[currentIdx];

  return (
    <div
      className="fixed z-[30] flex items-center justify-center"
      style={{
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(480px, calc(100vw - 100px))',
      }}
    >
      <div
        className="w-full flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
        }}
      >
        {/* Hint content — clickable if it has an action */}
        <div
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={hint.action ? handleHintClick : undefined}
          style={{ cursor: hint.action ? 'pointer' : 'default' }}
          role={hint.action ? 'button' : undefined}
          tabIndex={hint.action ? 0 : undefined}
        >
          <span
            className="text-sm shrink-0 transition-opacity"
            style={{
              opacity: fading ? 0 : 0.6,
              transition: `opacity ${FADE_DURATION}ms ease`,
            }}
          >
            {hint.icon}
          </span>
          <span
            className="text-[11px] truncate transition-opacity"
            style={{
              color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
              opacity: fading ? 0 : 1,
              transition: `opacity ${FADE_DURATION}ms ease`,
              letterSpacing: '0.3px',
            }}
          >
            {hint.text}
          </span>
          {hint.action && (
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className="shrink-0 transition-opacity"
              style={{ opacity: fading ? 0 : 0.3, transition: `opacity ${FADE_DURATION}ms ease` }}
              stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 1.5L7 5L3 8.5" />
            </svg>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 shrink-0 mx-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{
                background: darkMode
                  ? `rgba(255,255,255,${(currentIdx % 3) === i ? 0.35 : 0.1})`
                  : `rgba(0,0,0,${(currentIdx % 3) === i ? 0.3 : 0.08})`,
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
          style={{ opacity: 0.3 }}
          aria-label="Dismiss tips"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1l6 6M7 1l-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
