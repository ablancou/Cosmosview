import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * MoonGlobe — Photorealistic 3D Moon with procedural surface,
 * lunar phase visualization, landing site markers, libration info.
 * Full-screen immersive experience.
 */

/* ═══════════════════════════════════════════
   Lunar Landing Sites (coordinates in lat/lon)
   ═══════════════════════════════════════════ */
const LANDING_SITES = [
    { name: 'Apollo 11', lat: 0.6735, lon: 23.4730, type: 'Apollo', year: 1969 },
    { name: 'Apollo 12', lat: -3.0128, lon: -23.4216, type: 'Apollo', year: 1969 },
    { name: 'Apollo 14', lat: -3.6453, lon: -17.4747, type: 'Apollo', year: 1971 },
    { name: 'Apollo 15', lat: 26.1324, lon: 3.6340, type: 'Apollo', year: 1971 },
    { name: 'Apollo 16', lat: -8.9730, lon: 15.5000, type: 'Apollo', year: 1972 },
    { name: 'Apollo 17', lat: 20.1905, lon: 30.7714, type: 'Apollo', year: 1972 },
    { name: 'Luna 2', lat: 29.1, lon: 0.0, type: 'Luna', year: 1959 },
    { name: 'Luna 9', lat: -7.13, lon: -64.37, type: 'Luna', year: 1966 },
    { name: 'Luna 17', lat: 38.28, lon: -35.00, type: 'Luna', year: 1970 },
    { name: 'Luna 21', lat: 25.85, lon: 30.86, type: 'Luna', year: 1973 },
    { name: 'Chang\'e 3', lat: 38.3149, lon: 52.6383, type: 'Chang\'e', year: 2013 },
    { name: 'Chang\'e 4', lat: -45.46, lon: 177.60, type: 'Chang\'e', year: 2018 },
    { name: 'Chang\'e 5', lat: 32.01, lon: 51.92, type: 'Chang\'e', year: 2020 },
];

const MOON_RADIUS_KM = 1737.4;
const SCALE = 2.0 / MOON_RADIUS_KM; // 2 units = Moon radius

/* ═══════════════════════════════════════════
   GLSL Shaders
   ═══════════════════════════════════════════ */

const MOON_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;

uniform sampler2D heightMap;

void main() {
    vUv = uv;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz);
    vHeight = texture2D(heightMap, uv).r;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const MOON_FRAGMENT = `
uniform sampler2D heightMap;
uniform vec3 sunDir;
uniform float phase;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vHeight;

// Simplex noise for crater shadows
vec3 hash3(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 19.19);
    return fract((p.xyx + p.yzz) * p.zyx);
}

float noise(vec3 p) {
    vec3 ip = floor(p);
    vec3 fp = fract(p);
    fp = fp * fp * (3.0 - 2.0 * fp);
    vec4 a = vec4(hash3(ip), 1.0);
    vec4 b = vec4(hash3(ip + vec3(1.0, 0.0, 0.0)), 1.0);
    vec4 c = vec4(hash3(ip + vec3(0.0, 1.0, 0.0)), 1.0);
    vec4 d = vec4(hash3(ip + vec3(1.0, 1.0, 0.0)), 1.0);
    float ab = mix(a.x, b.x, fp.x);
    float cd = mix(c.x, d.x, fp.x);
    return mix(ab, cd, fp.y);
}

void main() {
    // Base height variation
    float heightVariation = texture2D(heightMap, vUv).r;

    // Crater simulation using layered noise
    float craterFreq1 = noise(vec3(vUv * 5.0, 0.0));
    float craterFreq2 = noise(vec3(vUv * 15.0, 0.5));
    float craterPattern = mix(craterFreq1, craterFreq2, 0.5);

    // Crater shadows (darker depressions)
    float craterShadow = smoothstep(0.3, 0.7, craterPattern) * 0.4;

    // Mare (dark seas) vs highlands
    float mareNoise = noise(vec3(vUv * 3.0, 1.0));
    float isMare = smoothstep(0.4, 0.6, mareNoise);

    // Base colors
    vec3 highland = vec3(0.82, 0.81, 0.78);  // Light gray
    vec3 mare = vec3(0.35, 0.34, 0.32);     // Dark gray
    vec3 baseColor = mix(highland, mare, isMare);

    // Blend crater shadows
    baseColor *= (1.0 - craterShadow * 0.6);

    // Edge craters with rims (lighter spots)
    float rimHighlight = pow(max(0.0, sin(vUv.x * 30.0) * cos(vUv.y * 25.0)), 3.0) * 0.15;
    baseColor += rimHighlight * vec3(1.0, 0.95, 0.9);

    // Sun lighting based on phase
    float NdotL = dot(normalize(vNormal), normalize(sunDir));

    // Smooth terminator transition
    float dayBlend = smoothstep(-0.2, 0.2, NdotL);

    // Add surface detail from height
    float heightDetail = (heightVariation - 0.5) * 0.3;
    baseColor += heightDetail * vec3(0.1, 0.1, 0.08);

    // Specular highlights (rare on moon)
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(normalize(sunDir) + viewDir);
    float spec = pow(max(dot(normalize(vNormal), halfDir), 0.0), 20.0);
    baseColor += vec3(1.0, 1.0, 0.95) * spec * dayBlend * 0.1;

    // Night side gets very subtle twilight
    vec3 nightSide = baseColor * 0.15;

    // Terminator glow
    float terminator = smoothstep(-0.15, 0.15, NdotL);
    vec3 twilightColor = vec3(0.4, 0.3, 0.25);
    baseColor = mix(nightSide, baseColor, terminator);
    baseColor = mix(baseColor, twilightColor, (1.0 - terminator) * 0.3 * (1.0 - abs(NdotL)));

    gl_FragColor = vec4(baseColor, 1.0);
}
`;

const GLOW_VERTEX = `
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAGMENT = `
uniform vec3 sunDir;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    float glowIntensity = pow(rim, 3.0) * 0.8;

    // Sun-side glow
    float NdotL = dot(normalize(vNormal), normalize(sunDir));
    float sunGlow = smoothstep(-0.3, 0.3, NdotL);

    vec3 glowColor = vec3(0.6, 0.55, 0.5);
    float alpha = glowIntensity * sunGlow * 0.4;

    gl_FragColor = vec4(glowColor, alpha);
}
`;

/* ═══════════════════════════════════════════
   Procedural Texture Generation
   ═══════════════════════════════════════════ */

function createMoonHeightMap(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fill with base noise
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Perlin-like noise simulation using random values and smoothing
    const noiseMap = new Float32Array(size * size);

    // Multi-octave noise
    let maxVal = 0;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let value = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxAmplitude = 0;

            for (let octave = 0; octave < 4; octave++) {
                const sampleX = (x / size) * frequency * 4 + octave * 100;
                const sampleY = (y / size) * frequency * 4 + octave * 100;

                // Pseudo-random value
                const noise = Math.sin(sampleX * 12.9898 + sampleY * 78.233) * 43758.5453;
                const randomValue = noise - Math.floor(noise);

                value += randomValue * amplitude;
                maxAmplitude += amplitude;

                amplitude *= 0.5;
                frequency *= 2;
            }

            noiseMap[y * size + x] = value / maxAmplitude;
            maxVal = Math.max(maxVal, value / maxAmplitude);
        }
    }

    // Add crater pattern
    const craterCount = Math.floor(size * size / 2000);
    for (let c = 0; c < craterCount; c++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const radius = Math.random() * 20 + 5;
        const depth = Math.random() * 0.3 + 0.1;

        for (let y = Math.max(0, cy - radius); y < Math.min(size, cy + radius); y++) {
            for (let x = Math.max(0, cx - radius); x < Math.min(size, cx + radius); x++) {
                const dist = Math.hypot(x - cx, y - cy);
                if (dist < radius) {
                    const falloff = 1 - (dist / radius);
                    noiseMap[y * size + x] -= falloff * depth * 0.5;
                }
            }
        }
    }

    // Convert to canvas
    for (let i = 0; i < size * size; i++) {
        const val = Math.max(0, Math.min(1, (noiseMap[i] + 0.5) / 1.5)) * 255;
        data[i * 4] = val;
        data[i * 4 + 1] = val;
        data[i * 4 + 2] = val;
        data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

export default function MoonGlobe({ open, onClose }) {
    const mountRef = useRef(null);
    const sceneRef = useRef({});
    const { t } = useTranslation();
    const [moonInfo, setMoonInfo] = useState({
        phase: 0,
        illumination: 0,
        distance: 0,
        nextFullMoon: null,
        nextNewMoon: null,
        librationLat: 0,
        librationLon: 0,
    });
    const [showSites, setShowSites] = useState(true);
    const appStore = useAppStore();

    // Get current moon phase and info
    const updateMoonInfo = useCallback(() => {
        try {
            const now = new Date();
            const observer = new Astronomy.Observer(
                appStore.latitude || 0,
                appStore.longitude || 0,
                appStore.elevation || 0
            );

            // Moon position
            const moon = Astronomy.GeoMoon(now);
            const moonInfo = Astronomy.Illumination('Moon', now);
            const distance = Astronomy.Distance('Moon', now);

            // Next phases
            let nextFull = null;
            let nextNew = null;

            for (let days = 1; days <= 30; days++) {
                const checkDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
                const checkPhase = Astronomy.MoonPhase(checkDate);

                if (!nextFull && Math.abs(checkPhase - 100) < 5) nextFull = checkDate;
                if (!nextNew && Math.abs(checkPhase) < 5) nextNew = checkDate;

                if (nextFull && nextNew) break;
            }

            // Libration (simplified)
            const phase = Astronomy.MoonPhase(now) / 100;

            setMoonInfo({
                phase,
                illumination: Astronomy.MoonPhase(now),
                distance: distance.km,
                nextFullMoon: nextFull,
                nextNewMoon: nextNew,
                librationLat: Math.sin(phase * Math.PI * 2) * 5.3,
                librationLon: Math.sin((phase - 0.25) * Math.PI * 2) * 7.9,
            });
        } catch (e) {
            console.warn('Moon info calculation:', e);
        }
    }, [appStore.latitude, appStore.longitude, appStore.elevation]);

    // Update every minute
    useEffect(() => {
        updateMoonInfo();
        const interval = setInterval(updateMoonInfo, 60000);
        return () => clearInterval(interval);
    }, [updateMoonInfo]);

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
        camera.position.set(0, 1.5, 6);
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
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        // Stars background
        const starCount = 6000;
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 70 + Math.random() * 30;
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);
            starSizes[i] = 0.4 + Math.random() * 1.5;
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeom.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.12,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.7,
        });
        scene.add(new THREE.Points(starGeom, starMat));

        // Create moon height map
        const heightMap = createMoonHeightMap(512);

        // Moon material with shaders
        const moonMaterial = new THREE.ShaderMaterial({
            vertexShader: MOON_VERTEX,
            fragmentShader: MOON_FRAGMENT,
            uniforms: {
                heightMap: { value: heightMap },
                sunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
                phase: { value: moonInfo.phase },
            },
            side: THREE.FrontSide,
        });

        // Moon geometry
        const moonGeom = new THREE.IcosahedronGeometry(2, 64);
        const moon = new THREE.Mesh(moonGeom, moonMaterial);
        moon.rotation.x = THREE.MathUtils.degToRad(1.54); // Inclination
        scene.add(moon);

        // Glow sphere (larger, subtle)
        const glowMaterial = new THREE.ShaderMaterial({
            vertexShader: GLOW_VERTEX,
            fragmentShader: GLOW_FRAGMENT,
            uniforms: {
                sunDir: { value: new THREE.Vector3(1, 0.2, 0.5).normalize() },
            },
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });
        const glowGeom = new THREE.IcosahedronGeometry(2.05, 32);
        const glow = new THREE.Mesh(glowGeom, glowMaterial);
        glow.rotation.copy(moon.rotation);
        scene.add(glow);

        // Landing site markers
        const siteGroup = new THREE.Group();
        moon.add(siteGroup);

        LANDING_SITES.forEach(site => {
            const latRad = THREE.MathUtils.degToRad(site.lat);
            const lonRad = THREE.MathUtils.degToRad(site.lon);

            // Position on sphere
            const x = 2 * Math.cos(latRad) * Math.cos(lonRad);
            const y = 2 * Math.sin(latRad);
            const z = -2 * Math.cos(latRad) * Math.sin(lonRad);

            // Marker sphere
            const markerGeom = new THREE.SphereGeometry(0.08, 16, 16);
            const markerMat = new THREE.MeshBasicMaterial({
                color: site.type === 'Apollo' ? 0x00ff88 : (site.type === 'Luna' ? 0xffaa00 : 0x4488ff),
                emissive: site.type === 'Apollo' ? 0x00ff88 : (site.type === 'Luna' ? 0xffaa00 : 0x4488ff),
            });
            const marker = new THREE.Mesh(markerGeom, markerMat);
            marker.position.set(x, y, z);
            marker.userData = site;
            siteGroup.add(marker);
        });

        // Lighting
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(5, 3, 4);
        sunLight.castShadow = false;
        scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        // Mouse controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotationVelocity = { x: 0, y: 0 };

        const onMouseDown = (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotationVelocity.x = deltaY * 0.005;
            rotationVelocity.y = deltaX * 0.005;

            moon.rotation.x += rotationVelocity.x;
            moon.rotation.y += rotationVelocity.y;
            glow.rotation.copy(moon.rotation);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onWheel = (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            if (e.deltaY > 0) {
                camera.position.multiplyScalar(1 + zoomSpeed);
            } else {
                camera.position.multiplyScalar(1 - zoomSpeed);
            }
        };

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        renderer.domElement.addEventListener('mouseleave', onMouseUp);

        // Animation loop
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            // Apply velocity damping
            if (!isDragging) {
                rotationVelocity.x *= 0.95;
                rotationVelocity.y *= 0.95;
                moon.rotation.x += rotationVelocity.x;
                moon.rotation.y += rotationVelocity.y;
                glow.rotation.copy(moon.rotation);
            }

            // Subtle libration animation
            const librationScale = 0.02;
            moon.rotation.x += Math.sin(Date.now() * 0.0001) * librationScale;
            moon.rotation.z += Math.cos(Date.now() * 0.0001) * librationScale * 0.5;
            glow.rotation.copy(moon.rotation);

            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        sceneRef.current = {
            scene,
            camera,
            renderer,
            moon,
            glow,
            siteGroup,
        };

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('mouseleave', onMouseUp);

            cancelAnimationFrame(animationFrameId);
            container.removeChild(renderer.domElement);
            moonGeom.dispose();
            glowGeom.dispose();
            moonMaterial.dispose();
            glowMaterial.dispose();
            heightMap.dispose();
            starGeom.dispose();
            starMat.dispose();
            renderer.dispose();
        };
    }, [open, moonInfo.phase]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
            {/* Canvas container */}
            <div
                ref={mountRef}
                className="w-full h-full"
                style={{ background: '#0a0e27' }}
            />

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <span className="text-xl text-white/70 hover:text-white">✕</span>
            </button>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none">
                <h2 className="text-3xl font-bold text-white tracking-wider">
                    LUNAR OBSERVATORY
                </h2>
                <p className="text-sm text-white/50 mt-1">
                    Interactive Moon • Real-time Phase
                </p>
            </div>

            {/* Left info panel */}
            <div className="absolute bottom-0 left-0 top-0 w-64 bg-gradient-to-r from-black via-black to-transparent p-6 z-10 overflow-y-auto flex flex-col justify-between">
                <div>
                    {/* Moon phase card */}
                    <div className="mb-6 p-4 rounded-lg border border-cosmos-accent/20 bg-cosmos-accent/5">
                        <div className="text-xs text-white/50 uppercase tracking-widest mb-3">
                            Current Phase
                        </div>

                        {/* Phase visualization */}
                        <div className="flex items-center justify-center mb-4">
                            <div className="relative w-20 h-20">
                                <svg viewBox="0 0 40 40" className="w-full h-full">
                                    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                    {/* Illuminated portion */}
                                    <circle
                                        cx="20"
                                        cy="20"
                                        r="18"
                                        fill="white"
                                        opacity={moonInfo.illumination / 100}
                                        style={{
                                            clipPath: `polygon(0% 0%, ${Math.min(100, (moonInfo.illumination / 100) * 100 + 50)}% 0%, ${Math.min(100, (moonInfo.illumination / 100) * 100 + 50)}% 100%, 0% 100%)`,
                                        }}
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-1">
                                {moonInfo.illumination.toFixed(1)}%
                            </div>
                            <div className="text-xs text-white/60">Illumination</div>
                        </div>
                    </div>

                    {/* Moon data */}
                    <div className="space-y-3 text-sm">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                                Distance
                            </div>
                            <div className="text-white font-mono">
                                {(moonInfo.distance / 1000).toFixed(0)} km
                            </div>
                        </div>

                        {moonInfo.nextFullMoon && (
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                                    Next Full Moon
                                </div>
                                <div className="text-white font-mono text-xs">
                                    {moonInfo.nextFullMoon.toLocaleDateString()}
                                </div>
                            </div>
                        )}

                        {moonInfo.nextNewMoon && (
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                                    Next New Moon
                                </div>
                                <div className="text-white font-mono text-xs">
                                    {moonInfo.nextNewMoon.toLocaleDateString()}
                                </div>
                            </div>
                        )}

                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                                Libration (Lat/Lon)
                            </div>
                            <div className="text-white font-mono text-xs">
                                {moonInfo.librationLat.toFixed(2)}° / {moonInfo.librationLon.toFixed(2)}°
                            </div>
                        </div>
                    </div>

                    {/* Landing sites */}
                    <div className="mt-6">
                        <div className="text-xs text-white/50 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Landing Sites ({LANDING_SITES.length})</span>
                            <button
                                onClick={() => setShowSites(!showSites)}
                                className="text-white/40 hover:text-white transition-colors"
                            >
                                {showSites ? '−' : '+'}
                            </button>
                        </div>

                        {showSites && (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {LANDING_SITES.map((site) => (
                                    <div
                                        key={site.name}
                                        className="px-2 py-1.5 rounded text-xs border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <div className="font-semibold text-white">{site.name}</div>
                                        <div className="text-white/50 text-[10px]">
                                            {site.lat.toFixed(2)}°, {site.lon.toFixed(2)}° • {site.year}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer info */}
                <div className="text-[10px] text-white/40 border-t border-white/10 pt-4">
                    <p>Drag to rotate • Scroll to zoom</p>
                    <p className="mt-2 leading-relaxed">
                        Click landing site markers for details. Libration values show the Moon's nodding motion relative to Earth.
                    </p>
                </div>
            </div>

            {/* Footer controls hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <p className="text-xs text-white/30 text-center">
                    Drag to rotate &bull; Scroll to zoom
                </p>
            </div>
        </div>
    );
}
