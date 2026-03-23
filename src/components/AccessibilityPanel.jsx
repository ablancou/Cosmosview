import React, { useState, useEffect, useContext, createContext } from 'react';

/* Inline X icon (no lucide-react dependency) */
const X = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

// Accessibility Context for global state management
const AccessibilityContext = createContext(null);

/**
 * useAccessibility Hook
 * Provides access to current accessibility state across the application
 */
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

/**
 * AccessibilityProvider
 * Wraps the app and provides accessibility context to all children
 */
export const AccessibilityProvider = ({ children }) => {
  const [accessibilityState, setAccessibilityState] = useState({
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    fontScale: 100,
    colorBlindMode: 'normal',
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedState = {
      screenReader: localStorage.getItem('od-sr-mode') === 'true',
      highContrast: localStorage.getItem('od-high-contrast') === 'true',
      reducedMotion: localStorage.getItem('od-reduced-motion') === 'true',
      fontScale: parseInt(localStorage.getItem('od-font-size') || '100', 10),
      colorBlindMode: localStorage.getItem('od-colorblind') || 'normal',
    };
    setAccessibilityState(savedState);
  }, []);

  return (
    <AccessibilityContext.Provider value={accessibilityState}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * AccessibilityPanel Component
 * Modal panel for accessibility settings in Orbital Dome
 */
const AccessibilityPanel = ({ open, onClose }) => {
  // Local state for settings
  const [screenReader, setScreenReader] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [colorBlindMode, setColorBlindMode] = useState('normal');

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedScreenReader = localStorage.getItem('od-sr-mode') === 'true';
    const savedHighContrast = localStorage.getItem('od-high-contrast') === 'true';
    const savedReducedMotion = localStorage.getItem('od-reduced-motion') === 'true';
    const savedFontSize = parseInt(localStorage.getItem('od-font-size') || '100', 10);
    const savedColorBlindMode = localStorage.getItem('od-colorblind') || 'normal';

    setScreenReader(savedScreenReader);
    setHighContrast(savedHighContrast);
    setReducedMotion(savedReducedMotion);
    setFontScale(savedFontSize);
    setColorBlindMode(savedColorBlindMode);

    // Apply persisted settings on load
    applySettings({
      screenReader: savedScreenReader,
      highContrast: savedHighContrast,
      reducedMotion: savedReducedMotion,
      fontScale: savedFontSize,
      colorBlindMode: savedColorBlindMode,
    });
  }, []);

  // Apply settings to DOM and local storage
  const applySettings = (settings) => {
    const root = document.documentElement;

    // Screen Reader Mode
    if (settings.screenReader !== undefined) {
      localStorage.setItem('od-sr-mode', settings.screenReader);
      root.setAttribute('data-sr-mode', settings.screenReader);
    }

    // High Contrast Mode
    if (settings.highContrast !== undefined) {
      localStorage.setItem('od-high-contrast', settings.highContrast);
      root.setAttribute('data-high-contrast', settings.highContrast);
    }

    // Reduced Motion
    if (settings.reducedMotion !== undefined) {
      localStorage.setItem('od-reduced-motion', settings.reducedMotion);
      root.style.setProperty('--od-reduced-motion', settings.reducedMotion ? '1' : '0');
      root.setAttribute('data-reduced-motion', settings.reducedMotion);
    }

    // Font Scale
    if (settings.fontScale !== undefined) {
      localStorage.setItem('od-font-size', settings.fontScale);
      root.style.setProperty('--od-font-scale', `${settings.fontScale / 100}`);
    }

    // Color Blind Mode
    if (settings.colorBlindMode !== undefined) {
      localStorage.setItem('od-colorblind', settings.colorBlindMode);
      root.setAttribute('data-colorblind-mode', settings.colorBlindMode);
      applyColorBlindFilter(settings.colorBlindMode);
    }
  };

  // Apply color blind filters
  const applyColorBlindFilter = (mode) => {
    const root = document.documentElement;
    let filter = '';

    switch (mode) {
      case 'protanopia':
        // Red-blind: Simulate protanopia (red-blind)
        filter = 'url(#protanopia-filter)';
        break;
      case 'deuteranopia':
        // Green-blind: Simulate deuteranopia (green-blind)
        filter = 'url(#deuteranopia-filter)';
        break;
      case 'tritanopia':
        // Blue-yellow blind: Simulate tritanopia (blue-yellow blind)
        filter = 'url(#tritanopia-filter)';
        break;
      default:
        filter = 'none';
    }

    root.style.setProperty('--od-colorblind-filter', filter);
  };

  // Handle Screen Reader toggle
  const handleScreenReaderToggle = () => {
    const newValue = !screenReader;
    setScreenReader(newValue);
    applySettings({ screenReader: newValue });
  };

  // Handle High Contrast toggle
  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    applySettings({ highContrast: newValue });
  };

  // Handle Reduced Motion toggle
  const handleReducedMotionToggle = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    applySettings({ reducedMotion: newValue });
  };

  // Handle Font Scale change
  const handleFontScaleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setFontScale(newValue);
    applySettings({ fontScale: newValue });
  };

  // Handle Color Blind Mode change
  const handleColorBlindModeChange = (e) => {
    const newValue = e.target.value;
    setColorBlindMode(newValue);
    applySettings({ colorBlindMode: newValue });
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
      >
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-700/30 bg-slate-900/50 backdrop-blur-lg">
            <h2
              id="accessibility-title"
              className="text-xl font-bold text-slate-100"
            >
              Accessibility Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Close accessibility settings"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Screen Reader Mode */}
            <section aria-labelledby="sr-mode-heading">
              <h3 id="sr-mode-heading" className="text-sm font-semibold text-slate-300 mb-3">
                Screen Reader Mode
              </h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={screenReader}
                  onChange={handleScreenReaderToggle}
                  className="w-5 h-5 rounded bg-slate-700 border border-slate-600 checked:bg-cyan-500 checked:border-cyan-400 cursor-pointer transition-colors"
                  aria-describedby="sr-mode-desc"
                />
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">Enable Screen Reader Mode</p>
                  <p
                    id="sr-mode-desc"
                    className="text-sm text-slate-400 mt-1"
                  >
                    Adds verbose descriptions of sky objects and aria-live regions for better screen reader compatibility
                  </p>
                </div>
              </label>
            </section>

            <div className="h-px bg-gradient-to-r from-slate-700/20 via-slate-600/50 to-slate-700/20" />

            {/* High Contrast Mode */}
            <section aria-labelledby="hc-mode-heading">
              <h3 id="hc-mode-heading" className="text-sm font-semibold text-slate-300 mb-3">
                High Contrast Mode
              </h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={handleHighContrastToggle}
                  className="w-5 h-5 rounded bg-slate-700 border border-slate-600 checked:bg-cyan-500 checked:border-cyan-400 cursor-pointer transition-colors"
                  aria-describedby="hc-mode-desc"
                />
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">Enable High Contrast Mode</p>
                  <p
                    id="hc-mode-desc"
                    className="text-sm text-slate-400 mt-1"
                  >
                    Brighter stars, thicker constellation lines, and higher contrast text for better visibility
                  </p>
                </div>
              </label>
            </section>

            <div className="h-px bg-gradient-to-r from-slate-700/20 via-slate-600/50 to-slate-700/20" />

            {/* Reduced Motion */}
            <section aria-labelledby="rm-mode-heading">
              <h3 id="rm-mode-heading" className="text-sm font-semibold text-slate-300 mb-3">
                Reduced Motion
              </h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={handleReducedMotionToggle}
                  className="w-5 h-5 rounded bg-slate-700 border border-slate-600 checked:bg-cyan-500 checked:border-cyan-400 cursor-pointer transition-colors"
                  aria-describedby="rm-mode-desc"
                />
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">Reduce Motion</p>
                  <p
                    id="rm-mode-desc"
                    className="text-sm text-slate-400 mt-1"
                  >
                    Disables CSS animations and transitions. Respects prefers-reduced-motion system setting
                  </p>
                </div>
              </label>
            </section>

            <div className="h-px bg-gradient-to-r from-slate-700/20 via-slate-600/50 to-slate-700/20" />

            {/* Font Size Slider */}
            <section aria-labelledby="font-size-heading">
              <div className="flex items-center justify-between mb-3">
                <h3 id="font-size-heading" className="text-sm font-semibold text-slate-300">
                  Font Size
                </h3>
                <span className="text-sm font-medium text-cyan-400">{fontScale}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="150"
                value={fontScale}
                onChange={handleFontScaleChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                aria-label="Adjust font size percentage"
                aria-valuemin="80"
                aria-valuemax="150"
                aria-valuenow={fontScale}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>80%</span>
                <span>150%</span>
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-slate-700/20 via-slate-600/50 to-slate-700/20" />

            {/* Color Blind Mode */}
            <section aria-labelledby="colorblind-heading">
              <h3 id="colorblind-heading" className="text-sm font-semibold text-slate-300 mb-3">
                Color Blind Mode
              </h3>
              <select
                value={colorBlindMode}
                onChange={handleColorBlindModeChange}
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-medium hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors cursor-pointer"
                aria-label="Select color blind mode"
              >
                <option value="normal">Normal Vision</option>
                <option value="protanopia">Protanopia (Red-Blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                <option value="tritanopia">Tritanopia (Blue-Yellow Blind)</option>
              </select>
              <p className="text-sm text-slate-400 mt-2">
                Simulates color perception for people with color vision deficiency
              </p>
            </section>

            <div className="h-px bg-gradient-to-r from-slate-700/20 via-slate-600/50 to-slate-700/20" />

            {/* Keyboard Navigation Guide */}
            <section aria-labelledby="keyboard-guide-heading">
              <h3 id="keyboard-guide-heading" className="text-sm font-semibold text-slate-300 mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    N
                  </kbd>
                  <span className="text-sm text-slate-300">Night Vision</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    R
                  </kbd>
                  <span className="text-sm text-slate-300">Auto-Rotate</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    Space
                  </kbd>
                  <span className="text-sm text-slate-300">Play/Pause Time</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    M
                  </kbd>
                  <span className="text-sm text-slate-300">Moon Dashboard</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    E
                  </kbd>
                  <span className="text-sm text-slate-300">Sky Events</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    Esc
                  </kbd>
                  <span className="text-sm text-slate-300">Close Panels</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    Tab
                  </kbd>
                  <span className="text-sm text-slate-300">Navigate Controls</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    ↑↓←→
                  </kbd>
                  <span className="text-sm text-slate-300">Pan Sky View</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg">
                  <kbd className="px-2.5 py-1 bg-slate-700 rounded text-xs font-mono text-cyan-300 border border-slate-600 flex-shrink-0">
                    +/−
                  </kbd>
                  <span className="text-sm text-slate-300">Zoom In/Out</span>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-700/30 bg-slate-900/50 backdrop-blur-lg">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilityPanel;
