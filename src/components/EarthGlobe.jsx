import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as sat from 'satellite.js';
import useAppStore from '../store/useAppStore';

/**
 * EarthGlobe — Photorealistic 3D Earth with day/night cycle,
 * atmosphere glow, cloud layer, and animated satellite orbits.
 * Full-screen immersive experience.
 */

/* ═══════════════════════════════════════════
   Texture URLs (NASA public domain via CDN)
   ═══════════════════════════════════════════ */
const TEXTURES = {
    day: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
    night: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
    clouds: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-clouds.png',
    bump: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
};

/* ═══════════════════════════════════════════
   Satellite Orbit Definitions
   ═══════════════════════════════════════════ */
const ORBITS = [
    { name: 'ISS', color: 0x00ff88, inclination: 51.6, radius: 5.35, speed: 0.008, count: 1, size: 0.08 },
    { name: 'Hubble', color: 0xffaa00, inclination: 28.5, radius: 5.45, speed: 0.006, count: 1, size: 0.06 },
    { name: 'Tiangong', color: 0xff4444, inclination: 41.5, radius: 5.38, speed: 0.0075, count: 1, size: 0.07 },
    { name: 'GPS', color: 0x88ff44, inclination: 55, radius: 8.2, speed: 0.002, count: 8, size: 0.04 },
    { name: 'Starlink', color: 0x6688ff, inclination: 53, radius: 5.45, speed: 0.009, count: 20, size: 0.025 },
    { name: 'GLONASS', color: 0xff8844, inclination: 64.8, radius: 7.8, speed: 0.0022, count: 6, size: 0.035 },
    { name: 'GEO Ring', color: 0xff44aa, inclination: 0.1, radius: 11.6, speed: 0.0005, count: 8, size: 0.04 },
    { name: 'Polar', color: 0x44ddff, inclination: 98, radius: 5.6, speed: 0.005, count: 4, size: 0.03 },
];

/* ═══════════════════════════════════════════
   CelesTrak TLE Sources (free, public domain)
   ═══════════════════════════════════════════ */
const CELESTRAK_URLS = [
    { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', label: 'All Active', count: '~8000' },
    { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', label: 'Space Stations', count: '~15' },
    { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle', label: 'Starlink', count: '~6000' },
];

const EARTH_RADIUS_KM = 6371;
const SCALE = 5.0 / EARTH_RADIUS_KM; // 5 units = Earth radius

/**
 * Parse TLE text into satellite records.
 * Returns array of { name, satrec }
 */
function parseTLEs(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const satellites = [];
    for (let i = 0; i < lines.length - 2; i++) {
        if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) {
            try {
                const satrec = sat.twoline2satrec(lines[i + 1], lines[i + 2]);
                if (satrec && !satrec.error) {
                    satellites.push({ name: lines[i], satrec });
                }
            } catch (e) { /* skip invalid */ }
            i += 2;
        }
    }
    return satellites;
}

/**
 * Calculate satellite position from satrec at given date.
 * Returns THREE.Vector3 in scene coordinates, or null if error.
 */
function getSatPosition(satrec, date) {
    const posVel = sat.propagate(satrec, date);
    if (!posVel.position) return null;
    const gmst = sat.gstime(date);
    const geo = sat.eciToGeodetic(posVel.position, gmst);
    const alt = geo.height; // km
    const lat = geo.latitude;
    const lon = geo.longitude;
    const r = (EARTH_RADIUS_KM + alt) * SCALE;
    return new THREE.Vector3(
        r * Math.cos(lat) * Math.cos(lon),
        r * Math.sin(lat),
        -r * Math.cos(lat) * Math.sin(lon)
    );
}

/* ═══════════════════════════════════════════
   GLSL Shaders
   ═══════════════════════════════════════════ */

const EARTH_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vUv = uv;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const EARTH_FRAGMENT = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D bumpMap;
uniform vec3 sunDir;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;

    // Bump mapping for subtle relief
    float bump = texture2D(bumpMap, vUv).r;

    // Sun lighting
    float NdotL = dot(normalize(vNormal), normalize(sunDir));
    float dayBlend = smoothstep(-0.15, 0.25, NdotL);

    // City lights glow brighter on night side
    vec3 nightGlow = night * 2.2;

    // Mix day and night
    vec3 color = mix(nightGlow, day, dayBlend);

    // Subtle specular highlight (ocean glint)
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(normalize(sunDir) + viewDir);
    float spec = pow(max(dot(normalize(vNormal), halfDir), 0.0), 120.0);
    color += vec3(0.4, 0.6, 0.9) * spec * dayBlend * 0.3;

    // Slight ambient on dark side
    color += vec3(0.01, 0.015, 0.03);

    gl_FragColor = vec4(color, 1.0);
}
`;

const ATMOS_VERTEX = `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const ATMOS_FRAGMENT = `
uniform vec3 sunDir;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));

    // Multi-layer atmosphere
    float innerGlow = pow(rim, 2.5) * 0.6;
    float outerGlow = pow(rim, 5.0) * 1.2;

    // Sun-side is brighter
    float NdotL = dot(normalize(vNormal), normalize(sunDir));
    float sunFactor = smoothstep(-0.5, 0.5, NdotL);

    vec3 dayAtmos = vec3(0.35, 0.65, 1.0);   // Blue
    vec3 twilight = vec3(0.8, 0.4, 0.2);       // Orange-red at terminator
    vec3 nightAtmos = vec3(0.05, 0.1, 0.3);    // Dark blue

    float twilightFactor = 1.0 - abs(NdotL * 2.0);
    twilightFactor = max(0.0, twilightFactor);
    twilightFactor = pow(twilightFactor, 2.0);

    vec3 atmosColor = mix(nightAtmos, dayAtmos, sunFactor);
    atmosColor = mix(atmosColor, twilight, twilightFactor * 0.5);

    float alpha = (innerGlow + outerGlow) * (0.4 + sunFactor * 0.6);
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(atmosColor, alpha);
}
`;

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

export default function EarthGlobe({ open, onClose }) {
    const mountRef = useRef(null);
    const sceneRef = useRef({});
    const [texturesLoaded, setTexturesLoaded] = useState(false);
    const [loadPct, setLoadPct] = useState(0);
    const [showAllSats, setShowAllSats] = useState(false);
    const [realSatCount, setRealSatCount] = useState(0);
    const [loadingSats, setLoadingSats] = useState(false);
    const [satMode, setSatMode] = useState('representative'); // 'representative' | 'all'
    const [orbitVisibility, setOrbitVisibility] = useState(
        ORBITS.reduce((acc, orbit) => ({ ...acc, [orbit.name]: true }), {})
    );
    const darkMode = useAppStore((s) => s.darkMode);

    /* ─── Three.js Setup ─── */
    useEffect(() => {
        if (!open || !mountRef.current) return;

        const container = mountRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        camera.position.set(0, 2, 14);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Texture loader with progress
        const loader = new THREE.TextureLoader();
        let loaded = 0;
        const totalTextures = 4;
        const textures = {};

        const loadTexture = (key, url) => new Promise((resolve) => {
            loader.load(
                url,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    textures[key] = tex;
                    loaded++;
                    setLoadPct(Math.round((loaded / totalTextures) * 100));
                    resolve(tex);
                },
                undefined,
                () => {
                    // Fallback: create a solid color texture
                    const canvas = document.createElement('canvas');
                    canvas.width = 2; canvas.height = 2;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = key === 'night' ? '#0a0a2a' : (key === 'clouds' ? '#ffffff' : '#1a4488');
                    ctx.fillRect(0, 0, 2, 2);
                    textures[key] = new THREE.CanvasTexture(canvas);
                    loaded++;
                    setLoadPct(Math.round((loaded / totalTextures) * 100));
                    resolve(textures[key]);
                }
            );
        });

        // Sun direction (slowly rotating)
        const sunDir = new THREE.Vector3(1.0, 0.3, 0.5).normalize();

        /* ─── Stars ─── */
        const starCount = 8000;
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 80 + Math.random() * 40;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);
            starSizes[i] = 0.5 + Math.random() * 2.0;
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeom.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.15,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
        });
        scene.add(new THREE.Points(starGeom, starMat));

        /* ─── Load textures then build Earth ─── */
        Promise.all([
            loadTexture('day', TEXTURES.day),
            loadTexture('night', TEXTURES.night),
            loadTexture('clouds', TEXTURES.clouds),
            loadTexture('bump', TEXTURES.bump),
        ]).then(() => {
            setTexturesLoaded(true);

            /* ─── Earth ─── */
            const earthGeom = new THREE.SphereGeometry(5, 96, 96);
            const earthMat = new THREE.ShaderMaterial({
                uniforms: {
                    dayMap: { value: textures.day },
                    nightMap: { value: textures.night },
                    bumpMap: { value: textures.bump },
                    sunDir: { value: sunDir },
                },
                vertexShader: EARTH_VERTEX,
                fragmentShader: EARTH_FRAGMENT,
            });
            const earth = new THREE.Mesh(earthGeom, earthMat);
            earth.rotation.y = -Math.PI / 2; // Start showing Americas
            scene.add(earth);
            sceneRef.current.earth = earth;

            /* ─── Cloud Layer ─── */
            const cloudGeom = new THREE.SphereGeometry(5.05, 64, 64);
            const cloudMat = new THREE.MeshPhongMaterial({
                map: textures.clouds,
                transparent: true,
                opacity: 0.35,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const clouds = new THREE.Mesh(cloudGeom, cloudMat);
            scene.add(clouds);
            sceneRef.current.clouds = clouds;

            /* ─── Atmosphere ─── */
            const atmosGeom = new THREE.SphereGeometry(5.3, 64, 64);
            const atmosMat = new THREE.ShaderMaterial({
                uniforms: { sunDir: { value: sunDir } },
                vertexShader: ATMOS_VERTEX,
                fragmentShader: ATMOS_FRAGMENT,
                transparent: true,
                side: THREE.BackSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            scene.add(new THREE.Mesh(atmosGeom, atmosMat));

            /* ─── Inner Atmosphere (subtle front-face glow) ─── */
            const innerAtmosGeom = new THREE.SphereGeometry(5.08, 64, 64);
            const innerAtmosMat = new THREE.ShaderMaterial({
                uniforms: { sunDir: { value: sunDir } },
                vertexShader: ATMOS_VERTEX,
                fragmentShader: ATMOS_FRAGMENT,
                transparent: true,
                side: THREE.FrontSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            scene.add(new THREE.Mesh(innerAtmosGeom, innerAtmosMat));

            /* ─── Satellite Orbits ─── */
            const satGroup = new THREE.Group();
            const orbitData = [];
            const orbitRings = {}; // Track orbit rings by name for visibility toggling

            ORBITS.forEach((orbit) => {
                const incRad = (orbit.inclination * Math.PI) / 180;

                // Orbit ring (thin line)
                const ringPts = [];
                for (let i = 0; i <= 128; i++) {
                    const a = (i / 128) * Math.PI * 2;
                    const x = orbit.radius * Math.cos(a);
                    const z = orbit.radius * Math.sin(a);
                    const y = 0;
                    // Apply inclination
                    const ry = y * Math.cos(incRad) - z * Math.sin(incRad);
                    const rz = y * Math.sin(incRad) + z * Math.cos(incRad);
                    ringPts.push(new THREE.Vector3(x, ry, rz));
                }
                const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPts);
                const ringMat = new THREE.LineBasicMaterial({
                    color: orbit.color,
                    transparent: true,
                    opacity: 0.15,
                    linewidth: 1,
                });
                const ringLine = new THREE.Line(ringGeom, ringMat);
                satGroup.add(ringLine);
                orbitRings[orbit.name] = ringLine; // Store reference

                // Satellite dots
                for (let s = 0; s < orbit.count; s++) {
                    const phase = (s / orbit.count) * Math.PI * 2;
                    const dotGeom = new THREE.SphereGeometry(orbit.size, 8, 8);
                    const dotMat = new THREE.MeshBasicMaterial({
                        color: orbit.color,
                        transparent: true,
                        opacity: 0.9,
                    });
                    const dot = new THREE.Mesh(dotGeom, dotMat);

                    // Glow sprite
                    const spriteMat = new THREE.SpriteMaterial({
                        color: orbit.color,
                        transparent: true,
                        opacity: 0.4,
                        blending: THREE.AdditiveBlending,
                    });
                    const sprite = new THREE.Sprite(spriteMat);
                    sprite.scale.setScalar(orbit.size * 6);
                    dot.add(sprite);

                    satGroup.add(dot);
                    orbitData.push({
                        mesh: dot,
                        radius: orbit.radius,
                        inclination: incRad,
                        speed: orbit.speed,
                        phase,
                        raan: s * 0.5 + Math.random() * 0.5, // Random ascending node
                        orbitName: orbit.name, // Track which orbit this satellite belongs to
                    });
                }
            });

            scene.add(satGroup);
            sceneRef.current.satGroup = satGroup;
            sceneRef.current.orbitData = orbitData;
            sceneRef.current.orbitRings = orbitRings;
            sceneRef.current.scene = scene;

            /* ─── Ambient light for clouds ─── */
            const ambLight = new THREE.AmbientLight(0x222244, 0.5);
            scene.add(ambLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
            dirLight.position.copy(sunDir).multiplyScalar(50);
            scene.add(dirLight);
        });

        /* ─── Controls (drag + zoom) ─── */
        let isDragging = false;
        let prevPos = { x: 0, y: 0 };
        let rotY = 0;
        let rotX = 0.3;
        let targetRotY = 0;
        let targetRotX = 0.3;
        let camDist = 14;
        let targetDist = 14;
        let autoRotSpeed = 0.001;

        const onPointerDown = (e) => {
            isDragging = true;
            autoRotSpeed = 0;
            const pt = e.touches ? e.touches[0] : e;
            prevPos = { x: pt.clientX, y: pt.clientY };
        };
        const onPointerMove = (e) => {
            if (!isDragging) return;
            const pt = e.touches ? e.touches[0] : e;
            const dx = pt.clientX - prevPos.x;
            const dy = pt.clientY - prevPos.y;
            targetRotY += dx * 0.004;
            targetRotX += dy * 0.004;
            targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX));
            prevPos = { x: pt.clientX, y: pt.clientY };
        };
        const onPointerUp = () => {
            isDragging = false;
            // Resume auto-rotation slowly
            setTimeout(() => { if (!isDragging) autoRotSpeed = 0.001; }, 3000);
        };
        const onWheel = (e) => {
            e.preventDefault();
            targetDist += e.deltaY * 0.01;
            targetDist = Math.max(7.5, Math.min(25, targetDist));
        };

        renderer.domElement.addEventListener('mousedown', onPointerDown);
        renderer.domElement.addEventListener('mousemove', onPointerMove);
        renderer.domElement.addEventListener('mouseup', onPointerUp);
        renderer.domElement.addEventListener('mouseleave', onPointerUp);
        renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: true });
        renderer.domElement.addEventListener('touchmove', onPointerMove, { passive: true });
        renderer.domElement.addEventListener('touchend', onPointerUp);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

        /* ─── Animation Loop ─── */
        let frameId;
        let elapsed = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            elapsed += delta;

            // Auto-rotation
            targetRotY += autoRotSpeed;

            // Smooth camera
            rotY += (targetRotY - rotY) * 0.08;
            rotX += (targetRotX - rotX) * 0.08;
            camDist += (targetDist - camDist) * 0.08;

            camera.position.x = camDist * Math.sin(rotY) * Math.cos(rotX);
            camera.position.y = camDist * Math.sin(rotX);
            camera.position.z = camDist * Math.cos(rotY) * Math.cos(rotX);
            camera.lookAt(0, 0, 0);

            // Earth rotation
            if (sceneRef.current.earth) {
                sceneRef.current.earth.rotation.y += delta * 0.03;
            }

            // Cloud rotation (slightly faster)
            if (sceneRef.current.clouds) {
                sceneRef.current.clouds.rotation.y += delta * 0.04;
                sceneRef.current.clouds.rotation.x += delta * 0.005;
            }

            // Satellite animation (representative)
            if (sceneRef.current.orbitData) {
                sceneRef.current.orbitData.forEach((s) => {
                    const angle = s.phase + elapsed * s.speed * 10;
                    const x = s.radius * Math.cos(angle + s.raan);
                    const z = s.radius * Math.sin(angle + s.raan);
                    const y = 0;
                    const ry = y * Math.cos(s.inclination) - z * Math.sin(s.inclination);
                    const rz = y * Math.sin(s.inclination) + z * Math.cos(s.inclination);
                    s.mesh.position.set(x, ry, rz);
                });
            }

            // Real satellite positions (updated every 60 frames for performance)
            if (sceneRef.current.realSatParticles && sceneRef.current.realSatrecs) {
                const frameCount = Math.floor(elapsed * 60);
                if (frameCount % 60 === 0) { // Update every ~1 second
                    const positions = sceneRef.current.realSatParticles.geometry.attributes.position;
                    const now = new Date();
                    sceneRef.current.realSatrecs.forEach((rec, i) => {
                        const pos = getSatPosition(rec.satrec, now);
                        if (pos) {
                            positions.array[i * 3] = pos.x;
                            positions.array[i * 3 + 1] = pos.y;
                            positions.array[i * 3 + 2] = pos.z;
                        }
                    });
                    positions.needsUpdate = true;
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        /* ─── Resize ─── */
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        /* ─── Cleanup ─── */
        sceneRef.current.cleanup = () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('mousedown', onPointerDown);
            renderer.domElement.removeEventListener('mousemove', onPointerMove);
            renderer.domElement.removeEventListener('mouseup', onPointerUp);
            renderer.domElement.removeEventListener('mouseleave', onPointerUp);
            renderer.domElement.removeEventListener('touchstart', onPointerDown);
            renderer.domElement.removeEventListener('touchmove', onPointerMove);
            renderer.domElement.removeEventListener('touchend', onPointerUp);
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.dispose();
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            Object.values(textures).forEach((t) => t.dispose && t.dispose());
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };

        return () => {
            if (sceneRef.current.cleanup) sceneRef.current.cleanup();
            setTexturesLoaded(false);
            setLoadPct(0);
        };
    }, [open]);

    /* ─── Handle Orbit Visibility Changes ─── */
    useEffect(() => {
        if (!sceneRef.current.orbitData || !sceneRef.current.orbitRings) return;

        // Update satellite mesh visibility
        sceneRef.current.orbitData.forEach((s) => {
            s.mesh.visible = orbitVisibility[s.orbitName] ?? true;
        });

        // Update orbit ring visibility
        Object.entries(sceneRef.current.orbitRings).forEach(([orbitName, ring]) => {
            ring.visible = orbitVisibility[orbitName] ?? true;
        });
    }, [orbitVisibility]);

    /* ─── Load Real Satellites from CelesTrak ─── */
    const loadRealSatellites = useCallback(async () => {
        if (!sceneRef.current.scene) return;
        setLoadingSats(true);

        try {
            // Fetch active satellites TLE data
            const response = await fetch(CELESTRAK_URLS[0].url);
            if (!response.ok) throw new Error('Failed to fetch TLE data');
            const text = await response.text();
            const satellites = parseTLEs(text);
            setRealSatCount(satellites.length);

            // Remove existing real sat particles if any
            if (sceneRef.current.realSatParticles) {
                sceneRef.current.scene.remove(sceneRef.current.realSatParticles);
                sceneRef.current.realSatParticles.geometry.dispose();
                sceneRef.current.realSatParticles.material.dispose();
            }

            // Create particle system for all satellites
            const count = satellites.length;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const now = new Date();

            // Color by altitude
            satellites.forEach((s, i) => {
                const pos = getSatPosition(s.satrec, now);
                if (pos) {
                    positions[i * 3] = pos.x;
                    positions[i * 3 + 1] = pos.y;
                    positions[i * 3 + 2] = pos.z;
                } else {
                    positions[i * 3] = 0;
                    positions[i * 3 + 1] = 100; // Off-screen
                    positions[i * 3 + 2] = 0;
                }

                // Color based on orbital altitude (distance from center)
                const dist = Math.sqrt(positions[i*3]**2 + positions[i*3+1]**2 + positions[i*3+2]**2);
                if (dist < 5.8) {
                    // LEO - blue/cyan
                    colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 1.0;
                } else if (dist < 9) {
                    // MEO - green
                    colors[i * 3] = 0.3; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.3;
                } else {
                    // GEO/HEO - gold
                    colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.2;
                }
            });

            const particleGeom = new THREE.BufferGeometry();
            particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const particleMat = new THREE.PointsMaterial({
                size: 0.04,
                sizeAttenuation: true,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

            const particles = new THREE.Points(particleGeom, particleMat);
            sceneRef.current.scene.add(particles);
            sceneRef.current.realSatParticles = particles;
            sceneRef.current.realSatrecs = satellites;

            // Hide representative satellites when showing all
            if (sceneRef.current.satGroup) {
                sceneRef.current.satGroup.visible = false;
            }

            setSatMode('all');
            setShowAllSats(true);
        } catch (error) {
            console.error('Failed to load satellites:', error);
            alert('Could not load satellite data. Check your internet connection.');
        } finally {
            setLoadingSats(false);
        }
    }, []);

    /* ─── Switch back to representative mode ─── */
    const showRepresentativeSats = useCallback(() => {
        if (sceneRef.current.realSatParticles) {
            sceneRef.current.scene.remove(sceneRef.current.realSatParticles);
            sceneRef.current.realSatParticles.geometry.dispose();
            sceneRef.current.realSatParticles.material.dispose();
            sceneRef.current.realSatParticles = null;
            sceneRef.current.realSatrecs = null;
        }
        if (sceneRef.current.satGroup) {
            sceneRef.current.satGroup.visible = true;
        }
        setSatMode('representative');
        setShowAllSats(false);
        setRealSatCount(0);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50" style={{ background: '#000008' }}>
            {/* Canvas container */}
            <div ref={mountRef} className="w-full h-full" />

            {/* Loading overlay */}
            {!texturesLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="text-3xl mb-4">🌍</div>
                    <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${loadPct}%`,
                                background: 'linear-gradient(90deg, #4a90d9, #7eb8f7)',
                            }}
                        />
                    </div>
                    <span className="text-xs text-white/50 mt-2 font-mono">{loadPct}%</span>
                </div>
            )}

            {/* Top HUD */}
            <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
                {/* Title */}
                <div className="flex items-center justify-between p-4">
                    <div>
                        <h2
                            className="text-lg font-bold tracking-wider"
                            style={{ color: 'rgba(126,184,247,0.9)', textShadow: '0 0 20px rgba(126,184,247,0.3)' }}
                        >
                            EARTH OBSERVATORY
                        </h2>
                        <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">
                            Real-time satellite tracking &bull; Photorealistic globe
                        </p>
                    </div>
                </div>
            </div>

            {/* Satellite Panel */}
            {texturesLoaded && (
                <div
                    className="absolute bottom-20 left-4 z-10 p-3 rounded-xl"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    {/* Mode indicator */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-[9px] text-white/40 uppercase tracking-wider">
                            {satMode === 'all' ? 'All Satellites' : 'Representative'}
                        </div>
                        {satMode === 'all' && (
                            <span className="text-[10px] font-mono text-cosmos-accent">
                                {realSatCount.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Legend */}
                    {satMode === 'representative' ? (
                        <div className="space-y-1.5 mb-3">
                            {ORBITS.map((orbit) => {
                                const isVisible = orbitVisibility[orbit.name] ?? true;
                                return (
                                    <button
                                        key={orbit.name}
                                        onClick={() => setOrbitVisibility(prev => ({ ...prev, [orbit.name]: !prev[orbit.name] }))}
                                        className="w-full flex items-center gap-2 px-2 py-1 rounded transition-all hover:bg-white/5 active:scale-95 group cursor-pointer"
                                        title={isVisible ? `Hide ${orbit.name}` : `Show ${orbit.name}`}
                                    >
                                        {/* Eye icon */}
                                        <span className="text-[8px] text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0">
                                            {isVisible ? '👁️' : '🚫'}
                                        </span>

                                        {/* Color dot */}
                                        <span
                                            className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${!isVisible ? 'opacity-40' : ''}`}
                                            style={{
                                                background: `#${orbit.color.toString(16).padStart(6, '0')}`,
                                                boxShadow: isVisible ? `0 0 6px #${orbit.color.toString(16).padStart(6, '0')}` : 'none',
                                            }}
                                        />

                                        {/* Label */}
                                        <span
                                            className={`text-[10px] transition-all ${
                                                isVisible
                                                    ? 'text-white/60'
                                                    : 'text-white/30 line-through'
                                            }`}
                                        >
                                            {orbit.name} {orbit.count > 1 ? `(${orbit.count})` : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#4db3ff', boxShadow: '0 0 6px #4db3ff' }} />
                                <span className="text-[10px] text-white/60">LEO (&lt;2,000 km)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#4dff4d', boxShadow: '0 0 6px #4dff4d' }} />
                                <span className="text-[10px] text-white/60">MEO (2,000-35,000 km)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: '#ffcc33', boxShadow: '0 0 6px #ffcc33' }} />
                                <span className="text-[10px] text-white/60">GEO/HEO (&gt;35,000 km)</span>
                            </div>
                        </div>
                    )}

                    {/* Toggle button */}
                    <button
                        onClick={satMode === 'representative' ? loadRealSatellites : showRepresentativeSats}
                        disabled={loadingSats}
                        className="w-full py-2 px-3 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                        style={{
                            background: satMode === 'all'
                                ? 'rgba(126,184,247,0.15)'
                                : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${satMode === 'all' ? 'rgba(126,184,247,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            color: satMode === 'all' ? '#7eb8f7' : 'rgba(255,255,255,0.7)',
                        }}
                    >
                        {loadingSats ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <span className="animate-spin-slow">📡</span> Loading TLEs...
                            </span>
                        ) : satMode === 'representative' ? (
                            <span className="flex items-center justify-center gap-1.5">
                                📡 Show ALL satellites (~8,000+)
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-1.5">
                                ← Back to representative view
                            </span>
                        )}
                    </button>

                    {satMode === 'representative' && (
                        <p className="text-[8px] text-white/30 mt-1.5 text-center">
                            Currently showing ~50 representative satellites.
                            <br />Tap to load all active satellites in real-time.
                        </p>
                    )}
                </div>
            )}

            {/* Controls hint */}
            {texturesLoaded && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <p className="text-[10px] text-white/30 text-center">
                        Drag to rotate &bull; Scroll to zoom
                    </p>
                </div>
            )}

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
            </button>
        </div>
    );
}
