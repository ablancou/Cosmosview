import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as sat from 'satellite.js';
import useAppStore from '../store/useAppStore';

/**
 * OrbitalTracker — Futuristic sci-fi satellite tracking system.
 * Full-screen modal with embedded Three.js scene showing wireframe Earth,
 * real-time satellite orbits (SGP4), and cyberpunk HUD overlays.
 */

// ═══════════════════════════════════════════════════════
// SATELLITE DATABASE (~30 satellites across categories)
// ═══════════════════════════════════════════════════════
const SATELLITES = [
    // ── Space Stations ──
    { name: 'ISS (ZARYA)', cat: 'Station', tle1: '1 25544U 98067A   26060.50000000  .00016717  00000-0  10270-3 0  9002', tle2: '2 25544  51.6400 200.0000 0007417  50.0000 310.0000 15.49000000400000', color: '#00ff88', orbit: 'LEO' },
    { name: 'Tiangong', cat: 'Station', tle1: '1 48274U 21035A   26060.50000000  .00020000  00000-0  12000-3 0  9002', tle2: '2 48274  41.4700 150.0000 0005200  80.0000 280.0000 15.62000000200000', color: '#ff4444', orbit: 'LEO' },
    // ── Science ──
    { name: 'Hubble', cat: 'Science', tle1: '1 20580U 90037B   26060.50000000  .00001200  00000-0  60000-4 0  9002', tle2: '2 20580  28.4700 260.0000 0002850 120.0000 240.0000 15.09100000500000', color: '#ffaa00', orbit: 'LEO' },
    { name: 'JWST', cat: 'Science', tle1: '1 50463U 21130A   26060.50000000  .00000100  00000-0  10000-5 0  9002', tle2: '2 50463   1.0000  10.0000 0001000   0.0000 360.0000  0.99700000100000', color: '#ff66ff', orbit: 'L2' },
    // ── Weather ──
    { name: 'NOAA-20', cat: 'Weather', tle1: '1 43013U 17073A   26060.50000000  .00000100  00000-0  50000-5 0  9002', tle2: '2 43013  98.7400  30.0000 0001500  90.0000 270.0000 14.19500000400000', color: '#44ddff', orbit: 'LEO' },
    { name: 'GOES-18', cat: 'Weather', tle1: '1 51850U 22021A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 51850   0.0300 270.0000 0001000  90.0000 270.0000  1.00270000200000', color: '#44ddff', orbit: 'GEO' },
    // ── Navigation (GPS) ──
    { name: 'GPS IIF-1', cat: 'Navigation', tle1: '1 36585U 10022A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 36585  55.0000  60.0000 0050000  40.0000 320.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO' },
    { name: 'GPS IIF-5', cat: 'Navigation', tle1: '1 39166U 13023A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 39166  55.0000 120.0000 0050000 100.0000 260.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO' },
    { name: 'GPS III-1', cat: 'Navigation', tle1: '1 43873U 18109A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 43873  55.0000 180.0000 0050000 160.0000 200.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO' },
    { name: 'GLONASS-K1', cat: 'Navigation', tle1: '1 37829U 11064A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 37829  64.8000  40.0000 0010000  80.0000 280.0000  2.13100000300000', color: '#88ff44', orbit: 'MEO' },
    // ── Starlink constellation ──
    ...Array.from({ length: 16 }, (_, i) => ({
        name: `Starlink-${1007 + i}`,
        cat: 'Starlink',
        tle1: `1 ${44713 + i}U 19074${String.fromCharCode(65 + i)}   26060.50000000  .00002000  00000-0  10000-3 0  9002`,
        tle2: `2 ${44713 + i}  53.0500 ${(100 + i * 12) % 360}.0000 0001500  ${(90 + i * 15) % 360}.0000 ${(270 - i * 15 + 360) % 360}.0000 15.06400000300000`,
        color: '#6688ff',
        orbit: 'LEO',
    })),
];

// Category colors for HUD
const CAT_COLORS = {
    Station: '#00ff88',
    Science: '#ffaa00',
    Weather: '#44ddff',
    Navigation: '#88ff44',
    Starlink: '#6688ff',
};

// Orbit type counts
const ORBIT_TYPES = ['LEO', 'MEO', 'GEO', 'L2'];

export default function OrbitalTracker({ open, onClose }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const earthRef = useRef(null);
    const satDotsRef = useRef([]);
    const frameRef = useRef(null);
    const mouseRef = useRef({ isDown: false, x: 0, y: 0, rotX: 0, rotY: 0.4 });
    const [selectedSat, setSelectedSat] = useState(null);
    const [satPositions, setSatPositions] = useState([]);
    const [fps, setFps] = useState(60);
    const location = useAppStore((s) => s.location);

    // Parse TLEs on mount
    const satrecsRef = useRef(null);
    if (!satrecsRef.current) {
        satrecsRef.current = SATELLITES.map((s) => {
            try {
                return { ...s, satrec: sat.twoline2satrec(s.tle1, s.tle2) };
            } catch {
                return { ...s, satrec: null };
            }
        });
    }

    // ═══════════════════════════════
    // Three.js Scene Setup
    // ═══════════════════════════════
    useEffect(() => {
        if (!open || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 1);
        rendererRef.current = renderer;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        camera.position.set(0, 0, 5);
        cameraRef.current = camera;

        // ── Wireframe Earth Globe ──
        const earthGroup = new THREE.Group();
        earthRef.current = earthGroup;

        // Main sphere wireframe
        const sphereGeo = new THREE.SphereGeometry(1.5, 48, 24);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0x00cccc,
            wireframe: true,
            transparent: true,
            opacity: 0.08,
        });
        earthGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            const phi = (90 - lat) * (Math.PI / 180);
            const r = 1.52 * Math.sin(phi);
            const y = 1.52 * Math.cos(phi);
            const ring = new THREE.RingGeometry(r - 0.002, r + 0.002, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: lat === 0 ? 0x00ffcc : 0x006666,
                transparent: true,
                opacity: lat === 0 ? 0.5 : 0.2,
                side: THREE.DoubleSide,
            });
            const ringMesh = new THREE.Mesh(ring, ringMat);
            ringMesh.position.y = y;
            ringMesh.rotation.x = Math.PI / 2;
            earthGroup.add(ringMesh);
        }

        // Longitude lines
        for (let lon = 0; lon < 360; lon += 30) {
            const points = [];
            for (let i = 0; i <= 64; i++) {
                const phi = (i / 64) * Math.PI;
                const theta = lon * (Math.PI / 180);
                points.push(new THREE.Vector3(
                    1.52 * Math.sin(phi) * Math.cos(theta),
                    1.52 * Math.cos(phi),
                    1.52 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: lon === 0 ? 0x00ffcc : 0x006666,
                transparent: true,
                opacity: lon === 0 ? 0.5 : 0.15,
            });
            earthGroup.add(new THREE.Line(lineGeo, lineMat));
        }

        scene.add(earthGroup);

        // ── Satellite dots ──
        const dots = [];
        satrecsRef.current.forEach((s) => {
            const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(s.color),
                transparent: true,
                opacity: 0.9,
            });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.visible = false;
            scene.add(dot);

            // Orbit ring
            const orbitPoints = [];
            const orbitGeo = new THREE.BufferGeometry();
            const orbitMat = new THREE.LineBasicMaterial({
                color: new THREE.Color(s.color),
                transparent: true,
                opacity: 0.12,
            });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            scene.add(orbitLine);

            dots.push({ dot, orbitLine, satData: s });
        });
        satDotsRef.current = dots;

        // ── Background particles ──
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 500;
        const pPos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            pPos[i * 3] = (Math.random() - 0.5) * 30;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x224466,
            size: 0.02,
            transparent: true,
            opacity: 0.4,
        });
        scene.add(new THREE.Points(particleGeo, particleMat));

        // ── Crosshair ──
        const crosshairMat = new THREE.LineBasicMaterial({ color: 0x00cccc, transparent: true, opacity: 0.3 });
        [
            [new THREE.Vector3(-0.15, 0, 0), new THREE.Vector3(0.15, 0, 0)],
            [new THREE.Vector3(0, -0.15, 0), new THREE.Vector3(0, 0.15, 0)],
        ].forEach(([a, b]) => {
            const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
            const line = new THREE.Line(geo, crosshairMat);
            line.renderOrder = 100;
            scene.add(line);
        });

        // ── Animation loop ──
        let lastTime = performance.now();
        let frameCount = 0;
        let fpsAccum = 0;

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);

            // FPS counter
            const now = performance.now();
            frameCount++;
            fpsAccum += now - lastTime;
            lastTime = now;
            if (fpsAccum > 500) {
                setFps(Math.round((frameCount / fpsAccum) * 1000));
                frameCount = 0;
                fpsAccum = 0;
            }

            // Rotate earth
            const m = mouseRef.current;
            earthGroup.rotation.y += 0.002;
            earthGroup.rotation.x = m.rotY;
            earthGroup.rotation.y += m.rotX * 0;

            // Update satellite positions
            const jsDate = new Date();
            const gmst = sat.gstime(jsDate);
            const newPositions = [];

            dots.forEach(({ dot, orbitLine, satData }) => {
                if (!satData.satrec) { dot.visible = false; return; }
                try {
                    const pv = sat.propagate(satData.satrec, jsDate);
                    if (!pv.position) { dot.visible = false; return; }

                    // ECI → ECEF → normalized globe position
                    const ecf = sat.eciToEcf(pv.position, gmst);
                    const R = Math.sqrt(ecf.x ** 2 + ecf.y ** 2 + ecf.z ** 2);
                    const earthRadius = 6371; // km
                    const scale = 1.52; // globe radius in scene units
                    const altRatio = R / earthRadius;
                    const r = scale * altRatio * 0.35 + scale;

                    // Normalize to globe surface + altitude
                    const nx = ecf.x / R * r;
                    const ny = ecf.z / R * r; // swap y/z for Three.js coords
                    const nz = -ecf.y / R * r;

                    dot.position.set(nx, ny, nz);
                    // Apply earth rotation
                    dot.position.applyEuler(earthGroup.rotation);
                    dot.visible = true;

                    // Velocity
                    const vel = pv.velocity ? Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2) : 0;

                    // Lat/Lon
                    const geodetic = sat.eciToGeodetic(pv.position, gmst);
                    const latDeg = sat.degreesLat(geodetic.latitude);
                    const lonDeg = sat.degreesLong(geodetic.longitude);
                    const altKm = geodetic.height;

                    newPositions.push({
                        name: satData.name,
                        cat: satData.cat,
                        color: satData.color,
                        orbit: satData.orbit,
                        lat: latDeg,
                        lon: lonDeg,
                        alt: altKm,
                        vel: vel,
                        visible: true,
                    });

                    // Update orbit path (every 30 frames)
                    if (frameCount === 1) {
                        const orbitPts = [];
                        const period = satData.orbit === 'GEO' ? 86400000 : satData.orbit === 'MEO' ? 43200000 : 5400000;
                        for (let i = 0; i <= 120; i++) {
                            const t2 = new Date(jsDate.getTime() + (i / 120) * period);
                            const gmst2 = sat.gstime(t2);
                            try {
                                const pv2 = sat.propagate(satData.satrec, t2);
                                if (pv2.position) {
                                    const ecf2 = sat.eciToEcf(pv2.position, gmst2);
                                    const R2 = Math.sqrt(ecf2.x ** 2 + ecf2.y ** 2 + ecf2.z ** 2);
                                    const r2 = scale * (R2 / earthRadius) * 0.35 + scale;
                                    orbitPts.push(new THREE.Vector3(
                                        ecf2.x / R2 * r2,
                                        ecf2.z / R2 * r2,
                                        -ecf2.y / R2 * r2
                                    ));
                                }
                            } catch { }
                        }
                        if (orbitPts.length > 2) {
                            orbitLine.geometry.dispose();
                            orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(orbitPts);
                        }
                    }
                } catch {
                    dot.visible = false;
                }
            });

            if (newPositions.length > 0) {
                setSatPositions(newPositions);
            }

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const onResize = () => {
            const w2 = canvas.clientWidth;
            const h2 = canvas.clientHeight;
            renderer.setSize(w2, h2);
            camera.aspect = w2 / h2;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            renderer.dispose();
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        };
    }, [open]);

    // ── Mouse interaction ──
    const onPointerDown = useCallback((e) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!mouseRef.current.isDown) return;
        const dx = (e.clientX - mouseRef.current.x) * 0.005;
        const dy = (e.clientY - mouseRef.current.y) * 0.005;
        if (earthRef.current) {
            earthRef.current.rotation.y += dx;
            earthRef.current.rotation.x = Math.max(-1.2, Math.min(1.2, earthRef.current.rotation.x + dy));
        }
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
    }, []);

    const onPointerUp = useCallback(() => { mouseRef.current.isDown = false; }, []);

    const onWheel = useCallback((e) => {
        if (cameraRef.current) {
            cameraRef.current.position.z = Math.max(2.5, Math.min(10, cameraRef.current.position.z + e.deltaY * 0.005));
        }
    }, []);

    if (!open) return null;

    // ═══════════════════════
    // HUD Data Computation
    // ═══════════════════════
    const categories = {};
    satPositions.forEach((s) => {
        if (!categories[s.cat]) categories[s.cat] = { active: 0, total: 0, color: s.color };
        categories[s.cat].total++;
        if (s.visible) categories[s.cat].active++;
    });

    const orbitCounts = {};
    ORBIT_TYPES.forEach((t) => { orbitCounts[t] = 0; });
    SATELLITES.forEach((s) => { if (orbitCounts[s.orbit] !== undefined) orbitCounts[s.orbit]++; });
    const maxOrbit = Math.max(...Object.values(orbitCounts), 1);

    const sel = selectedSat ? satPositions.find((s) => s.name === selectedSat) : null;
    const utcNow = new Date().toISOString().replace('T', '  ').slice(0, 21);

    return (
        <div className="fixed inset-0 z-[120]" style={{ background: '#000' }}>
            {/* Three.js Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onWheel={onWheel}
                style={{ cursor: 'grab' }}
            />

            {/* ══ SCANLINE OVERLAY ══ */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,200,0.015) 2px, rgba(0,200,200,0.015) 4px)',
            }} />

            {/* ══ TOP BAR ══ */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 pointer-events-none"
                style={{ borderBottom: '1px solid rgba(0,200,200,0.15)', background: 'rgba(0,0,0,0.5)' }}
            >
                <div className="flex items-center gap-3">
                    <span style={{ color: '#00cccc', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', letterSpacing: '3px' }}>
                        ORBITAL TRACKING SYSTEM
                    </span>
                    <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>v2.1</span>
                    <span className="ml-2 w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff88' }} />
                    <span style={{ color: '#00ff8888', fontFamily: 'monospace', fontSize: '9px' }}>ONLINE</span>
                </div>
                <div className="flex items-center gap-4">
                    <span style={{ color: '#00cccc88', fontFamily: 'monospace', fontSize: '10px' }}>{utcNow} UTC</span>
                    <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '10px' }}>TRACKING: {satPositions.length}</span>
                    <button
                        onClick={onClose}
                        className="pointer-events-auto w-7 h-7 rounded flex items-center justify-center transition-all hover:bg-white/10"
                        style={{ border: '1px solid rgba(0,200,200,0.3)', color: '#00cccc' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* ══ LEFT PANEL — Constellation Status ══ */}
            <div className="absolute top-12 left-3 w-52 pointer-events-auto"
                style={{
                    background: 'rgba(0,8,16,0.85)',
                    border: '1px solid rgba(0,200,200,0.12)',
                    borderRadius: '4px',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ color: '#00cccc88', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px' }}>
                        // CONSTELLATION STATUS
                    </span>
                </div>
                <div className="p-2 space-y-1">
                    {Object.entries(categories).map(([cat, data]) => (
                        <div
                            key={cat}
                            className="flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all hover:bg-white/5"
                            onClick={() => setSelectedSat(satPositions.find((s) => s.cat === cat)?.name || null)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: CAT_COLORS[cat] || '#666' }} />
                                <span style={{ color: '#99aabb', fontFamily: 'monospace', fontSize: '10px' }}>
                                    {cat}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span style={{ color: CAT_COLORS[cat] || '#666', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>
                                    {data.active}
                                </span>
                                <span style={{ color: '#445566', fontFamily: 'monospace', fontSize: '9px' }}>
                                    /{data.total}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ RIGHT PANEL — Satellite Telemetry ══ */}
            <div className="absolute top-12 right-3 w-56 pointer-events-auto"
                style={{
                    background: 'rgba(0,8,16,0.85)',
                    border: '1px solid rgba(0,200,200,0.12)',
                    borderRadius: '4px',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ color: '#00cccc88', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px' }}>
                        // SATELLITE TELEMETRY
                    </span>
                </div>
                <div className="p-3">
                    {sel ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: sel.color }} />
                                <span style={{ color: '#eee', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
                                    {sel.name}
                                </span>
                            </div>
                            {[
                                ['ALT', `${sel.alt.toFixed(1)} km`],
                                ['VEL', `${sel.vel.toFixed(2)} km/s`],
                                ['LAT', `${sel.lat.toFixed(2)}°`],
                                ['LON', `${sel.lon.toFixed(2)}°`],
                                ['ORBIT', sel.orbit],
                                ['TYPE', sel.cat],
                            ].map(([label, val]) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span style={{ color: '#00cccc66', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '1px' }}>
                                        {label}
                                    </span>
                                    <span style={{ color: '#00cccc', fontFamily: 'monospace', fontSize: '10px' }}>
                                        {val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '10px', textAlign: 'center', padding: '16px 0' }}>
                            NO TARGET SELECTED
                            <br />
                            <span style={{ fontSize: '8px', color: '#223344' }}>click a category to select</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ BOTTOM LEFT — Orbital Distribution ══ */}
            <div className="absolute bottom-10 left-3 w-52 pointer-events-none"
                style={{
                    background: 'rgba(0,8,16,0.85)',
                    border: '1px solid rgba(0,200,200,0.12)',
                    borderRadius: '4px',
                }}
            >
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ color: '#00cccc88', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '2px' }}>
                        // ORBITAL DISTRIBUTION
                    </span>
                </div>
                <div className="p-3 space-y-1.5">
                    {ORBIT_TYPES.map((type) => (
                        <div key={type} className="flex items-center gap-2">
                            <span style={{ color: '#667788', fontFamily: 'monospace', fontSize: '9px', width: '24px' }}>
                                {type}
                            </span>
                            <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'rgba(0,200,200,0.05)' }}>
                                <div
                                    className="h-full rounded-sm transition-all duration-1000"
                                    style={{
                                        width: `${(orbitCounts[type] / maxOrbit) * 100}%`,
                                        background: type === 'LEO' ? '#00cccc' : type === 'MEO' ? '#88ff44' : type === 'GEO' ? '#ffaa00' : '#ff66ff',
                                        boxShadow: `0 0 8px ${type === 'LEO' ? '#00cccc44' : type === 'MEO' ? '#88ff4444' : '#ffaa0044'}`,
                                    }}
                                />
                            </div>
                            <span style={{ color: '#00cccc88', fontFamily: 'monospace', fontSize: '9px', width: '16px', textAlign: 'right' }}>
                                {orbitCounts[type]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ BOTTOM TICKER ══ */}
            <div className="absolute bottom-0 left-0 right-0"
                style={{
                    borderTop: '1px solid rgba(0,200,200,0.1)',
                    background: 'rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    height: '24px',
                }}
            >
                <div className="flex items-center h-full"
                    style={{
                        animation: 'tickerScroll 60s linear infinite',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {SATELLITES.map((s, i) => (
                        <span key={i} className="mx-3" style={{ color: s.color + '88', fontFamily: 'monospace', fontSize: '9px' }}>
                            {s.name}
                        </span>
                    ))}
                    {SATELLITES.map((s, i) => (
                        <span key={`d-${i}`} className="mx-3" style={{ color: s.color + '88', fontFamily: 'monospace', fontSize: '9px' }}>
                            {s.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* ══ BOTTOM STATUS BAR ══ */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-8 pointer-events-none">
                <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>
                    FPS: {fps}
                </span>
                <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>
                    STATUS: TRACKING
                </span>
                <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>
                    FRAME TYPE: SGP4
                </span>
                <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>
                    DATA: CELESTRAK.ORG
                </span>
                <span style={{ color: '#00cccc55', fontFamily: 'monospace', fontSize: '9px' }}>
                    LAT: {location.lat.toFixed(1)}° LON: {location.lon.toFixed(1)}°
                </span>
            </div>

            {/* ══ CSS for ticker animation ══ */}
            <style>{`
                @keyframes tickerScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
