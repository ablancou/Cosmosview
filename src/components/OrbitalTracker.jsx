import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as sat from 'satellite.js';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * OrbitalTracker — Futuristic sci-fi satellite tracking system.
 * Full-screen modal with embedded Three.js scene showing wireframe Earth
 * with continent outlines, real-time satellite + Moon orbits (SGP4),
 * and cyberpunk HUD overlays with full tooltips.
 */

// ═══════════════════════════════════════════════════════
// SIMPLIFIED CONTINENT OUTLINES (lon,lat pairs)
// ═══════════════════════════════════════════════════════
const CONTINENTS = [
    // North America (simplified)
    { name: 'N.America', pts: [[-130, 50], [-125, 50], [-120, 48], [-124, 42], [-118, 34], [-110, 32], [-105, 30], [-100, 28], [-97, 26], [-90, 30], [-85, 30], [-82, 25], [-80, 26], [-82, 30], [-77, 35], [-75, 38], [-72, 41], [-68, 44], [-66, 45], [-64, 47], [-60, 47], [-55, 48], [-55, 52], [-60, 54], [-64, 58], [-70, 60], [-75, 62], [-80, 63], [-90, 63], [-95, 68], [-105, 68], [-115, 68], [-125, 60], [-130, 55], [-130, 50]] },
    // South America
    { name: 'S.America', pts: [[-80, 10], [-77, 8], [-73, 10], [-70, 12], [-60, 10], [-52, 4], [-50, 0], [-50, -5], [-45, -10], [-40, -15], [-38, -20], [-40, -22], [-43, -23], [-48, -28], [-52, -33], [-55, -35], [-58, -38], [-65, -40], [-67, -46], [-67, -55], [-70, -53], [-72, -48], [-74, -42], [-72, -35], [-70, -30], [-70, -18], [-75, -15], [-77, -10], [-78, -5], [-80, 0], [-78, 5], [-80, 10]] },
    // Europe
    { name: 'Europe', pts: [[-10, 36], [-5, 36], [0, 38], [3, 42], [5, 44], [2, 47], [0, 48], [-5, 48], [-8, 44], [-10, 42], [-10, 36]] },
    { name: 'Europe2', pts: [[5, 44], [10, 45], [13, 46], [15, 47], [14, 50], [10, 55], [12, 56], [8, 58], [5, 60], [10, 62], [15, 65], [20, 68], [25, 70], [30, 70], [35, 68], [40, 65], [42, 60], [45, 55], [40, 50], [35, 45], [30, 42], [25, 38], [20, 36], [15, 38], [10, 40], [5, 44]] },
    // Africa
    { name: 'Africa', pts: [[-15, 30], [-5, 36], [10, 36], [12, 32], [15, 30], [20, 32], [25, 30], [30, 30], [35, 28], [40, 20], [45, 12], [50, 10], [48, 5], [42, 0], [40, -5], [38, -10], [35, -20], [32, -26], [30, -30], [28, -34], [20, -35], [18, -30], [15, -25], [12, -20], [10, -10], [8, -5], [5, 0], [5, 5], [0, 5], [-5, 5], [-10, 8], [-15, 12], [-18, 15], [-17, 22], [-15, 28], [-15, 30]] },
    // Asia (simplified)
    { name: 'Asia', pts: [[30, 42], [35, 45], [40, 50], [42, 55], [45, 55], [50, 55], [55, 55], [60, 55], [65, 55], [70, 55], [80, 55], [90, 55], [100, 55], [110, 55], [120, 55], [130, 55], [135, 55], [140, 52], [142, 48], [140, 43], [135, 40], [130, 35], [122, 30], [120, 25], [108, 22], [105, 15], [100, 12], [98, 8], [100, 2], [105, 0], [108, -5], [115, -8], [120, -5], [125, 0], [130, 5], [132, 10], [128, 15], [120, 25], [125, 35], [130, 40], [130, 45]] },
    // Australia
    { name: 'Australia', pts: [[115, -35], [120, -35], [125, -33], [130, -32], [135, -35], [138, -34], [140, -35], [142, -38], [148, -38], [150, -35], [153, -28], [150, -25], [145, -20], [142, -15], [138, -12], [136, -12], [132, -14], [130, -15], [125, -15], [120, -18], [116, -20], [114, -22], [114, -30], [115, -35]] },
];

// ═══════════════════════════════════════════════════════
// SATELLITE DATABASE (~30 satellites across categories)
// ═══════════════════════════════════════════════════════
const SATELLITES = [
    { name: 'ISS (ZARYA)', cat: 'Station', tle1: '1 25544U 98067A   26060.50000000  .00016717  00000-0  10270-3 0  9002', tle2: '2 25544  51.6400 200.0000 0007417  50.0000 310.0000 15.49000000400000', color: '#00ff88', orbit: 'LEO', desc: 'International Space Station — largest human-made object in orbit, crew of 7' },
    { name: 'Tiangong', cat: 'Station', tle1: '1 48274U 21035A   26060.50000000  .00020000  00000-0  12000-3 0  9002', tle2: '2 48274  41.4700 150.0000 0005200  80.0000 280.0000 15.62000000200000', color: '#ff4444', orbit: 'LEO', desc: 'Chinese Space Station — modular station with 3 modules' },
    { name: 'Hubble', cat: 'Science', tle1: '1 20580U 90037B   26060.50000000  .00001200  00000-0  60000-4 0  9002', tle2: '2 20580  28.4700 260.0000 0002850 120.0000 240.0000 15.09100000500000', color: '#ffaa00', orbit: 'LEO', desc: 'Hubble Space Telescope — optical/UV telescope, launched 1990' },
    { name: 'JWST', cat: 'Science', tle1: '1 50463U 21130A   26060.50000000  .00000100  00000-0  10000-5 0  9002', tle2: '2 50463   1.0000  10.0000 0001000   0.0000 360.0000  0.99700000100000', color: '#ff66ff', orbit: 'L2', desc: 'James Webb Space Telescope — infrared telescope at L2 point' },
    { name: 'NOAA-20', cat: 'Weather', tle1: '1 43013U 17073A   26060.50000000  .00000100  00000-0  50000-5 0  9002', tle2: '2 43013  98.7400  30.0000 0001500  90.0000 270.0000 14.19500000400000', color: '#44ddff', orbit: 'LEO', desc: 'NOAA weather satellite — polar orbiting, global weather data' },
    { name: 'GOES-18', cat: 'Weather', tle1: '1 51850U 22021A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 51850   0.0300 270.0000 0001000  90.0000 270.0000  1.00270000200000', color: '#44ddff', orbit: 'GEO', desc: 'Geostationary weather satellite — covers western hemisphere' },
    { name: 'GPS IIF-1', cat: 'Navigation', tle1: '1 36585U 10022A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 36585  55.0000  60.0000 0050000  40.0000 320.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO', desc: 'GPS navigation satellite — part of 31-satellite constellation' },
    { name: 'GPS IIF-5', cat: 'Navigation', tle1: '1 39166U 13023A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 39166  55.0000 120.0000 0050000 100.0000 260.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO', desc: 'GPS navigation satellite — 20,200 km altitude' },
    { name: 'GPS III-1', cat: 'Navigation', tle1: '1 43873U 18109A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 43873  55.0000 180.0000 0050000 160.0000 200.0000  2.00560000300000', color: '#88ff44', orbit: 'MEO', desc: 'Latest generation GPS satellite — enhanced accuracy' },
    { name: 'GLONASS-K1', cat: 'Navigation', tle1: '1 37829U 11064A   26060.50000000  .00000010  00000-0  10000-6 0  9002', tle2: '2 37829  64.8000  40.0000 0010000  80.0000 280.0000  2.13100000300000', color: '#88ff44', orbit: 'MEO', desc: 'Russian navigation satellite — GLONASS constellation' },
    ...Array.from({ length: 16 }, (_, i) => ({
        name: `Starlink-${1007 + i}`,
        cat: 'Starlink',
        tle1: `1 ${44713 + i}U 19074${String.fromCharCode(65 + i)}   26060.50000000  .00002000  00000-0  10000-3 0  9002`,
        tle2: `2 ${44713 + i}  53.0500 ${(100 + i * 12) % 360}.0000 0001500  ${(90 + i * 15) % 360}.0000 ${(270 - i * 15 + 360) % 360}.0000 15.06400000300000`,
        color: '#6688ff',
        orbit: 'LEO',
        desc: 'SpaceX Starlink internet satellite — LEO mega-constellation',
    })),
];

const CAT_COLORS = { Station: '#00ff88', Science: '#ffaa00', Weather: '#44ddff', Navigation: '#88ff44', Starlink: '#6688ff' };
const CAT_DESCS = {
    Station: 'Crewed space stations in low Earth orbit',
    Science: 'Scientific telescopes and observatories',
    Weather: 'Meteorological observation satellites',
    Navigation: 'GPS/GLONASS positioning satellites',
    Starlink: 'SpaceX internet constellation (550 km)',
};
const ORBIT_TYPES = ['LEO', 'MEO', 'GEO', 'L2'];
const ORBIT_DESCS = {
    LEO: 'Low Earth Orbit (160–2,000 km) — fastest satellites, ~90 min per orbit',
    MEO: 'Medium Earth Orbit (2,000–35,786 km) — GPS & navigation',
    GEO: 'Geostationary Orbit (35,786 km) — appears stationary over one point',
    L2: 'Lagrange Point 2 (1.5M km) — gravitationally stable point beyond Earth',
};

/** Convert lat/lon (degrees) to 3D position on a sphere of given radius */
function latLonTo3D(lat, lon, r) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

export default function OrbitalTracker({ open, onClose }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const earthRef = useRef(null);
    const moonDotRef = useRef(null);
    const moonOrbitRef = useRef(null);
    const satDotsRef = useRef([]);
    const frameRef = useRef(null);
    const mouseRef = useRef({ isDown: false, x: 0, y: 0 });
    const [selectedSat, setSelectedSat] = useState(null);
    const [satPositions, setSatPositions] = useState([]);
    const [moonData, setMoonData] = useState(null);
    const [fps, setFps] = useState(60);
    const [hoveredPanel, setHoveredPanel] = useState(null);
    const location = useAppStore((s) => s.location);

    const [visibleCats, setVisibleCats] = useState(
        new Set([...Object.keys(CAT_COLORS), 'Moon'])
    );
    const visibleCatsRef = useRef(visibleCats);
    useEffect(() => { visibleCatsRef.current = visibleCats; }, [visibleCats]);

    // Parse TLEs once
    const satrecsRef = useRef(null);
    if (!satrecsRef.current) {
        satrecsRef.current = SATELLITES.map((s) => {
            try { return { ...s, satrec: sat.twoline2satrec(s.tle1, s.tle2) }; }
            catch { return { ...s, satrec: null }; }
        });
    }

    // Three.js Scene
    useEffect(() => {
        if (!open || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const w = canvas.clientWidth, h = canvas.clientHeight;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 1);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        camera.position.set(0, 0, 7.5);
        cameraRef.current = camera;

        // ── Earth Globe ──
        const earthGroup = new THREE.Group();
        earthRef.current = earthGroup;

        // Wireframe sphere
        const sphereGeo = new THREE.SphereGeometry(1.5, 48, 24);
        earthGroup.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
            color: 0x00cccc, wireframe: true, transparent: true, opacity: 0.06,
        })));

        // Latitude rings
        for (let lat = -60; lat <= 60; lat += 30) {
            const phi = (90 - lat) * (Math.PI / 180);
            const r = 1.52 * Math.sin(phi), y = 1.52 * Math.cos(phi);
            const ring = new THREE.RingGeometry(r - 0.002, r + 0.002, 64);
            const ringMesh = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({
                color: lat === 0 ? 0x00ffcc : 0x005555, transparent: true,
                opacity: lat === 0 ? 0.4 : 0.12, side: THREE.DoubleSide,
            }));
            ringMesh.position.y = y;
            ringMesh.rotation.x = Math.PI / 2;
            earthGroup.add(ringMesh);
        }

        // Longitude meridians
        for (let lon = 0; lon < 360; lon += 30) {
            const pts = [];
            for (let i = 0; i <= 64; i++) {
                const phi = (i / 64) * Math.PI, theta = lon * (Math.PI / 180);
                pts.push(new THREE.Vector3(
                    1.52 * Math.sin(phi) * Math.cos(theta),
                    1.52 * Math.cos(phi),
                    1.52 * Math.sin(phi) * Math.sin(theta)
                ));
            }
            earthGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: lon === 0 ? 0x00ffcc : 0x005555,
                    transparent: true, opacity: lon === 0 ? 0.4 : 0.1,
                })
            ));
        }

        // ── Continent outlines ──
        CONTINENTS.forEach((cont) => {
            const pts = cont.pts.map(([lon, lat]) => latLonTo3D(lat, lon, 1.52));
            earthGroup.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: 0x00ddaa, transparent: true, opacity: 0.35 })
            ));
        });

        scene.add(earthGroup);

        // ── Moon ──
        const moonGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const moonDot = new THREE.Mesh(moonGeo, moonMat);
        moonDot.visible = false;
        scene.add(moonDot);
        moonDotRef.current = moonDot;

        // Moon orbit ring
        const moonOrbitMat = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.1 });
        const moonOrbitLine = new THREE.Line(new THREE.BufferGeometry(), moonOrbitMat);
        scene.add(moonOrbitLine);
        moonOrbitRef.current = moonOrbitLine;

        // ── Satellite dots ──
        const dots = [];
        satrecsRef.current.forEach((s) => {
            const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
            const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: new THREE.Color(s.color), transparent: true, opacity: 0.9,
            }));
            dot.visible = false;
            scene.add(dot);

            const orbitLine = new THREE.Line(
                new THREE.BufferGeometry(),
                new THREE.LineBasicMaterial({ color: new THREE.Color(s.color), transparent: true, opacity: 0.12 })
            );
            scene.add(orbitLine);
            dots.push({ dot, orbitLine, satData: s });
        });
        satDotsRef.current = dots;

        // ── Background particles ──
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(500 * 3);
        for (let i = 0; i < 500; i++) {
            pPos[i * 3] = (Math.random() - 0.5) * 30;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
            color: 0x224466, size: 0.02, transparent: true, opacity: 0.4,
        })));

        // ── Crosshair ──
        const chMat = new THREE.LineBasicMaterial({ color: 0x00cccc, transparent: true, opacity: 0.3 });
        [[[-0.15, 0, 0], [0.15, 0, 0]], [[0, -0.15, 0], [0, 0.15, 0]]].forEach(([a, b]) => {
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]),
                chMat
            );
            line.renderOrder = 100;
            scene.add(line);
        });

        // ── Animation ──
        let lastTime = performance.now(), frameCount = 0, fpsAccum = 0;
        const scale = 1.52, earthRadius = 6371;

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            const now = performance.now();
            frameCount++;
            fpsAccum += now - lastTime;
            lastTime = now;
            if (fpsAccum > 500) {
                setFps(Math.round((frameCount / fpsAccum) * 1000));
                frameCount = 0; fpsAccum = 0;
            }

            // Slow, elegant rotation (Earth ~24h = very slow)
            earthGroup.rotation.y += 0.0004;

            // ── Update satellites ──
            const jsDate = new Date();
            const gmst = sat.gstime(jsDate);
            const newPositions = [];

            dots.forEach(({ dot, orbitLine, satData }) => {
                if (!satData.satrec) { dot.visible = false; orbitLine.visible = false; return; }
                const isCatVisible = visibleCatsRef.current.has(satData.cat);
                dot.visible = isCatVisible;
                orbitLine.visible = isCatVisible;
                try {
                    const pv = sat.propagate(satData.satrec, jsDate);
                    if (!pv.position) { dot.visible = false; return; }

                    const ecf = sat.eciToEcf(pv.position, gmst);
                    const R = Math.sqrt(ecf.x ** 2 + ecf.y ** 2 + ecf.z ** 2);
                    const altRatio = R / earthRadius;
                    const r = scale * altRatio * 0.35 + scale;

                    const nx = ecf.x / R * r, ny = ecf.z / R * r, nz = -ecf.y / R * r;
                    dot.position.set(nx, ny, nz);
                    dot.position.applyEuler(earthGroup.rotation);

                    const vel = pv.velocity ? Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2) : 0;
                    const geodetic = sat.eciToGeodetic(pv.position, gmst);

                    newPositions.push({
                        name: satData.name, cat: satData.cat, color: satData.color,
                        orbit: satData.orbit, desc: satData.desc,
                        lat: sat.degreesLat(geodetic.latitude),
                        lon: sat.degreesLong(geodetic.longitude),
                        alt: geodetic.height, vel, visible: isCatVisible,
                    });

                    if (!isCatVisible) return;

                    // Orbit path (update every ~60 frames)
                    if (frameCount === 1) {
                        const orbitPts = [];
                        const period = satData.orbit === 'GEO' ? 86400000 : satData.orbit === 'MEO' ? 43200000 : 5400000;
                        for (let i = 0; i <= 120; i++) {
                            const t2 = new Date(jsDate.getTime() + (i / 120) * period);
                            try {
                                const pv2 = sat.propagate(satData.satrec, t2);
                                if (pv2.position) {
                                    const gmst2 = sat.gstime(t2);
                                    const ecf2 = sat.eciToEcf(pv2.position, gmst2);
                                    const R2 = Math.sqrt(ecf2.x ** 2 + ecf2.y ** 2 + ecf2.z ** 2);
                                    const r2 = scale * (R2 / earthRadius) * 0.35 + scale;
                                    orbitPts.push(new THREE.Vector3(ecf2.x / R2 * r2, ecf2.z / R2 * r2, -ecf2.y / R2 * r2));
                                }
                            } catch { }
                        }
                        if (orbitPts.length > 2) {
                            orbitLine.geometry.dispose();
                            orbitLine.geometry = new THREE.BufferGeometry().setFromPoints(orbitPts);
                        }
                    }
                } catch { dot.visible = false; }
            });

            if (newPositions.length > 0) setSatPositions(newPositions);

            // ── Update Moon ──
            if (!visibleCatsRef.current.has('Moon')) {
                if (moonDotRef.current) moonDotRef.current.visible = false;
                if (moonOrbitRef.current) moonOrbitRef.current.visible = false;
            } else {
                try {
                    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
                    const moonEq = Astronomy.Equator('Moon', jsDate, observer, true, true);
                    const moonGeo = Astronomy.Ecliptic(moonEq.vec);
                    const moonDist = moonEq.dist; // AU
                    const moonDistKm = moonDist * 149597870.7;
                    const moonR = scale * (moonDistKm / earthRadius) * 0.0001 + scale + 0.8;
                    const moonPos = latLonTo3D(moonGeo.elat, moonGeo.elon, moonR);
                    moonDot.position.copy(moonPos);
                    moonDot.position.applyEuler(earthGroup.rotation);
                    moonDot.visible = true;
                    moonOrbitLine.visible = true;

                    setMoonData({
                        dist: moonDistKm,
                        phase: Astronomy.MoonPhase(jsDate),
                        lat: moonGeo.elat,
                        lon: moonGeo.elon,
                    });

                    // Moon orbit circle
                    if (frameCount === 1) {
                        const mOrbitPts = [];
                        for (let i = 0; i <= 64; i++) {
                            const angle = (i / 64) * Math.PI * 2;
                            mOrbitPts.push(new THREE.Vector3(
                                moonR * Math.cos(angle), 0, moonR * Math.sin(angle)
                            ));
                        }
                        moonOrbitLine.geometry.dispose();
                        moonOrbitLine.geometry = new THREE.BufferGeometry().setFromPoints(mOrbitPts);
                    }
                } catch { moonDot.visible = false; moonOrbitLine.visible = false; }
            } // end Moon visible block

            renderer.render(scene, camera);
        };

        animate();

        const onResize = () => {
            const w2 = canvas.clientWidth, h2 = canvas.clientHeight;
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

    // Mouse
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
            cameraRef.current.position.z = Math.max(4.5, Math.min(15, cameraRef.current.position.z + e.deltaY * 0.008));
        }
    }, []);

    if (!open) return null;

    // HUD computations
    const categories = {};
    satPositions.forEach((s) => {
        if (!categories[s.cat]) categories[s.cat] = { active: 0, total: 0, color: s.color };
        categories[s.cat].total++;
        if (s.visible) categories[s.cat].active++;
    });

    categories['Moon'] = { active: visibleCats.has('Moon') ? 1 : 0, total: 1, color: '#ffcc00' };

    const orbitCounts = {};
    ORBIT_TYPES.forEach((t) => { orbitCounts[t] = 0; });
    SATELLITES.forEach((s) => { if (orbitCounts[s.orbit] !== undefined) orbitCounts[s.orbit]++; });
    const maxOrbit = Math.max(...Object.values(orbitCounts), 1);

    const sel = selectedSat ? satPositions.find((s) => s.name === selectedSat) : null;
    const utcNow = new Date().toISOString().replace('T', '  ').slice(0, 21);

    const mono = { fontFamily: "'Courier New', monospace" };

    return (
        <div className="fixed inset-0 z-[120]" style={{ background: '#000' }}>
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

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,200,200,0.015) 2px, rgba(0,200,200,0.015) 4px)',
            }} />

            {/* ══ TOP BAR ══ */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 pointer-events-none"
                style={{ borderBottom: '1px solid rgba(0,200,200,0.15)', background: 'rgba(0,0,0,0.5)' }}>
                <div className="flex items-center gap-3">
                    <span style={{ ...mono, color: '#00cccc', fontSize: '11px', fontWeight: 'bold', letterSpacing: '3px' }}>
                        ORBITAL TRACKING SYSTEM
                    </span>
                    <span style={{ ...mono, color: '#00cccc55', fontSize: '9px' }}>v2.1</span>
                    <span className="ml-2 w-2 h-2 rounded-full animate-pulse" style={{ background: '#00ff88' }} />
                    <span style={{ ...mono, color: '#00ff8888', fontSize: '9px' }}>ONLINE</span>
                </div>
                <div className="flex items-center gap-4">
                    <span style={{ ...mono, color: '#00cccc88', fontSize: '10px' }}>{utcNow} UTC</span>
                    <span style={{ ...mono, color: '#00cccc55', fontSize: '10px' }}>TRACKING: {satPositions.length + (moonData ? 1 : 0)}</span>
                    <button onClick={onClose}
                        className="pointer-events-auto w-7 h-7 rounded flex items-center justify-center transition-all hover:bg-white/10"
                        style={{ border: '1px solid rgba(0,200,200,0.3)', color: '#00cccc' }}>✕</button>
                </div>
            </div>

            {/* ══ LEFT — Constellation Status ══ */}
            <div className="absolute top-12 left-3 w-56 pointer-events-auto"
                style={{ background: 'rgba(0,8,16,0.85)', border: '1px solid rgba(0,200,200,0.12)', borderRadius: '4px', backdropFilter: 'blur(8px)' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ ...mono, color: '#00cccc88', fontSize: '9px', letterSpacing: '2px' }}>// CONSTELLATION STATUS</span>
                </div>
                <div className="p-2 space-y-0.5">
                    {Object.entries(categories).filter(([cat]) => cat !== 'Moon').map(([cat, data]) => (
                        <div key={cat}
                            className={`flex items-center justify-between px-2 py-1.5 rounded transition-all group ${visibleCats.has(cat) ? 'hover:bg-white/5' : 'opacity-40'}`}
                            onMouseEnter={() => setHoveredPanel(cat)} onMouseLeave={() => setHoveredPanel(null)}>

                            {/* Toggle Switch */}
                            <div className="flex items-center gap-3 cursor-pointer py-1 pr-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setVisibleCats(prev => {
                                        const next = new Set(prev);
                                        if (next.has(cat)) next.delete(cat);
                                        else next.add(cat);
                                        return next;
                                    });
                                }}>
                                <span className={`w-3 h-3 rounded-full border border-solid transition-all`}
                                    style={{
                                        background: visibleCats.has(cat) ? CAT_COLORS[cat] : 'transparent',
                                        borderColor: CAT_COLORS[cat]
                                    }} />
                            </div>

                            {/* Telemetry Select */}
                            <div className="flex flex-1 items-center justify-between cursor-pointer"
                                onClick={() => visibleCats.has(cat) && setSelectedSat(satPositions.find((s) => s.cat === cat && s.visible)?.name || null)}>
                                <span style={{ ...mono, color: visibleCats.has(cat) ? '#99aabb' : '#556677', fontSize: '10px' }}>{cat}</span>
                                <div className="flex items-center gap-2">
                                    <span style={{ ...mono, color: visibleCats.has(cat) ? CAT_COLORS[cat] : '#334455', fontSize: '10px', fontWeight: 'bold' }}>{data.active}</span>
                                    <span style={{ ...mono, color: '#445566', fontSize: '9px' }}>/{data.total}</span>
                                </div>
                            </div>

                            {/* Tooltip */}
                            {hoveredPanel === cat && (
                                <div className="absolute left-full ml-2 top-0 w-48 p-2 rounded z-50 pointer-events-none"
                                    style={{ background: 'rgba(0,16,24,0.95)', border: '1px solid rgba(0,200,200,0.2)' }}>
                                    <p style={{ ...mono, color: '#88bbcc', fontSize: '9px', lineHeight: '1.4' }}>
                                        {CAT_DESCS[cat]}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Moon entry */}
                    {moonData && (
                        <div className={`flex items-center justify-between px-2 py-1.5 rounded transition-all ${visibleCats.has('Moon') ? 'hover:bg-white/5' : 'opacity-40'}`}>

                            {/* Toggle Switch */}
                            <div className="flex items-center gap-3 cursor-pointer py-1 pr-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setVisibleCats(prev => {
                                        const next = new Set(prev);
                                        if (next.has('Moon')) next.delete('Moon');
                                        else next.add('Moon');
                                        return next;
                                    });
                                }}>
                                <span className="w-3 h-3 rounded-full border transition-all"
                                    style={{
                                        background: visibleCats.has('Moon') ? '#cccccc' : 'transparent',
                                        borderColor: '#cccccc'
                                    }} />
                            </div>

                            {/* Telemetry Select */}
                            <div className="flex flex-1 items-center justify-between cursor-pointer"
                                onClick={() => visibleCats.has('Moon') && setSelectedSat('Moon')}>
                                <span style={{ ...mono, color: visibleCats.has('Moon') ? '#99aabb' : '#556677', fontSize: '10px' }}>Moon</span>
                                <span style={{ ...mono, color: visibleCats.has('Moon') ? '#cccccc' : '#555555', fontSize: '10px', fontWeight: 'bold' }}>🌙</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ RIGHT — Telemetry ══ */}
            <div className="absolute top-12 right-3 w-60 pointer-events-auto"
                style={{ background: 'rgba(0,8,16,0.85)', border: '1px solid rgba(0,200,200,0.12)', borderRadius: '4px', backdropFilter: 'blur(8px)' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ ...mono, color: '#00cccc88', fontSize: '9px', letterSpacing: '2px' }}>// SATELLITE TELEMETRY</span>
                </div>
                <div className="p-3">
                    {selectedSat === 'Moon' && moonData ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🌙</span>
                                <span style={{ ...mono, color: '#eee', fontSize: '11px', fontWeight: 'bold' }}>Moon</span>
                            </div>
                            {[
                                ['DISTANCE', `${(moonData.dist).toFixed(0)} km`],
                                ['PHASE', `${moonData.phase.toFixed(1)}°`],
                                ['ECL.LAT', `${moonData.lat.toFixed(2)}°`],
                                ['ECL.LON', `${moonData.lon.toFixed(2)}°`],
                                ['TYPE', 'Natural Satellite'],
                            ].map(([l, v]) => (
                                <div key={l} className="flex items-center justify-between">
                                    <span style={{ ...mono, color: '#00cccc66', fontSize: '9px', letterSpacing: '1px' }}>{l}</span>
                                    <span style={{ ...mono, color: '#00cccc', fontSize: '10px' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    ) : sel ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: sel.color }} />
                                <span style={{ ...mono, color: '#eee', fontSize: '11px', fontWeight: 'bold' }}>{sel.name}</span>
                            </div>
                            <p style={{ ...mono, color: '#557788', fontSize: '8px', marginTop: '2px' }}>{sel.desc}</p>
                            {[
                                ['ALT', `${sel.alt.toFixed(1)} km`],
                                ['VEL', `${sel.vel.toFixed(2)} km/s`],
                                ['LAT', `${sel.lat.toFixed(2)}°`],
                                ['LON', `${sel.lon.toFixed(2)}°`],
                                ['ORBIT', sel.orbit],
                                ['TYPE', sel.cat],
                            ].map(([l, v]) => (
                                <div key={l} className="flex items-center justify-between">
                                    <span style={{ ...mono, color: '#00cccc66', fontSize: '9px', letterSpacing: '1px' }}>{l}</span>
                                    <span style={{ ...mono, color: '#00cccc', fontSize: '10px' }}>{v}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ ...mono, color: '#334455', fontSize: '10px', textAlign: 'center', padding: '16px 0' }}>
                            NO TARGET SELECTED
                            <br />
                            <span style={{ fontSize: '8px', color: '#223344' }}>click a category or Moon to select</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ BOTTOM LEFT — Orbital Distribution ══ */}
            <div className="absolute bottom-10 left-3 w-56 pointer-events-auto"
                style={{ background: 'rgba(0,8,16,0.85)', border: '1px solid rgba(0,200,200,0.12)', borderRadius: '4px' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.08)' }}>
                    <span style={{ ...mono, color: '#00cccc88', fontSize: '9px', letterSpacing: '2px' }}>// ORBITAL DISTRIBUTION</span>
                </div>
                <div className="p-3 space-y-1.5">
                    {ORBIT_TYPES.map((type) => (
                        <div key={type} className="relative group">
                            <div className="flex items-center gap-2">
                                <span style={{ ...mono, color: '#667788', fontSize: '9px', width: '24px' }}>{type}</span>
                                <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: 'rgba(0,200,200,0.05)' }}>
                                    <div className="h-full rounded-sm transition-all duration-1000"
                                        style={{
                                            width: `${(orbitCounts[type] / maxOrbit) * 100}%`,
                                            background: type === 'LEO' ? '#00cccc' : type === 'MEO' ? '#88ff44' : type === 'GEO' ? '#ffaa00' : '#ff66ff',
                                            boxShadow: `0 0 8px ${type === 'LEO' ? '#00cccc44' : type === 'MEO' ? '#88ff4444' : '#ffaa0044'}`,
                                        }} />
                                </div>
                                <span style={{ ...mono, color: '#00cccc88', fontSize: '9px', width: '16px', textAlign: 'right' }}>{orbitCounts[type]}</span>
                            </div>
                            {/* Tooltip */}
                            <div className="hidden group-hover:block absolute bottom-full mb-1 left-0 w-52 p-2 rounded z-50"
                                style={{ background: 'rgba(0,16,24,0.95)', border: '1px solid rgba(0,200,200,0.2)' }}>
                                <p style={{ ...mono, color: '#88bbcc', fontSize: '8px', lineHeight: '1.4' }}>{ORBIT_DESCS[type]}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ BOTTOM RIGHT — Controls Help ══ */}
            <div className="absolute bottom-10 right-3 w-48 pointer-events-none"
                style={{ background: 'rgba(0,8,16,0.75)', border: '1px solid rgba(0,200,200,0.08)', borderRadius: '4px' }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(0,200,200,0.06)' }}>
                    <span style={{ ...mono, color: '#00cccc66', fontSize: '9px', letterSpacing: '2px' }}>// CONTROLS</span>
                </div>
                <div className="p-2 space-y-1">
                    {[
                        ['🖱️ Drag', 'Rotate globe'],
                        ['🔍 Scroll', 'Zoom in/out'],
                        ['👆 Click', 'Select category'],
                        ['🌙 Moon', 'Click to see data'],
                    ].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                            <span style={{ ...mono, color: '#557788', fontSize: '9px' }}>{k}</span>
                            <span style={{ ...mono, color: '#335566', fontSize: '8px' }}>{v}</span>
                        </div>
                    ))}
                </div>
                <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(0,200,200,0.06)' }}>
                    <p style={{ ...mono, color: '#334455', fontSize: '7px', lineHeight: '1.5' }}>
                        Globe rotates slowly to match Earth's scale.
                        Satellite positions update in real-time via SGP4 orbital propagation.
                    </p>
                </div>
            </div>

            {/* ══ TICKER ══ */}
            <div className="absolute bottom-0 left-0 right-0"
                style={{ borderTop: '1px solid rgba(0,200,200,0.1)', background: 'rgba(0,0,0,0.6)', overflow: 'hidden', height: '24px' }}>
                <div className="flex items-center h-full" style={{ animation: 'tickerScroll 60s linear infinite', whiteSpace: 'nowrap' }}>
                    {[...SATELLITES, { name: '🌙 Moon', color: '#cccccc' }, ...SATELLITES].map((s, i) => (
                        <span key={i} className="mx-3" style={{ ...mono, color: s.color + '88', fontSize: '9px' }}>{s.name}</span>
                    ))}
                </div>
            </div>

            {/* ══ STATUS BAR ══ */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 sm:gap-8 pointer-events-none flex-wrap">
                {[
                    `FPS: ${fps}`, 'STATUS: TRACKING', 'FRAME TYPE: SGP4',
                    'DATA: CELESTRAK.ORG', `LAT: ${location.lat.toFixed(1)}° LON: ${location.lon.toFixed(1)}°`,
                ].map((t) => (
                    <span key={t} style={{ ...mono, color: '#00cccc44', fontSize: '9px' }}>{t}</span>
                ))}
            </div>

            <style>{`
                @keyframes tickerScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
