import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import useAppStore from '../store/useAppStore';
import StarField from './StarField';
import FaintStarField from './FaintStarField';
import ConstellationLines from './ConstellationLines';
import CelestialGrid from './CelestialGrid';
import MilkyWay from './MilkyWay';
import Planets from './Planets';
import HorizonAtmosphere from './HorizonAtmosphere';
import ProceduralSkybox from './ProceduralSkybox';
import MoonRenderer from './MoonRenderer';
import ShootingStars from './ShootingStars';
import NebulaGlow from './NebulaGlow';
import SatelliteTracker from './SatelliteTracker';
import GroundLandscape from './GroundLandscape';
import CompassRose from './CompassRose';
import AuroraBorealis from './AuroraBorealis';
import EclipticLine from './EclipticLine';
import StarTrails from './StarTrails';
import DeepSkyObjects from './DeepSkyObjects';
import AtmosphericScattering from './AtmosphericScattering';
import { localSiderealTime, getObserverRotation, equatorialToHorizontal } from '../utils/coordinates';
import { useLocationContext } from '../contexts/LocationContext';

/**
 * Main Three.js canvas component.
 * Features: drag with inertia, pinch/scroll zoom, touch support,
 * auto-rotate, star/planet raycasting, celestial rotation, aurora.
 */
export default function SkyCanvas() {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const composerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const celestialSphereRef = useRef(null);
    const frameIdRef = useRef(null);
    const mouseRef = useRef({
        x: 0, y: 0, isDown: false, lastX: 0, lastY: 0,
        velocityX: 0, velocityY: 0,
    });
    const rotationRef = useRef({ phi: Math.PI / 2, theta: 0 });
    const raycasterRef = useRef(new THREE.Raycaster());
    const starFieldRef = useRef(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const touchRef = useRef({ startDist: 0, startFov: 70 });

    const [sceneReady, setSceneReady] = useState(false);

    const location = useLocationContext();
    const time = useAppStore((s) => s.time);
    const layers = useAppStore((s) => s.layers);
    const setSelectedStar = useAppStore((s) => s.setSelectedStar);
    const starData = useAppStore((s) => s.starData);
    const darkMode = useAppStore((s) => s.darkMode);
    const autoRotate = useAppStore((s) => s.autoRotate);
    const searchTarget = useAppStore((s) => s.searchTarget);
    const setSearchTarget = useAppStore((s) => s.setSearchTarget);

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(darkMode ? 0x030308 : 0xc5d4e8);
        scene.fog = darkMode ? new THREE.FogExp2(0x030308, 0.00008) : null;
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 10000);
        camera.position.set(0, 0, 0);
        cameraRef.current = camera;

        const celestialSphere = new THREE.Group();
        scene.add(celestialSphere);
        celestialSphereRef.current = celestialSphere;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: !(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)),
                alpha: false,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false,
            });
        } catch (e) {
            console.error('WebGL initialization failed:', e);
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:white;text-align:center;padding:2rem;font-family:sans-serif"><div><h2>WebGL Not Available</h2><p style="opacity:0.6;margin-top:0.5rem">Your browser does not support WebGL, which is required for the 3D sky view. Try updating your browser or using Chrome/Safari.</p></div></div>';
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.sortObjects = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Bloom post-processing (skip on mobile — too GPU-intensive)
        const _isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        if (!_isMobileDevice) {
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(width, height),
                0.4,   // strength — subtle but visible glow
                0.6,   // radius — how far bloom spreads
                0.85   // threshold — only bright objects bloom
            );
            composer.addPass(bloomPass);
        }
        composerRef.current = composer;

        scene.add(new THREE.AmbientLight(0xffffff, 0.03));
        setSceneReady(true);

        const handleResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            if (composerRef.current) composerRef.current.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Update background on dark mode change
    useEffect(() => {
        if (sceneRef.current) {
            sceneRef.current.background = new THREE.Color(darkMode ? 0x030308 : 0xc5d4e8);
            sceneRef.current.fog = darkMode ? new THREE.FogExp2(0x030308, 0.00008) : null;
        }
    }, [darkMode]);

    // Update celestial sphere rotation
    useEffect(() => {
        if (!celestialSphereRef.current) return;
        const lst = localSiderealTime(time.current, location.lon);
        const { latRad, lstRad } = getObserverRotation(location.lat, lst);
        const sphere = celestialSphereRef.current;
        sphere.rotation.set(0, 0, 0);
        sphere.rotateY(-lstRad);
        sphere.rotateX(-latRad);
    }, [location.lat, location.lon, time.current]);

    // Camera look direction
    const updateCameraLook = useCallback(() => {
        if (!cameraRef.current) return;
        const { phi, theta } = rotationRef.current;
        const lookDir = new THREE.Vector3(
            Math.sin(phi) * Math.sin(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.cos(theta)
        );
        cameraRef.current.lookAt(lookDir);
    }, []);

    // === Search fly-to animation ===
    useEffect(() => {
        if (!searchTarget || !cameraRef.current) return;

        let ra, dec;
        if (searchTarget.ra != null && searchTarget.dec != null) {
            ra = searchTarget.ra;
            dec = searchTarget.dec;
        } else if (searchTarget.stars && searchTarget.stars.length > 0) {
            const s = searchTarget.stars[0];
            ra = s[0] / 15;
            dec = s[1];
        } else {
            setSearchTarget(null);
            return;
        }

        const targetTheta = ra * 15 * (Math.PI / 180);
        const targetPhi = (90 - dec) * (Math.PI / 180);
        const startPhi = rotationRef.current.phi;
        const startTheta = rotationRef.current.theta;
        const duration = 1200;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            rotationRef.current.phi = startPhi + (targetPhi - startPhi) * ease;
            rotationRef.current.theta = startTheta + (targetTheta - startTheta) * ease;
            updateCameraLook();
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                setSearchTarget(null);
            }
        };
        requestAnimationFrame(animate);
    }, [searchTarget, setSearchTarget, updateCameraLook]);

    // === Pointer handlers with inertia ===
    const handlePointerDown = useCallback((e) => {
        if (e.pointerType === 'touch' && e.isPrimary === false) return;
        const mx = e.clientX || 0;
        const my = e.clientY || 0;
        mouseRef.current.isDown = true;
        mouseRef.current.lastX = mx;
        mouseRef.current.lastY = my;
        mouseRef.current.velocityX = 0;
        mouseRef.current.velocityY = 0;
        dragStartRef.current = { x: mx, y: my };
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (e.pointerType === 'touch' && e.isPrimary === false) return;
        const mx = e.clientX || 0;
        const my = e.clientY || 0;

        if (mouseRef.current.isDown) {
            const dx = mx - mouseRef.current.lastX;
            const dy = my - mouseRef.current.lastY;

            rotationRef.current.theta -= dx * 0.003;
            rotationRef.current.phi = Math.max(0.01, Math.min(Math.PI - 0.01,
                rotationRef.current.phi + dy * 0.003));

            mouseRef.current.velocityX = dx * 0.003;
            mouseRef.current.velocityY = dy * 0.003;
            updateCameraLook();
        }

        mouseRef.current.lastX = mx;
        mouseRef.current.lastY = my;
    }, [updateCameraLook]);

    const handlePointerUp = useCallback(() => {
        mouseRef.current.isDown = false;
    }, []);

    // === Touch pinch zoom ===
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchRef.current.startDist = Math.sqrt(dx * dx + dy * dy);
                touchRef.current.startFov = cameraRef.current?.fov || 70;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && cameraRef.current) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const scale = touchRef.current.startDist / dist;
                const newFov = Math.max(15, Math.min(100, touchRef.current.startFov * scale));
                cameraRef.current.fov = newFov;
                cameraRef.current.updateProjectionMatrix();
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    // Star & DSO click handler
    const handleClick = useCallback((e) => {
        const dx = Math.abs(e.clientX - dragStartRef.current.x);
        const dy = Math.abs(e.clientY - dragStartRef.current.y);
        if (dx > 5 || dy > 5) return;

        if (!rendererRef.current || !cameraRef.current) return;

        const rect = rendererRef.current.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

        // Check DSO sprites first (they're in the celestial sphere)
        if (celestialSphereRef.current) {
            const dsoIntersects = raycasterRef.current.intersectObjects(celestialSphereRef.current.children, true);
            for (const hit of dsoIntersects) {
                const ud = hit.object.userData;
                if (ud && ud.isDSO) {
                    const { setSelectedDSO } = useAppStore.getState();
                    setSelectedDSO({ id: ud.dsoId, name: ud.dsoName, ra: ud.dsoRA, dec: ud.dsoDec, type: ud.dsoType });
                    return;
                }
            }
        }

        // Then check stars
        if (starFieldRef.current) {
            raycasterRef.current.params.Points.threshold = 5;
            const intersects = raycasterRef.current.intersectObject(starFieldRef.current, true);
            if (intersects.length > 0) {
                const idx = intersects[0].index;
                if (idx !== undefined && starData[idx]) {
                    const star = starData[idx];
                    const lst = localSiderealTime(time.current, location.lon);
                    const { alt, az } = equatorialToHorizontal(star.ra, star.dec, location.lat, lst);
                    setSelectedStar({ ...star, alt, az });
                }
            }
        }
    }, [starData, time.current, location, setSelectedStar]);

    // Render loop with inertia + auto-rotate
    useEffect(() => {
        if (!sceneReady) return;

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            // Auto-rotate
            if (autoRotate && !mouseRef.current.isDown) {
                rotationRef.current.theta += 0.0005;
                updateCameraLook();
            }

            // Camera inertia
            if (!mouseRef.current.isDown && !autoRotate) {
                const vx = mouseRef.current.velocityX;
                const vy = mouseRef.current.velocityY;

                if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
                    rotationRef.current.theta -= vx;
                    rotationRef.current.phi = Math.max(0.01, Math.min(Math.PI - 0.01,
                        rotationRef.current.phi + vy));

                    mouseRef.current.velocityX *= 0.95;
                    mouseRef.current.velocityY *= 0.95;
                    updateCameraLook();
                }
            }

            if (sceneRef.current && cameraRef.current) {
                if (composerRef.current) {
                    composerRef.current.render();
                } else if (rendererRef.current) {
                    rendererRef.current.render(sceneRef.current, cameraRef.current);
                }
            }
        };

        updateCameraLook();
        animate();

        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
        };
    }, [sceneReady, updateCameraLook, autoRotate]);

    // Scroll zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();
            if (!cameraRef.current) return;
            const fov = cameraRef.current.fov;
            const newFov = Math.max(15, Math.min(100, fov + e.deltaY * 0.05));
            cameraRef.current.fov = newFov;
            cameraRef.current.updateProjectionMatrix();
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleClick}
            role="application"
            aria-label="Sky view - drag to rotate, scroll/pinch to zoom"
        >
            {sceneReady && celestialSphereRef.current && (
                <>
                    {/* Background */}
                    <ProceduralSkybox scene={celestialSphereRef.current} />
                    <AtmosphericScattering scene={sceneRef.current} />
                    <NebulaGlow scene={celestialSphereRef.current} />

                    {/* Environment layers */}
                    {layers.milkyWay && <MilkyWay scene={celestialSphereRef.current} />}
                    {layers.ground && <GroundLandscape scene={sceneRef.current} />}
                    {layers.atmosphere && <HorizonAtmosphere scene={sceneRef.current} />}
                    {layers.aurora && <AuroraBorealis scene={sceneRef.current} />}

                    {/* Grids */}
                    {(layers.equatorialGrid || layers.altAzGrid) && (
                        <CelestialGrid
                            scene={layers.equatorialGrid ? celestialSphereRef.current : null}
                            altAzScene={layers.altAzGrid ? sceneRef.current : null}
                        />
                    )}

                    {/* Celestial objects */}
                    {layers.stars && (
                        <StarField
                            scene={celestialSphereRef.current}
                            camera={cameraRef.current}
                            ref={starFieldRef}
                        />
                    )}
                    {layers.stars && (
                        <FaintStarField
                            scene={celestialSphereRef.current}
                            camera={cameraRef.current}
                        />
                    )}
                    {layers.planets && <MoonRenderer scene={celestialSphereRef.current} />}
                    {layers.planets && <Planets scene={celestialSphereRef.current} />}
                    <DeepSkyObjects scene={celestialSphereRef.current} />
                    {layers.satellites && <SatelliteTracker scene={sceneRef.current} />}

                    {/* Overlays */}
                    {layers.constellations && (
                        <ConstellationLines
                            scene={celestialSphereRef.current}
                            camera={cameraRef.current}
                        />
                    )}
                    {layers.cardinalDirections && <CompassRose scene={sceneRef.current} />}
                    {layers.ecliptic && <EclipticLine scene={celestialSphereRef.current} />}

                    {/* Effects */}
                    <ShootingStars scene={celestialSphereRef.current} />
                    <StarTrails scene={celestialSphereRef.current} camera={cameraRef.current} />
                </>
            )}
        </div>
    );
}
