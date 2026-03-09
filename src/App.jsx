import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from './store/useAppStore';
import SkyCanvas from './components/SkyCanvas';
import ControlPanel from './components/ControlPanel';
import StarInfoCard from './components/StarInfoCard';
import CelestialInfoPanel from './components/CelestialInfoPanel';
import MoonDashboard from './components/MoonDashboard';
import SkyEventsPanel from './components/SkyEventsPanel';
import NasaApodPanel from './components/NasaApodPanel';
import MonthlyEventsBanner from './components/MonthlyEventsBanner';
import SolarSystemOrrery from './components/SolarSystemOrrery';
import TonightsBestPanel from './components/TonightsBestPanel';
import ConstellationInfoPanel from './components/ConstellationInfoPanel';
import AstroQuiz from './components/AstroQuiz';
import AppTutorial from './components/AppTutorial';
import LiveSkyCameras from './components/LiveSkyCameras';
import ARCameraMode from './components/ARCameraMode';
import QuickStartGuide from './components/QuickStartGuide';
import OrbitalTracker from './components/OrbitalTracker';
import DSOInfoCard from './components/DSOInfoCard';
import LoadingScreen from './components/LoadingScreen';
import useGeolocation from './hooks/useGeolocation';
import useAstroTime from './hooks/useAstroTime';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

/**
 * Root application component — 33 features, 106 modules.
 */
export default function App() {
    const { t } = useTranslation();
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [showLoading, setShowLoading] = useState(true);
    const [moonDashboardOpen, setMoonDashboardOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [apodOpen, setApodOpen] = useState(false);
    const [orreryOpen, setOrreryOpen] = useState(false);
    const [tonightOpen, setTonightOpen] = useState(false);
    const [quizOpen, setQuizOpen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(() => {
        // Auto-open on first visit
        if (!localStorage.getItem('cosmosview_tutorial_seen')) {
            localStorage.setItem('cosmosview_tutorial_seen', '1');
            return true;
        }
        return false;
    });
    const [liveCamsOpen, setLiveCamsOpen] = useState(false);
    const [arMode, setARMode] = useState(false);
    const [orbitalTrackerOpen, setOrbitalTrackerOpen] = useState(false);
    const [quickStartOpen, setQuickStartOpen] = useState(() => {
        if (!localStorage.getItem('cosmosview_quickstart_seen')) {
            localStorage.setItem('cosmosview_quickstart_seen', '1');
            return true;
        }
        return false;
    });
    const [showShortcuts, setShowShortcuts] = useState(false);

    const loading = useAppStore((s) => s.loading);
    const setLoading = useAppStore((s) => s.setLoading);
    const setStarData = useAppStore((s) => s.setStarData);
    const setConstellationData = useAppStore((s) => s.setConstellationData);
    const setLowPerf = useAppStore((s) => s.setLowPerf);
    const darkMode = useAppStore((s) => s.darkMode);
    const location = useAppStore((s) => s.location);
    const time = useAppStore((s) => s.time);
    const nightVision = useAppStore((s) => s.nightVision);
    const toggleNightVision = useAppStore((s) => s.toggleNightVision);
    const setTimeOffset = useAppStore((s) => s.setTimeOffset);
    const autoRotate = useAppStore((s) => s.autoRotate);
    const toggleAutoRotate = useAppStore((s) => s.toggleAutoRotate);
    const gyroscope = useAppStore((s) => s.gyroscope);
    const toggleGyroscope = useAppStore((s) => s.toggleGyroscope);
    const starTrails = useAppStore((s) => s.starTrails);
    const toggleStarTrails = useAppStore((s) => s.toggleStarTrails);
    const selectedConstellation = useAppStore((s) => s.selectedConstellation);
    const clearSelectedConstellation = useAppStore((s) => s.clearSelectedConstellation);

    useGeolocation();
    useAstroTime();

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onToggleMoon: (force) => setMoonDashboardOpen((v) => (force === false ? false : !v)),
        onToggleEvents: (force) => setEventsOpen((v) => (force === false ? false : !v)),
    });

    // GPU detection
    const detectGPUPerformance = useCallback(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) { setLowPerf(true); return; }
            const start = performance.now();
            const vertices = new Float32Array(900);
            for (let i = 0; i < 900; i++) vertices[i] = Math.random();
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            for (let i = 0; i < 10; i++) gl.clear(gl.COLOR_BUFFER_BIT);
            gl.finish();
            setLowPerf(performance.now() - start > 50);
            gl.deleteBuffer(buffer);
            canvas.width = 0; canvas.height = 0;
        } catch (e) { setLowPerf(true); }
    }, [setLowPerf]);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingProgress(10);
                detectGPUPerformance();
                setLoadingProgress(20);
                const starResponse = await fetch('/hyg_v3_mag65.json');
                setStarData(await starResponse.json());
                setLoadingProgress(60);
                const conResponse = await fetch('/constellations_iau.json');
                setConstellationData(await conResponse.json());
                setLoadingProgress(90);
                setLoadingProgress(100);
            } catch (error) {
                console.error('Failed to load data:', error);
                setLoadingProgress(100);
            }
        };
        loadData();
    }, [detectGPUPerformance, setStarData, setConstellationData]);

    const handleLoadingComplete = useCallback(() => {
        setShowLoading(false);
        setLoading(false);
    }, [setLoading]);

    // Screenshot
    const handleScreenshot = useCallback(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        try {
            const link = document.createElement('a');
            link.download = `cosmosview_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Screenshot failed:', e);
        }
    }, []);

    // Dark mode
    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.remove('light');
            root.style.colorScheme = 'dark';
            document.body.style.background = '#08080f';
        } else {
            root.classList.add('light');
            root.style.colorScheme = 'light';
            document.body.style.background = '#f5f0e8';
        }
    }, [darkMode]);

    return (
        <div className={`w-full h-full relative ${darkMode ? '' : 'light'}`}>
            {showLoading && (
                <LoadingScreen progress={loadingProgress} onComplete={handleLoadingComplete} />
            )}

            {!loading && <SkyCanvas />}

            {/* Monthly Events Banner */}
            <MonthlyEventsBanner />

            {/* Night Vision */}
            {!loading && nightVision && (
                <div
                    className="fixed inset-0 pointer-events-none z-40"
                    style={{ background: 'rgba(80, 0, 0, 0.25)', mixBlendMode: 'multiply' }}
                />
            )}

            {/* HUD Top Bar */}
            {!loading && (
                <div className="hidden lg:flex fixed top-4 left-[340px] right-4 z-20 items-center justify-between">
                    <div className="glass-panel px-4 py-2 flex items-center gap-4">
                        <span className="text-xs text-cosmos-muted">📍 {location.city}</span>
                        <span className="text-xs font-mono text-cosmos-text">
                            {time.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-xs text-cosmos-muted">
                            {time.current.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {time.speed > 1 && (
                            <span className="text-xs font-mono text-cosmos-accent">⏩ {time.speed}×</span>
                        )}
                        {starTrails && (
                            <span className="text-xs font-mono text-purple-400">📷 Star Trails</span>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Action Buttons — 2 columns for 10 buttons */}
            {!loading && (
                <div className="fixed bottom-6 right-6 z-30 flex gap-2">
                    {/* Column 2 (secondary) */}
                    <div className="flex flex-col gap-2">
                        {/* Tonight's Best */}
                        <FAB
                            active={tonightOpen}
                            onClick={() => setTonightOpen((o) => !o)}
                            emoji="🌟"
                            title="Tonight's Best Objects"
                            activeClass="bg-indigo-900/40 text-indigo-300 ring-2 ring-indigo-500/40"
                        />
                        {/* Orbital Tracker */}
                        <FAB
                            active={orbitalTrackerOpen}
                            onClick={() => setOrbitalTrackerOpen((o) => !o)}
                            emoji="📡"
                            title="Orbital Tracking System"
                            activeClass="bg-cyan-900/40 text-cyan-300 ring-2 ring-cyan-500/40"
                        />
                        {/* Solar System */}
                        <FAB
                            active={orreryOpen}
                            onClick={() => setOrreryOpen((o) => !o)}
                            emoji="☀️"
                            title="Solar System Orrery"
                            activeClass="bg-orange-900/40 text-orange-300 ring-2 ring-orange-500/40"
                        />
                        {/* Star Trails */}
                        <FAB
                            active={starTrails}
                            onClick={toggleStarTrails}
                            emoji="📷"
                            title="Star Trails"
                            activeClass="bg-purple-900/40 text-purple-300 ring-2 ring-purple-500/40"
                        />
                        {/* AstroQuiz */}
                        <FAB
                            active={quizOpen}
                            onClick={() => setQuizOpen((o) => !o)}
                            emoji="🎓"
                            title="AstroQuiz"
                            activeClass="bg-emerald-900/40 text-emerald-300 ring-2 ring-emerald-500/40"
                        />
                        {/* Gyroscope */}
                        <FAB
                            active={gyroscope}
                            onClick={toggleGyroscope}
                            emoji="📱"
                            title="Gyroscope Mode"
                            activeClass="bg-green-900/40 text-green-300 ring-2 ring-green-500/40"
                        />
                        {/* Live Cameras */}
                        <FAB
                            active={liveCamsOpen}
                            onClick={() => setLiveCamsOpen((o) => !o)}
                            emoji="🌐"
                            title="Live Observatory Cameras"
                            activeClass="bg-teal-900/40 text-teal-300 ring-2 ring-teal-500/40"
                        />
                        {/* AR Camera */}
                        <FAB
                            active={arMode}
                            onClick={() => setARMode((o) => !o)}
                            emoji="📹"
                            title="AR Camera Mode"
                            activeClass="bg-lime-900/40 text-lime-300 ring-2 ring-lime-500/40"
                        />
                    </div>

                    {/* Column 1 (primary) */}
                    <div className="flex flex-col gap-2">
                        {/* NASA APOD */}
                        <FAB
                            active={apodOpen}
                            onClick={() => setApodOpen((o) => !o)}
                            emoji="🛸"
                            title="NASA Picture of the Day"
                            activeClass="bg-blue-900/40 text-blue-300 ring-2 ring-blue-500/40"
                        />
                        {/* Sky Events */}
                        <FAB
                            active={eventsOpen}
                            onClick={() => setEventsOpen((o) => !o)}
                            emoji="🔭"
                            title="Sky Events (E)"
                            activeClass="bg-purple-900/40 text-purple-300 ring-2 ring-purple-500/40"
                        />
                        {/* Moon Dashboard */}
                        <FAB
                            active={moonDashboardOpen}
                            onClick={() => setMoonDashboardOpen((o) => !o)}
                            emoji="🌙"
                            title="Moon Dashboard (M)"
                            activeClass="bg-yellow-900/40 text-yellow-300 ring-2 ring-yellow-500/40"
                        />
                        {/* Screenshot */}
                        <FAB onClick={handleScreenshot} emoji="📸" title="Screenshot" />
                        {/* Night Vision */}
                        <FAB
                            active={nightVision}
                            onClick={toggleNightVision}
                            emoji="👁️"
                            title="Night Vision (N)"
                            activeClass="bg-red-900/80 text-red-300 ring-2 ring-red-500/50"
                        />
                        {/* Auto-Rotate */}
                        <FAB
                            active={autoRotate}
                            onClick={toggleAutoRotate}
                            emoji="🔄"
                            title="Auto-Rotate (R)"
                            activeClass="bg-cosmos-accent/20 text-cosmos-accent ring-2 ring-cosmos-accent/50"
                            spin={autoRotate}
                        />
                        {/* Tutorial Guide */}
                        <FAB
                            active={tutorialOpen}
                            onClick={() => setTutorialOpen((o) => !o)}
                            emoji="❓"
                            title="App Guide"
                            activeClass="bg-indigo-900/40 text-indigo-300 ring-2 ring-indigo-500/40"
                        />
                        {/* Quick Start */}
                        <FAB
                            active={quickStartOpen}
                            onClick={() => setQuickStartOpen((o) => !o)}
                            emoji="🚀"
                            title="Try This!"
                            activeClass="bg-amber-900/40 text-amber-300 ring-2 ring-amber-500/40"
                        />
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts — accessible via ? key */}
            {!loading && showShortcuts && (
                <div
                    className="fixed bottom-6 right-20 z-40 glass-panel p-4 w-56 animate-slideUp"
                    onClick={() => setShowShortcuts(false)}
                >
                    <h4 className="text-xs font-bold text-cosmos-accent mb-2">⌨️ Shortcuts</h4>
                    <div className="space-y-1 text-xs text-cosmos-text">
                        {[
                            ['N', 'Night Vision'],
                            ['R', 'Auto-Rotate'],
                            ['Space', 'Play / Pause'],
                            ['M', 'Moon Dashboard'],
                            ['E', 'Sky Events'],
                            ['Esc', 'Close Panels'],
                        ].map(([key, label]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-cosmos-muted">{label}</span>
                                <kbd className="px-1.5 py-0.5 rounded bg-cosmos-border/30 font-mono text-[10px]">{key}</kbd>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && <ControlPanel />}
            {!loading && <StarInfoCard />}
            {!loading && <CelestialInfoPanel />}
            {!loading && <DSOInfoCard />}
            {!loading && <MoonDashboard open={moonDashboardOpen} onClose={() => setMoonDashboardOpen(false)} />}
            {!loading && <SkyEventsPanel open={eventsOpen} onClose={() => setEventsOpen(false)} />}
            {!loading && <NasaApodPanel open={apodOpen} onClose={() => setApodOpen(false)} />}
            {!loading && <TonightsBestPanel open={tonightOpen} onClose={() => setTonightOpen(false)} />}
            {!loading && <SolarSystemOrrery open={orreryOpen} onClose={() => setOrreryOpen(false)} />}
            {!loading && <AstroQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />}
            {!loading && <AppTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />}
            {!loading && <OrbitalTracker open={orbitalTrackerOpen} onClose={() => setOrbitalTrackerOpen(false)} />}
            {!loading && (
                <QuickStartGuide
                    open={quickStartOpen}
                    onClose={() => setQuickStartOpen(false)}
                    onAction={(action) => {
                        setQuickStartOpen(false);
                        switch (action) {
                            case 'timeTravel':
                                setTimeOffset(6 * 3600 * 1000); // Jump +6h (sunset)
                                break;
                            case 'tonight':
                                setTonightOpen(true);
                                break;
                            case 'orrery':
                                setOrreryOpen(true);
                                break;
                            case 'moon':
                                setMoonDashboardOpen(true);
                                break;
                            case 'quiz':
                                setQuizOpen(true);
                                break;
                            case 'startrails':
                                toggleStarTrails();
                                break;
                            case 'liveCams':
                                setLiveCamsOpen(true);
                                break;
                            case 'orbitalTracker':
                                setOrbitalTrackerOpen(true);
                                break;
                        }
                    }}
                />
            )}
            {!loading && <LiveSkyCameras open={liveCamsOpen} onClose={() => setLiveCamsOpen(false)} />}
            {!loading && (
                <ARCameraMode
                    active={arMode}
                    onActivate={() => setARMode(true)}
                    onDeactivate={() => setARMode(false)}
                />
            )}
            {!loading && (
                <ConstellationInfoPanel
                    constellationId={selectedConstellation}
                    onClose={clearSelectedConstellation}
                />
            )}
        </div>
    );
}

/**
 * Reusable Floating Action Button
 */
function FAB({ active, onClick, emoji, title, activeClass = '', spin = false }) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${active ? activeClass : 'glass-panel text-cosmos-muted hover:text-cosmos-accent'
                    }`}
                title={title}
                aria-label={title}
            >
                <span className={`text-base ${spin ? 'animate-spin-slow' : ''}`}>{emoji}</span>
            </button>
            {/* Visible tooltip on hover */}
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                <span className="text-[11px] text-white/90 font-medium">{title}</span>
            </div>
        </div>
    );
}
