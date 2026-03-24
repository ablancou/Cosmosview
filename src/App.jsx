import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from './store/useAppStore';
import SkyCanvas from './components/SkyCanvas';
import ImmersiveNav from './components/ImmersiveNav';
import FeatureTooltip, { hasSeenTooltip, markTooltipSeen, hasTooltipFor } from './components/FeatureTooltip';
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
import EarthGlobe from './components/EarthGlobe';
import DSOInfoCard from './components/DSOInfoCard';
import AmbientSoundscape from './components/AmbientSoundscape';
import AstroPhotoPlanner from './components/AstroPhotoPlanner';
import MultiLocationCompare from './components/MultiLocationCompare';
import ShareThisSky from './components/ShareThisSky';
import EventNotifications from './components/EventNotifications';
import TelescopeMode from './components/TelescopeMode';
import AstroWeather from './components/AstroWeather';
import ConstellationNarrator from './components/ConstellationNarrator';
import AccessibilityPanel from './components/AccessibilityPanel';
import MoonGlobe from './components/MoonGlobe';
import LightPollutionSimulator from './components/LightPollutionSimulator';
import AsteroidTracker from './components/AsteroidTracker';
import ExoplanetExplorer from './components/ExoplanetExplorer';
import DSNLivePanel from './components/DSNLivePanel';
import LoadingScreen from './components/LoadingScreen';
import TermsPopup from './components/TermsPopup';
import useGeolocation from './hooks/useGeolocation';
import useAstroTime from './hooks/useAstroTime';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

/**
 * Root application component — Immersive sky-first design.
 * Single floating button + radial menu navigation.
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
        if (!localStorage.getItem('od_tutorial_seen')) {
            localStorage.setItem('od_tutorial_seen', '1');
            return true;
        }
        return false;
    });
    const [liveCamsOpen, setLiveCamsOpen] = useState(false);
    const [arMode, setARMode] = useState(false);
    const [orbitalTrackerOpen, setOrbitalTrackerOpen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [photoplannerOpen, setPhotoplannerOpen] = useState(false);
    const [compareModeOpen, setCompareModeOpen] = useState(false);
    const [earthGlobeOpen, setEarthGlobeOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [eventNotifOpen, setEventNotifOpen] = useState(false);
    const [telescopeOpen, setTelescopeOpen] = useState(false);
    const [astroWeatherOpen, setAstroWeatherOpen] = useState(false);
    const [narratorOpen, setNarratorOpen] = useState(false);
    const [narratorConstellation, setNarratorConstellation] = useState(null);
    const [accessibilityOpen, setAccessibilityOpen] = useState(false);
    const [moonGlobeOpen, setMoonGlobeOpen] = useState(false);
    const [lightPollutionOpen, setLightPollutionOpen] = useState(false);
    const [asteroidTrackerOpen, setAsteroidTrackerOpen] = useState(false);
    const [exoplanetsOpen, setExoplanetsOpen] = useState(false);
    const [dsnLiveOpen, setDsnLiveOpen] = useState(false);
    const [quickStartOpen, setQuickStartOpen] = useState(() => {
        if (!localStorage.getItem('od_quickstart_seen')) {
            localStorage.setItem('od_quickstart_seen', '1');
            return true;
        }
        return false;
    });

    // Feature tooltip state
    const [pendingTooltip, setPendingTooltip] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    const loading = useAppStore((s) => s.loading);
    const setLoading = useAppStore((s) => s.setLoading);
    const setStarData = useAppStore((s) => s.setStarData);
    const setConstellationData = useAppStore((s) => s.setConstellationData);
    const setLowPerf = useAppStore((s) => s.setLowPerf);
    const darkMode = useAppStore((s) => s.darkMode);
    const nightVision = useAppStore((s) => s.nightVision);
    const setTimeOffset = useAppStore((s) => s.setTimeOffset);
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
            link.download = `orbitaldome_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_')}.png`;
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

    /* ─── Execute a feature action ─── */
    const executeAction = useCallback((actionId) => {
        switch (actionId) {
            case 'tonight': setTonightOpen(true); break;
            case 'events': setEventsOpen(true); break;
            case 'moon': setMoonDashboardOpen(true); break;
            case 'orrery': setOrreryOpen(true); break;
            case 'orbitalTracker': setOrbitalTrackerOpen(true); break;
            case 'apod': setApodOpen(true); break;
            case 'liveCams': setLiveCamsOpen(true); break;
            case 'arMode': setARMode(true); break;
            case 'quiz': setQuizOpen(true); break;
            case 'tutorial': setTutorialOpen(true); break;
            case 'quickStart': setQuickStartOpen(true); break;
            case 'photoPlanner': setPhotoplannerOpen(true); break;
            case 'compare': setCompareModeOpen(true); break;
            case 'earthGlobe': setEarthGlobeOpen(true); break;
            case 'share': setShareOpen(true); break;
            case 'eventNotif': setEventNotifOpen(true); break;
            case 'telescope': setTelescopeOpen(true); break;
            case 'astroWeather': setAstroWeatherOpen(true); break;
            case 'accessibility': setAccessibilityOpen(true); break;
            case 'moonGlobe': setMoonGlobeOpen(true); break;
            case 'lightPollution': setLightPollutionOpen(true); break;
            case 'asteroidTracker': setAsteroidTrackerOpen(true); break;
            case 'exoplanets': setExoplanetsOpen(true); break;
            case 'dsnLive': setDsnLiveOpen(true); break;
            case 'screenshot': handleScreenshot(); break;
            case 'toggleSound': setSoundEnabled((s) => !s); break;
            default: break;
        }
    }, [handleScreenshot]);

    /* ─── Handle nav action with tooltip check ─── */
    const handleNavAction = useCallback((actionId) => {
        // Skip tooltip for instant actions
        if (actionId === 'screenshot' || actionId === 'toggleSound') {
            executeAction(actionId);
            return;
        }
        // Check if tooltip should be shown
        if (hasTooltipFor(actionId) && !hasSeenTooltip(actionId)) {
            setPendingTooltip(actionId);
            setPendingAction(actionId);
            return;
        }
        executeAction(actionId);
    }, [executeAction]);

    /* ─── Dismiss tooltip and execute pending action ─── */
    const handleTooltipDismiss = useCallback(() => {
        if (pendingTooltip) {
            markTooltipSeen(pendingTooltip);
        }
        if (pendingAction) {
            executeAction(pendingAction);
        }
        setPendingTooltip(null);
        setPendingAction(null);
    }, [pendingTooltip, pendingAction, executeAction]);

    return (
        <div className={`w-full h-full relative ${darkMode ? '' : 'light'}`}>
            {showLoading && (
                <LoadingScreen progress={loadingProgress} onComplete={handleLoadingComplete} />
            )}

            {!loading && !compareModeOpen && <SkyCanvas />}

            {compareModeOpen && (
                <MultiLocationCompare onClose={() => setCompareModeOpen(false)} />
            )}

            {/* Monthly Events Banner */}
            <MonthlyEventsBanner />

            {/* Terms and Privacy Popup */}
            <TermsPopup />

            {/* Night Vision Overlay */}
            {!loading && nightVision && (
                <div
                    className="fixed inset-0 pointer-events-none z-40"
                    style={{ background: 'rgba(80, 0, 0, 0.25)', mixBlendMode: 'multiply' }}
                />
            )}

            {/* ═══ Immersive Navigation ═══ */}
            {!loading && (
                <ImmersiveNav
                    onAction={handleNavAction}
                    activeStates={{ sound: soundEnabled }}
                />
            )}

            {/* ═══ Feature Tooltip ═══ */}
            {pendingTooltip && (
                <FeatureTooltip
                    featureId={pendingTooltip}
                    onDismiss={handleTooltipDismiss}
                />
            )}

            {/* ═══ Feature Panels ═══ */}
            {!loading && <StarInfoCard />}
            {!loading && <CelestialInfoPanel />}
            {!loading && <DSOInfoCard />}
            {!loading && <AmbientSoundscape enabled={soundEnabled} />}
            {!loading && <MoonDashboard open={moonDashboardOpen} onClose={() => setMoonDashboardOpen(false)} />}
            {!loading && <SkyEventsPanel open={eventsOpen} onClose={() => setEventsOpen(false)} />}
            {!loading && <NasaApodPanel open={apodOpen} onClose={() => setApodOpen(false)} />}
            {!loading && <TonightsBestPanel open={tonightOpen} onClose={() => setTonightOpen(false)} />}
            {!loading && <AstroPhotoPlanner open={photoplannerOpen} onClose={() => setPhotoplannerOpen(false)} />}
            {!loading && <SolarSystemOrrery open={orreryOpen} onClose={() => setOrreryOpen(false)} />}
            {!loading && <AstroQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />}
            {!loading && <AppTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />}
            {!loading && <OrbitalTracker open={orbitalTrackerOpen} onClose={() => setOrbitalTrackerOpen(false)} />}
            {!loading && <EarthGlobe open={earthGlobeOpen} onClose={() => setEarthGlobeOpen(false)} />}
            {!loading && <ShareThisSky open={shareOpen} onClose={() => setShareOpen(false)} />}
            {!loading && <EventNotifications open={eventNotifOpen} onClose={() => setEventNotifOpen(false)} />}
            {!loading && <TelescopeMode open={telescopeOpen} onClose={() => setTelescopeOpen(false)} />}
            {!loading && <AstroWeather open={astroWeatherOpen} onClose={() => setAstroWeatherOpen(false)} />}
            {!loading && <AccessibilityPanel open={accessibilityOpen} onClose={() => setAccessibilityOpen(false)} />}
            {!loading && <MoonGlobe open={moonGlobeOpen} onClose={() => setMoonGlobeOpen(false)} />}
            {!loading && <LightPollutionSimulator open={lightPollutionOpen} onClose={() => setLightPollutionOpen(false)} />}
            {!loading && <AsteroidTracker open={asteroidTrackerOpen} onClose={() => setAsteroidTrackerOpen(false)} />}
            {!loading && <ExoplanetExplorer open={exoplanetsOpen} onClose={() => setExoplanetsOpen(false)} />}
            {!loading && <DSNLivePanel open={dsnLiveOpen} onClose={() => setDsnLiveOpen(false)} />}
            {!loading && narratorConstellation && (
                <ConstellationNarrator
                    constellation={narratorConstellation}
                    open={narratorOpen}
                    onClose={() => { setNarratorOpen(false); setNarratorConstellation(null); }}
                />
            )}
            {!loading && (
                <QuickStartGuide
                    open={quickStartOpen}
                    onClose={() => setQuickStartOpen(false)}
                    onAction={(action) => {
                        setQuickStartOpen(false);
                        switch (action) {
                            case 'timeTravel':
                                setTimeOffset(6 * 3600 * 1000);
                                break;
                            case 'tonight': setTonightOpen(true); break;
                            case 'orrery': setOrreryOpen(true); break;
                            case 'moon': setMoonDashboardOpen(true); break;
                            case 'quiz': setQuizOpen(true); break;
                            case 'startrails': toggleStarTrails(); break;
                            case 'liveCams': setLiveCamsOpen(true); break;
                            case 'orbitalTracker': setOrbitalTrackerOpen(true); break;
                            default: break;
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
