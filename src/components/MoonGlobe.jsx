import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * MoonGlobe — 3D Lunar Observatory with high-detail procedural texture,
 * interactive landing site markers (hover tooltips on 3D globe + click-to-expand sidebar),
 * real-time phase lighting, and educational mission info.
 */

const LANDING_SITES = [
    {
        name: 'Apollo 11', lat: 0.67, lon: 23.47, type: 'apollo', year: 1969,
        crew: 'Armstrong, Aldrin, Collins',
        desc: 'First crewed Moon landing. Neil Armstrong and Buzz Aldrin spent 21.5 hours on the surface at Mare Tranquillitatis.',
        achievement: 'First humans on the Moon',
        region: 'Mare Tranquillitatis',
        duration: '21h 36m on surface',
    },
    {
        name: 'Apollo 12', lat: -3.01, lon: -23.42, type: 'apollo', year: 1969,
        crew: 'Conrad, Bean, Gordon',
        desc: 'Precision landing near Surveyor 3 probe in Oceanus Procellarum. Retrieved parts of the probe for Earth analysis.',
        achievement: 'First precision landing',
        region: 'Oceanus Procellarum',
        duration: '31h 31m on surface',
    },
    {
        name: 'Apollo 14', lat: -3.65, lon: -17.47, type: 'apollo', year: 1971,
        crew: 'Shepard, Mitchell, Roosa',
        desc: 'Alan Shepard famously hit two golf balls on the Moon. The crew explored Fra Mauro, the original target of Apollo 13.',
        achievement: 'Longest EVA distance on foot',
        region: 'Fra Mauro',
        duration: '33h 31m on surface',
    },
    {
        name: 'Apollo 15', lat: 26.13, lon: 3.63, type: 'apollo', year: 1971,
        crew: 'Scott, Irwin, Worden',
        desc: 'First mission to use the Lunar Roving Vehicle. Explored Hadley Rille, a massive canyon-like channel near the Apennine Mountains.',
        achievement: 'First lunar rover',
        region: 'Hadley–Apennine',
        duration: '66h 55m on surface',
    },
    {
        name: 'Apollo 16', lat: -8.97, lon: 15.50, type: 'apollo', year: 1972,
        crew: 'Young, Duke, Mattingly',
        desc: 'First landing in the lunar highlands. Collected 95.8 kg of samples. John Young drove the rover at a record speed of 17.1 km/h.',
        achievement: 'First highlands exploration',
        region: 'Descartes Highlands',
        duration: '71h 02m on surface',
    },
    {
        name: 'Apollo 17', lat: 20.19, lon: 30.77, type: 'apollo', year: 1972,
        crew: 'Cernan, Schmitt, Evans',
        desc: 'Last crewed Moon mission. Harrison Schmitt was the only scientist (geologist) to walk on the Moon. Longest surface stay of the program.',
        achievement: 'Last humans on the Moon (so far)',
        region: 'Taurus–Littrow',
        duration: '74h 59m on surface',
    },
    {
        name: 'Luna 2', lat: 29.1, lon: 0.0, type: 'luna', year: 1959,
        crew: 'Uncrewed — Soviet Union',
        desc: 'First human-made object to reach the surface of the Moon. Impact mission confirmed the Moon has no significant magnetic field.',
        achievement: 'First impact on another world',
        region: 'Palus Putredinis',
        duration: 'Impact mission',
    },
    {
        name: 'Luna 9', lat: -7.13, lon: -64.37, type: 'luna', year: 1966,
        crew: 'Uncrewed — Soviet Union',
        desc: 'First spacecraft to achieve a soft landing on the Moon and transmit photos from the surface, proving the surface could support a lander.',
        achievement: 'First soft landing on the Moon',
        region: 'Oceanus Procellarum',
        duration: '3 days of transmission',
    },
    {
        name: 'Luna 17', lat: 38.28, lon: -35.0, type: 'luna', year: 1970,
        crew: 'Uncrewed — Soviet Union',
        desc: 'Delivered Lunokhod 1, the first remote-controlled rover on another world. It operated for 11 months and traveled 10.5 km.',
        achievement: 'First lunar rover (Lunokhod 1)',
        region: 'Mare Imbrium',
        duration: '11 months operational',
    },
    {
        name: 'Luna 21', lat: 25.85, lon: 30.86, type: 'luna', year: 1973,
        crew: 'Uncrewed — Soviet Union',
        desc: 'Delivered Lunokhod 2, which traveled 42 km — a record for off-Earth driving that stood for over 40 years.',
        achievement: 'Longest rover drive record',
        region: 'Le Monnier crater',
        duration: '4 months operational',
    },
    {
        name: "Chang'e 3", lat: 44.12, lon: -19.51, type: 'change', year: 2013,
        crew: 'Uncrewed — CNSA (China)',
        desc: 'First soft landing since Luna 24 in 1976 — a gap of 37 years. Deployed Yutu rover which operated for 31 months.',
        achievement: 'First Chinese lunar landing',
        region: 'Mare Imbrium (Sinus Iridum)',
        duration: '31 months (Yutu rover)',
    },
    {
        name: "Chang'e 4", lat: -45.46, lon: 177.6, type: 'change', year: 2019,
        crew: 'Uncrewed — CNSA (China)',
        desc: 'First-ever landing on the far side of the Moon in Von Kármán crater. Used the Queqiao relay satellite for communication.',
        achievement: 'First far side landing',
        region: 'Von Kármán crater (far side)',
        duration: 'Still operational (Yutu-2)',
    },
    {
        name: "Chang'e 5", lat: 43.06, lon: -51.92, type: 'change', year: 2020,
        crew: 'Uncrewed — CNSA (China)',
        desc: 'First lunar sample return since 1976. Collected 1.73 kg of material from Mons Rümker, dating some samples at ~2 billion years old.',
        achievement: 'First sample return in 44 years',
        region: 'Mons Rümker (Oceanus Procellarum)',
        duration: 'Sample return mission',
    },
];

const TYPE_COLORS = {
    apollo: 0x22dd77,
    luna: 0xffaa33,
    change: 0x4499ff,
};

const TYPE_HEX = {
    apollo: '#22dd77',
    luna: '#ffaa33',
    change: '#4499ff',
};

/* ═══ High-Detail Procedural Moon Texture ═══ */
function createMoonTexture(size = 2048) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Seed-based pseudo-random
    const seed = (x, y) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };
    const seed2 = (x, y) => {
        const n = Math.sin(x * 269.5 + y * 183.3) * 21345.6789;
        return n - Math.floor(n);
    };

    // Value noise with smooth interpolation
    const noise = (px, py, freq, seedFn = seed) => {
        const x = px * freq, y = py * freq;
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = seedFn(ix, iy), b = seedFn(ix + 1, iy);
        const c = seedFn(ix, iy + 1), d = seedFn(ix + 1, iy + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };

    // Multi-octave fractal brownian motion
    const fbm = (px, py, octaves = 6, seedFn = seed) => {
        let val = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            val += noise(px, py, freq * 4, seedFn) * amp;
            amp *= 0.5;
            freq *= 2.1;
        }
        return val;
    };

    // Define approximate maria regions (dark lowlands)
    // These are circular blobs roughly matching real Moon maria
    const maria = [
        { cx: 0.55, cy: 0.38, r: 0.12, depth: 0.85 }, // Mare Tranquillitatis
        { cx: 0.50, cy: 0.30, r: 0.10, depth: 0.80 }, // Mare Serenitatis
        { cx: 0.40, cy: 0.35, r: 0.14, depth: 0.78 }, // Mare Imbrium
        { cx: 0.35, cy: 0.50, r: 0.18, depth: 0.72 }, // Oceanus Procellarum
        { cx: 0.55, cy: 0.48, r: 0.08, depth: 0.75 }, // Mare Nectaris
        { cx: 0.60, cy: 0.35, r: 0.07, depth: 0.82 }, // Mare Crisium
        { cx: 0.47, cy: 0.42, r: 0.06, depth: 0.80 }, // Mare Vaporum
        { cx: 0.48, cy: 0.55, r: 0.09, depth: 0.76 }, // Mare Nubium
        { cx: 0.42, cy: 0.28, r: 0.06, depth: 0.78 }, // Mare Frigoris (part)
        { cx: 0.55, cy: 0.43, r: 0.05, depth: 0.80 }, // Mare Fecunditatis edge
    ];

    const getMareInfluence = (u, v) => {
        let maxInfluence = 0;
        for (const m of maria) {
            const dx = u - m.cx, dy = v - m.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < m.r) {
                const t = 1 - dist / m.r;
                const smooth = t * t * (3 - 2 * t); // smoothstep
                maxInfluence = Math.max(maxInfluence, smooth * m.depth);
            }
        }
        return maxInfluence;
    };

    const imageData = ctx.createImageData(size, size);
    const d = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size, v = y / size;
            const idx = (y * size + x) * 4;

            // Mare influence at this pixel
            const mareInf = getMareInfluence(u, v);

            // Highland base (bright, rough terrain)
            const highlandBase = 0.60 + fbm(u + 0.5, v + 0.3, 5) * 0.28;

            // Mare base (dark, smoother)
            const mareBase = 0.22 + fbm(u + 1.7, v + 2.1, 3) * 0.15;

            // Blend between highland and mare
            let bright = highlandBase * (1 - mareInf) + mareBase * mareInf;

            // Large-scale terrain variation
            bright += (fbm(u + 3.3, v + 0.7, 4, seed2) - 0.5) * 0.08;

            // Crater-like structures at multiple scales
            const craterLarge = fbm(u + 2.7, v + 1.3, 5);
            const craterEdgeL = Math.abs(craterLarge - 0.48);
            if (craterEdgeL < 0.03) bright += 0.14; // rim bright highlight
            if (craterEdgeL > 0.12 && craterEdgeL < 0.17) bright -= 0.07; // interior shadow

            const craterMed = fbm(u * 1.5 + 5.1, v * 1.5 + 3.7, 5);
            const craterEdgeM = Math.abs(craterMed - 0.50);
            if (craterEdgeM < 0.025) bright += 0.10;
            if (craterEdgeM > 0.10 && craterEdgeM < 0.14) bright -= 0.05;

            // Fine grain surface texture
            bright += (noise(u, v, 100) - 0.5) * 0.06;
            bright += (noise(u, v, 200) - 0.5) * 0.03;
            bright += (noise(u, v, 400) - 0.5) * 0.015;

            // Subtle warm/cool color variation
            const warmShift = fbm(u + 7.1, v + 4.3, 3) * 0.04;
            const r = Math.max(0, Math.min(255, (bright + warmShift * 0.5) * 255));
            const g = Math.max(0, Math.min(255, bright * 252));
            const b = Math.max(0, Math.min(255, (bright - warmShift * 0.3) * 248));

            d[idx] = r;
            d[idx + 1] = g;
            d[idx + 2] = b;
            d[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Overlay large craters with proper depth shading
    const craterList = [];
    for (let i = 0; i < 90; i++) {
        craterList.push({
            x: Math.random() * size,
            y: Math.random() * size,
            r: 3 + Math.pow(Math.random(), 2.5) * 45, // few large, many small
        });
    }

    // Crater shadows (dark interior)
    ctx.globalCompositeOperation = 'multiply';
    for (const c of craterList) {
        const grad = ctx.createRadialGradient(
            c.x - c.r * 0.15, c.y - c.r * 0.15, c.r * 0.1,
            c.x, c.y, c.r
        );
        grad.addColorStop(0, `rgba(60,58,54,${0.25 + Math.random() * 0.35})`);
        grad.addColorStop(0.6, `rgba(120,118,114,${0.1 + Math.random() * 0.15})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Crater rim highlights (bright ring offset)
    ctx.globalCompositeOperation = 'screen';
    for (const c of craterList) {
        const rimOff = c.r * 0.2;
        ctx.strokeStyle = `rgba(210,208,200,${0.04 + Math.random() * 0.08})`;
        ctx.lineWidth = Math.max(0.5, c.r * 0.08);
        ctx.beginPath();
        ctx.arc(c.x + rimOff * 0.3, c.y + rimOff * 0.3, c.r * 0.95, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Ray systems from a few major craters (bright streaks radiating out)
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const numRays = 6 + Math.floor(Math.random() * 8);
        for (let r = 0; r < numRays; r++) {
            const angle = (r / numRays) * Math.PI * 2 + Math.random() * 0.3;
            const length = 20 + Math.random() * 60;
            const grad = ctx.createLinearGradient(
                cx, cy,
                cx + Math.cos(angle) * length,
                cy + Math.sin(angle) * length
            );
            grad.addColorStop(0, `rgba(220,218,210,${0.03 + Math.random() * 0.04})`);
            grad.addColorStop(1, 'rgba(220,218,210,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(angle) * length,
                cy + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

/* ═══ Normal map from texture for better surface depth ═══ */
function createNormalMap(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const seed = (x, y) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };
    const noise = (px, py, freq) => {
        const x = px * freq, y = py * freq;
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = seed(ix, iy), b = seed(ix + 1, iy);
        const c = seed(ix, iy + 1), d = seed(ix + 1, iy + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    const fbm = (px, py, octaves = 5) => {
        let val = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            val += noise(px, py, freq * 6) * amp;
            amp *= 0.5;
            freq *= 2;
        }
        return val;
    };

    const imageData = ctx.createImageData(size, size);
    const d = imageData.data;
    const step = 1 / size;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size, v = y / size;
            const idx = (y * size + x) * 4;
            const hL = fbm(u - step, v);
            const hR = fbm(u + step, v);
            const hU = fbm(u, v - step);
            const hD = fbm(u, v + step);
            const nx = (hL - hR) * 3;
            const ny = (hU - hD) * 3;
            d[idx] = Math.max(0, Math.min(255, (nx * 0.5 + 0.5) * 255));
            d[idx + 1] = Math.max(0, Math.min(255, (ny * 0.5 + 0.5) * 255));
            d[idx + 2] = 200; // z component
            d[idx + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

/* ═══ Phase name helper ═══ */
function getPhaseName(degrees) {
    if (degrees < 22.5) return 'New Moon';
    if (degrees < 67.5) return 'Waxing Crescent';
    if (degrees < 112.5) return 'First Quarter';
    if (degrees < 157.5) return 'Waxing Gibbous';
    if (degrees < 202.5) return 'Full Moon';
    if (degrees < 247.5) return 'Waning Gibbous';
    if (degrees < 292.5) return 'Last Quarter';
    if (degrees < 337.5) return 'Waning Crescent';
    return 'New Moon';
}

/* ═══ Component ═══ */
export default function MoonGlobe({ open, onClose }) {
    const canvasContainerRef = useRef(null);
    const threeRef = useRef(null);
    const [showSites, setShowSites] = useState(true);
    const [selectedSite, setSelectedSite] = useState(null);
    const [hoveredSite, setHoveredSite] = useState(null);
    const [tooltipPos, setTooltipPos] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [moonData, setMoonData] = useState({
        phaseDeg: 0,
        phaseName: 'New Moon',
        illumination: 0,
        distanceKm: 384400,
        libLat: 0,
        libLon: 0,
    });

    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);

    /* ─── Astronomy calculations ─── */
    const computeMoonData = useCallback(() => {
        try {
            const now = time.current;
            const phaseDeg = Astronomy.MoonPhase(now);

            let illumination;
            try {
                const illum = Astronomy.Illumination('Moon', now);
                illumination = illum.phase_fraction !== undefined
                    ? illum.phase_fraction * 100
                    : (1 - Math.cos(phaseDeg * Math.PI / 180)) / 2 * 100;
            } catch {
                illumination = (1 - Math.cos(phaseDeg * Math.PI / 180)) / 2 * 100;
            }

            const eqPos = Astronomy.GeoMoon(now);
            const distAU = Math.sqrt(eqPos.x ** 2 + eqPos.y ** 2 + eqPos.z ** 2);
            const distanceKm = Math.round(distAU * 149597870.7);

            const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
            const libLat = 6.7 * Math.sin((dayOfYear / 27.3) * 2 * Math.PI);
            const libLon = 7.9 * Math.sin((dayOfYear / 27.3 - 0.25) * 2 * Math.PI);

            setMoonData({
                phaseDeg,
                phaseName: getPhaseName(phaseDeg),
                illumination,
                distanceKm: distanceKm > 300000 && distanceKm < 500000 ? distanceKm : 384400,
                libLat,
                libLon,
            });
            return phaseDeg;
        } catch (e) {
            console.warn('Moon calc error:', e);
            setMoonData(prev => ({ ...prev, phaseName: 'First Quarter', illumination: 50 }));
            return 90;
        }
    }, [time, location]);

    useEffect(() => {
        if (!open) return;
        computeMoonData();
        const iv = setInterval(computeMoonData, 30000);
        return () => clearInterval(iv);
    }, [open, computeMoonData]);

    /* ─── Three.js scene ─── */
    useEffect(() => {
        if (!open || !canvasContainerRef.current) return;

        const container = canvasContainerRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;
        if (W === 0 || H === 0) return;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x060610, 1);
        container.appendChild(renderer.domElement);

        // Scene & camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
        camera.position.set(0, 0.5, 5.5);
        camera.lookAt(0, 0, 0);

        // Stars
        const starCount = 4000;
        const starPos = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);
            const r = 60 + Math.random() * 40;
            starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
            starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
            starPos[i * 3 + 2] = r * Math.cos(p);
            starSizes[i] = 0.04 + Math.random() * 0.12;
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({
            color: 0xffffff, size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.6,
        })));

        // Moon textures — high detail
        const moonTexture = createMoonTexture(2048);
        const normalMap = createNormalMap(1024);

        // Moon sphere
        const moonGeom = new THREE.SphereGeometry(2, 128, 128);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTexture,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(0.6, 0.6),
            roughness: 0.92,
            metalness: 0.0,
            bumpMap: moonTexture,
            bumpScale: 0.025,
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.rotation.x = THREE.MathUtils.degToRad(1.54);
        scene.add(moon);

        // Compute sun direction from phase
        const phaseDeg = computeMoonData() || 90;
        const phaseRad = (phaseDeg * Math.PI) / 180;
        const sunDir = new THREE.Vector3(
            Math.cos(phaseRad),
            0.15,
            Math.sin(phaseRad)
        ).normalize();

        // Directional light (the Sun)
        const sunLight = new THREE.DirectionalLight(0xfff8e8, 2.2);
        sunLight.position.copy(sunDir.clone().multiplyScalar(20));
        scene.add(sunLight);

        // Very dim ambient for the dark side
        scene.add(new THREE.AmbientLight(0x222244, 0.10));

        // Subtle earthshine on dark side
        const earthshine = new THREE.DirectionalLight(0x4466aa, 0.06);
        earthshine.position.copy(sunDir.clone().negate().multiplyScalar(10));
        scene.add(earthshine);

        // Subtle rim glow
        const glowGeom = new THREE.SphereGeometry(2.08, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.035,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(glowGeom, glowMat));

        // ── Landing site markers — interactive with raycasting ──
        const siteGroup = new THREE.Group();
        const markerMeshes = []; // For raycasting

        LANDING_SITES.forEach((site, idx) => {
            const lat = THREE.MathUtils.degToRad(site.lat);
            const lon = THREE.MathUtils.degToRad(site.lon);
            const R = 2.02;

            const x = R * Math.cos(lat) * Math.sin(lon);
            const y = R * Math.sin(lat);
            const z = R * Math.cos(lat) * Math.cos(lon);

            // Outer glow sphere (for easier raycasting hit area)
            const hitGeom = new THREE.SphereGeometry(0.07, 8, 8);
            const hitMat = new THREE.MeshBasicMaterial({
                color: TYPE_COLORS[site.type] || 0xffffff,
                transparent: true,
                opacity: 0.0, // invisible but raycastable
            });
            const hitMesh = new THREE.Mesh(hitGeom, hitMat);
            hitMesh.position.set(x, y, z);
            hitMesh.userData = { siteIndex: idx, siteName: site.name };
            siteGroup.add(hitMesh);
            markerMeshes.push(hitMesh);

            // Visible dot marker
            const mGeom = new THREE.SphereGeometry(0.028, 10, 10);
            const mMat = new THREE.MeshBasicMaterial({
                color: TYPE_COLORS[site.type] || 0xffffff,
            });
            const marker = new THREE.Mesh(mGeom, mMat);
            marker.position.set(x, y, z);
            siteGroup.add(marker);

            // Tiny ring pulse
            const ringGeom = new THREE.RingGeometry(0.038, 0.050, 20);
            const ringMat = new THREE.MeshBasicMaterial({
                color: TYPE_COLORS[site.type] || 0xffffff,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(x, y, z);
            ring.lookAt(0, 0, 0);
            siteGroup.add(ring);
        });
        moon.add(siteGroup);

        // ── Raycasting for hover/click on markers ──
        const raycaster = new THREE.Raycaster();
        const mouseVec = new THREE.Vector2();
        let hoveredIdx = -1;

        const getMouseNDC = (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        };

        const doRaycast = () => {
            raycaster.setFromCamera(mouseVec, camera);
            const intersects = raycaster.intersectObjects(markerMeshes, false);
            return intersects.length > 0 ? intersects[0] : null;
        };

        // Interaction
        let isDragging = false;
        let dragDistance = 0;
        let prevMouse = { x: 0, y: 0 };
        let velocity = { x: 0, y: 0 };

        const onDown = (e) => {
            isDragging = true;
            dragDistance = 0;
            const pt = e.touches ? e.touches[0] : e;
            prevMouse = { x: pt.clientX, y: pt.clientY };
            velocity = { x: 0, y: 0 };
        };
        const onMove = (e) => {
            const pt = e.touches ? e.touches[0] : e;

            // Hover detection (only on desktop)
            if (!isDragging && !e.touches) {
                getMouseNDC(e);
                const hit = doRaycast();
                if (hit) {
                    const idx = hit.object.userData.siteIndex;
                    if (idx !== hoveredIdx) {
                        hoveredIdx = idx;
                        setHoveredSite(LANDING_SITES[idx]);
                        const rect = renderer.domElement.getBoundingClientRect();
                        setTooltipPos({
                            x: pt.clientX - rect.left,
                            y: pt.clientY - rect.top,
                        });
                    } else {
                        // Update position
                        const rect = renderer.domElement.getBoundingClientRect();
                        setTooltipPos({
                            x: pt.clientX - rect.left,
                            y: pt.clientY - rect.top,
                        });
                    }
                    renderer.domElement.style.cursor = 'pointer';
                } else {
                    if (hoveredIdx !== -1) {
                        hoveredIdx = -1;
                        setHoveredSite(null);
                        setTooltipPos(null);
                    }
                    renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
                }
            }

            if (!isDragging) return;
            const dx = pt.clientX - prevMouse.x;
            const dy = pt.clientY - prevMouse.y;
            dragDistance += Math.abs(dx) + Math.abs(dy);
            velocity = { x: dy * 0.004, y: dx * 0.004 };
            moon.rotation.x += velocity.x;
            moon.rotation.y += velocity.y;
            prevMouse = { x: pt.clientX, y: pt.clientY };
        };
        const onUp = (e) => {
            // Click detection (short drag = click)
            if (isDragging && dragDistance < 5 && e && !e.touches) {
                getMouseNDC(e);
                const hit = doRaycast();
                if (hit) {
                    const idx = hit.object.userData.siteIndex;
                    setSelectedSite(prev =>
                        prev && prev.name === LANDING_SITES[idx].name ? null : LANDING_SITES[idx]
                    );
                }
            }
            isDragging = false;
        };
        const onWheel = (e) => {
            e.preventDefault();
            const zoom = e.deltaY > 0 ? 1.08 : 0.92;
            const newZ = camera.position.z * zoom;
            camera.position.z = Math.max(3, Math.min(12, newZ));
        };

        const el = renderer.domElement;
        el.addEventListener('mousedown', onDown);
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseup', onUp);
        el.addEventListener('mouseleave', () => { isDragging = false; setHoveredSite(null); setTooltipPos(null); hoveredIdx = -1; });
        el.addEventListener('touchstart', onDown, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onUp);
        el.addEventListener('wheel', onWheel, { passive: false });

        // Animate
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            if (!isDragging) {
                velocity.x *= 0.96;
                velocity.y *= 0.96;
                moon.rotation.x += velocity.x;
                moon.rotation.y += velocity.y;

                if (Math.abs(velocity.y) < 0.0005) {
                    moon.rotation.y += 0.0004;
                }
            }

            // Gentle pulsing on marker rings
            const t = Date.now() * 0.003;
            siteGroup.children.forEach((child) => {
                if (child.geometry && child.geometry.type === 'RingGeometry') {
                    child.material.opacity = 0.25 + Math.sin(t) * 0.15;
                }
            });

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const onResize = () => {
            const w = container.clientWidth, h = container.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        threeRef.current = { renderer, scene, camera, moon, markerMeshes };

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(frameId);
            el.removeEventListener('mousedown', onDown);
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseup', onUp);
            el.removeEventListener('mouseleave', onUp);
            el.removeEventListener('touchstart', onDown);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onUp);
            el.removeEventListener('wheel', onWheel);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            moonGeom.dispose();
            moonMat.dispose();
            moonTexture.dispose();
            normalMap.dispose();
            glowGeom.dispose();
            glowMat.dispose();
            starGeom.dispose();
            renderer.dispose();
        };
    }, [open]);

    /* ─── Rotate globe to show a site when clicking sidebar ─── */
    const focusSite = useCallback((site) => {
        if (!threeRef.current) return;
        const { moon } = threeRef.current;
        const lon = THREE.MathUtils.degToRad(site.lon);
        // Target Y rotation to face this longitude toward camera
        const targetY = -lon + Math.PI / 2;
        // Animate rotation smoothly
        const startY = moon.rotation.y;
        const diff = ((targetY - startY + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        const startTime = performance.now();
        const duration = 800;
        const animateRotation = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            moon.rotation.y = startY + diff * ease;
            if (progress < 1) requestAnimationFrame(animateRotation);
        };
        requestAnimationFrame(animateRotation);
    }, []);

    if (!open) return null;

    const phaseEmoji = moonData.phaseDeg < 45 ? '🌑' :
        moonData.phaseDeg < 90 ? '🌒' :
        moonData.phaseDeg < 135 ? '🌓' :
        moonData.phaseDeg < 180 ? '🌔' :
        moonData.phaseDeg < 225 ? '🌕' :
        moonData.phaseDeg < 270 ? '🌖' :
        moonData.phaseDeg < 315 ? '🌗' : '🌘';

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="fixed inset-0 z-50 flex" style={{ background: '#060610' }}>

            {/* ═══ Mobile: Toggle button for sidebar (when closed) ═══ */}
            {isMobile && !sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="absolute top-4 left-4 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    aria-label="Show moon info"
                >
                    <span className="text-base">{phaseEmoji}</span>
                </button>
            )}

            {/* ═══ Left Panel — always on desktop, toggle on mobile ═══ */}
            <div
                className={`relative z-20 w-72 shrink-0 flex flex-col overflow-y-auto custom-scrollbar transition-transform duration-300 ${
                    isMobile && !sidebarOpen ? '-translate-x-full absolute inset-y-0 left-0' : ''
                } ${isMobile && sidebarOpen ? 'absolute inset-y-0 left-0' : ''}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(10,12,30,0.98), rgba(6,8,20,0.98))',
                    borderRight: '1px solid rgba(126,184,247,0.08)',
                }}
            >
                {/* Title */}
                <div className="p-5 pb-2 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wider leading-tight">
                            {phaseEmoji} LUNAR<br />OBSERVATORY
                        </h2>
                        <p className="text-[10px] text-white/40 mt-1">Interactive 3D Moon &bull; Real-time Phase</p>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors mt-1"
                            aria-label="Close panel"
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M2 2l8 8M10 2l-8 8" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Phase card */}
                <div className="mx-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Current Phase</div>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 shrink-0">
                            <svg viewBox="0 0 40 40" className="w-full h-full">
                                <circle cx="20" cy="20" r="18" fill="#222" />
                                <circle cx="20" cy="20" r="18" fill="#ddd"
                                    clipPath={`inset(0 ${Math.max(0, 100 - moonData.illumination)}% 0 0)`}
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">{moonData.illumination.toFixed(1)}%</div>
                            <div className="text-[10px] text-white/50">{moonData.phaseName}</div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="px-4 py-3 space-y-2">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[9px] text-white/35 uppercase tracking-wider">Distance</div>
                        <div className="text-sm text-white font-mono mt-0.5">
                            {moonData.distanceKm.toLocaleString()} km
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[9px] text-white/35 uppercase tracking-wider">Phase Angle</div>
                        <div className="text-sm text-white font-mono mt-0.5">{moonData.phaseDeg.toFixed(1)}°</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[9px] text-white/35 uppercase tracking-wider">Libration (Lat / Lon)</div>
                        <div className="text-sm text-white font-mono mt-0.5">
                            {moonData.libLat.toFixed(2)}° / {moonData.libLon.toFixed(2)}°
                        </div>
                    </div>
                </div>

                {/* Landing sites */}
                <div className="px-4 flex-1 pb-4">
                    <button
                        onClick={() => setShowSites(!showSites)}
                        className="w-full flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest mb-2 hover:text-white/60 transition-colors"
                    >
                        <span>Landing Sites ({LANDING_SITES.length})</span>
                        <span>{showSites ? '−' : '+'}</span>
                    </button>
                    {showSites && (
                        <div className="space-y-1.5 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                            {LANDING_SITES.map((s) => {
                                const isSelected = selectedSite && selectedSite.name === s.name;
                                return (
                                    <div key={s.name}>
                                        <button
                                            onClick={() => {
                                                setSelectedSite(isSelected ? null : s);
                                                if (!isSelected) focusSite(s);
                                            }}
                                            className={`w-full text-left px-2.5 py-2 rounded-lg text-[10px] border transition-all duration-200
                                                ${isSelected
                                                    ? 'border-white/20 bg-white/[0.08]'
                                                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                                                    style={{ background: TYPE_HEX[s.type] }}
                                                />
                                                <span className="font-semibold text-white flex-1">{s.name}</span>
                                                <span className="text-white/25 text-[9px]">{s.year}</span>
                                            </div>
                                            <div className="text-white/35 mt-0.5 pl-[18px]">
                                                {s.lat.toFixed(2)}°, {s.lon.toFixed(2)}° &bull; {s.region}
                                            </div>
                                        </button>

                                        {/* Expanded info card */}
                                        {isSelected && (
                                            <div className="mx-1 mt-1 mb-2 p-3 rounded-lg border border-white/10 bg-white/[0.04] animate-fadeIn space-y-2">
                                                <div className="text-[10px] text-white/70 leading-relaxed">
                                                    {s.desc}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <div className="p-1.5 rounded bg-white/[0.04]">
                                                        <div className="text-[8px] text-white/30 uppercase">Crew</div>
                                                        <div className="text-[9px] text-white/60 mt-0.5">{s.crew}</div>
                                                    </div>
                                                    <div className="p-1.5 rounded bg-white/[0.04]">
                                                        <div className="text-[8px] text-white/30 uppercase">Duration</div>
                                                        <div className="text-[9px] text-white/60 mt-0.5">{s.duration}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-1.5 p-1.5 rounded bg-white/[0.04]">
                                                    <span className="text-[10px] mt-px">🏆</span>
                                                    <div>
                                                        <div className="text-[8px] text-white/30 uppercase">Key Achievement</div>
                                                        <div className="text-[9px] text-white/70 mt-0.5 font-medium">{s.achievement}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-3 flex gap-3 text-[9px] text-white/30">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Apollo</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Luna</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Chang'e</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/[0.06] text-[9px] text-white/25">
                    Click a site to learn more &bull; Drag to rotate &bull; Scroll to zoom
                </div>
            </div>

            {/* Mobile backdrop when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div
                    className="absolute inset-0 z-15 bg-black/40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ═══ 3D Canvas ═══ */}
            <div
                ref={canvasContainerRef}
                className="flex-1 relative cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
            >
                {/* Hover tooltip on 3D globe */}
                {hoveredSite && tooltipPos && (
                    <div
                        className="absolute z-30 pointer-events-none animate-fadeIn"
                        style={{
                            left: tooltipPos.x + 16,
                            top: tooltipPos.y - 10,
                            maxWidth: '220px',
                        }}
                    >
                        <div className="px-3 py-2 rounded-lg border border-white/15 backdrop-blur-md"
                            style={{ background: 'rgba(10,12,30,0.92)' }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: TYPE_HEX[hoveredSite.type] }}
                                />
                                <span className="text-[11px] font-bold text-white">{hoveredSite.name}</span>
                                <span className="text-[9px] text-white/30 ml-auto">{hoveredSite.year}</span>
                            </div>
                            <div className="text-[9px] text-white/50">{hoveredSite.region}</div>
                            <div className="text-[9px] text-white/60 mt-1">{hoveredSite.achievement}</div>
                            <div className="text-[8px] text-white/25 mt-1">Click for details</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close"
            >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
            </button>
        </div>
    );
}
