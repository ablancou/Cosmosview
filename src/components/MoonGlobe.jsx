import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * MoonGlobe — 3D Moon with procedural surface texture,
 * real-time phase lighting, landing site markers, and info panel.
 */

const LANDING_SITES = [
    { name: 'Apollo 11', lat: 0.67, lon: 23.47, type: 'apollo', year: 1969 },
    { name: 'Apollo 12', lat: -3.01, lon: -23.42, type: 'apollo', year: 1969 },
    { name: 'Apollo 14', lat: -3.65, lon: -17.47, type: 'apollo', year: 1971 },
    { name: 'Apollo 15', lat: 26.13, lon: 3.63, type: 'apollo', year: 1971 },
    { name: 'Apollo 16', lat: -8.97, lon: 15.50, type: 'apollo', year: 1972 },
    { name: 'Apollo 17', lat: 20.19, lon: 30.77, type: 'apollo', year: 1972 },
    { name: 'Luna 2', lat: 29.1, lon: 0.0, type: 'luna', year: 1959 },
    { name: 'Luna 9', lat: -7.13, lon: -64.37, type: 'luna', year: 1966 },
    { name: 'Luna 17', lat: 38.28, lon: -35.0, type: 'luna', year: 1970 },
    { name: 'Luna 21', lat: 25.85, lon: 30.86, type: 'luna', year: 1973 },
    { name: "Chang'e 3", lat: 44.12, lon: -19.51, type: 'change', year: 2013 },
    { name: "Chang'e 4", lat: -45.46, lon: 177.6, type: 'change', year: 2019 },
    { name: "Chang'e 5", lat: 43.06, lon: -51.92, type: 'change', year: 2020 },
];

const TYPE_COLORS = {
    apollo: 0x22dd77,
    luna: 0xffaa33,
    change: 0x4499ff,
};

/* ═══ Procedural Moon Texture ═══ */
function createMoonTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Seed-based pseudo-random
    const seed = (x, y) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return n - Math.floor(n);
    };

    // Value noise with interpolation
    const noise = (px, py, freq) => {
        const x = px * freq, y = py * freq;
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = seed(ix, iy), b = seed(ix + 1, iy);
        const c = seed(ix, iy + 1), d = seed(ix + 1, iy + 1);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };

    // Multi-octave noise
    const fbm = (px, py, octaves = 6) => {
        let val = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            val += noise(px, py, freq * 4) * amp;
            amp *= 0.5;
            freq *= 2.1;
        }
        return val;
    };

    const imageData = ctx.createImageData(size, size);
    const d = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / size, v = y / size;
            const idx = (y * size + x) * 4;

            // Large-scale mare/highland
            const mare = fbm(u + 0.5, v + 0.3, 3);
            const isMare = mare < 0.42 ? 1 : 0;

            // Base brightness
            let bright = isMare ? 0.28 + mare * 0.3 : 0.62 + fbm(u, v, 5) * 0.25;

            // Crater overlay
            const craterNoise = fbm(u + 2.7, v + 1.3, 6);
            const craterEdge = Math.abs(craterNoise - 0.5);
            if (craterEdge < 0.05) bright += 0.12; // rim highlight
            if (craterEdge > 0.15 && craterEdge < 0.2) bright -= 0.06; // shadow

            // Fine detail
            bright += (noise(u, v, 80) - 0.5) * 0.08;
            bright += (noise(u, v, 160) - 0.5) * 0.04;

            const r = Math.max(0, Math.min(255, bright * 255));
            const g = Math.max(0, Math.min(255, bright * 250));
            const b = Math.max(0, Math.min(255, bright * 245));

            d[idx] = r;
            d[idx + 1] = g;
            d[idx + 2] = b;
            d[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Add some larger circular craters
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 60; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const cr = 3 + Math.random() * 30;
        const grad = ctx.createRadialGradient(cx, cy, cr * 0.3, cx, cy, cr);
        grad.addColorStop(0, `rgba(80,78,75,${0.3 + Math.random() * 0.4})`);
        grad.addColorStop(0.7, `rgba(140,138,134,${0.1 + Math.random() * 0.2})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
    }

    // Rim highlights
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 40; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const cr = 5 + Math.random() * 20;
        ctx.strokeStyle = `rgba(200,198,190,${0.05 + Math.random() * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();
    }

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

            // Phase angle in degrees (0 = new, 180 = full)
            const phaseDeg = Astronomy.MoonPhase(now);

            // Illumination: fraction lit (0 to 1)
            const illum = Astronomy.Illumination('Moon', now);
            const illumination = illum.phase_fraction !== undefined
                ? illum.phase_fraction * 100
                : (1 - Math.cos(phaseDeg * Math.PI / 180)) / 2 * 100;

            // Distance
            const eqPos = Astronomy.GeoMoon(now);
            const distAU = Math.sqrt(eqPos.x ** 2 + eqPos.y ** 2 + eqPos.z ** 2);
            const distanceKm = Math.round(distAU * 149597870.7);

            // Libration (simplified geometric model)
            const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
            const libLat = 6.7 * Math.sin((dayOfYear / 27.3) * 2 * Math.PI);
            const libLon = 7.9 * Math.sin((dayOfYear / 27.3 - 0.25) * 2 * Math.PI);

            setMoonData({
                phaseDeg,
                phaseName: getPhaseName(phaseDeg),
                illumination,
                distanceKm,
                libLat,
                libLon,
            });

            return phaseDeg;
        } catch (e) {
            console.warn('Moon calc error:', e);
            return 0;
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
        const starCount = 3000;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);
            const r = 60 + Math.random() * 40;
            starPos[i * 3] = r * Math.sin(p) * Math.cos(t);
            starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
            starPos[i * 3 + 2] = r * Math.cos(p);
        }
        const starGeom = new THREE.BufferGeometry();
        starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({
            color: 0xffffff, size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.6,
        })));

        // Moon texture
        const moonTexture = createMoonTexture(1024);

        // Moon sphere — using MeshStandardMaterial (reliable, no shader bugs)
        const moonGeom = new THREE.SphereGeometry(2, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({
            map: moonTexture,
            roughness: 0.95,
            metalness: 0.0,
            bumpMap: moonTexture,
            bumpScale: 0.03,
        });
        const moon = new THREE.Mesh(moonGeom, moonMat);
        moon.rotation.x = THREE.MathUtils.degToRad(1.54);
        scene.add(moon);

        // Compute sun direction from phase
        const phaseDeg = computeMoonData() || 0;
        const phaseRad = (phaseDeg * Math.PI) / 180;
        const sunDir = new THREE.Vector3(
            Math.cos(phaseRad),
            0.15,
            Math.sin(phaseRad)
        ).normalize();

        // Directional light (the Sun)
        const sunLight = new THREE.DirectionalLight(0xfff8e8, 2.0);
        sunLight.position.copy(sunDir.multiplyScalar(20));
        scene.add(sunLight);

        // Very dim ambient for the dark side
        scene.add(new THREE.AmbientLight(0x222244, 0.08));

        // Subtle rim glow
        const glowGeom = new THREE.SphereGeometry(2.06, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.04,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(glowGeom, glowMat));

        // Landing site markers — small pins, not huge spheres
        const siteGroup = new THREE.Group();
        LANDING_SITES.forEach((site) => {
            const lat = THREE.MathUtils.degToRad(site.lat);
            const lon = THREE.MathUtils.degToRad(site.lon);
            const R = 2.02; // slightly above surface

            const x = R * Math.cos(lat) * Math.sin(lon);
            const y = R * Math.sin(lat);
            const z = R * Math.cos(lat) * Math.cos(lon);

            // Small dot marker
            const mGeom = new THREE.SphereGeometry(0.025, 8, 8);
            const mMat = new THREE.MeshBasicMaterial({ color: TYPE_COLORS[site.type] || 0xffffff });
            const marker = new THREE.Mesh(mGeom, mMat);
            marker.position.set(x, y, z);
            siteGroup.add(marker);

            // Tiny ring around it
            const ringGeom = new THREE.RingGeometry(0.035, 0.045, 16);
            const ringMat = new THREE.MeshBasicMaterial({
                color: TYPE_COLORS[site.type] || 0xffffff,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.position.set(x, y, z);
            ring.lookAt(0, 0, 0); // face outward from center
            siteGroup.add(ring);
        });
        moon.add(siteGroup);

        // Interaction
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        let velocity = { x: 0, y: 0 };

        const onDown = (e) => {
            isDragging = true;
            const pt = e.touches ? e.touches[0] : e;
            prevMouse = { x: pt.clientX, y: pt.clientY };
            velocity = { x: 0, y: 0 };
        };
        const onMove = (e) => {
            if (!isDragging) return;
            const pt = e.touches ? e.touches[0] : e;
            const dx = pt.clientX - prevMouse.x;
            const dy = pt.clientY - prevMouse.y;
            velocity = { x: dy * 0.004, y: dx * 0.004 };
            moon.rotation.x += velocity.x;
            moon.rotation.y += velocity.y;
            prevMouse = { x: pt.clientX, y: pt.clientY };
        };
        const onUp = () => { isDragging = false; };
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
        el.addEventListener('mouseleave', onUp);
        el.addEventListener('touchstart', onDown, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: true });
        el.addEventListener('touchend', onUp);
        el.addEventListener('wheel', onWheel, { passive: false });

        // Animate
        let frameId;
        const animate = () => {
            frameId = requestAnimationFrame(animate);

            if (!isDragging) {
                // Inertia
                velocity.x *= 0.96;
                velocity.y *= 0.96;
                moon.rotation.x += velocity.x;
                moon.rotation.y += velocity.y;

                // Very slow auto-rotate when idle
                if (Math.abs(velocity.y) < 0.0005) {
                    moon.rotation.y += 0.0005;
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const onResize = () => {
            const w = container.clientWidth, h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        threeRef.current = { renderer, scene, camera, moon };

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
            glowGeom.dispose();
            glowMat.dispose();
            starGeom.dispose();
            renderer.dispose();
        };
    }, [open]);

    if (!open) return null;

    const phaseEmoji = moonData.phaseDeg < 45 ? '🌑' :
        moonData.phaseDeg < 90 ? '🌒' :
        moonData.phaseDeg < 135 ? '🌓' :
        moonData.phaseDeg < 180 ? '🌔' :
        moonData.phaseDeg < 225 ? '🌕' :
        moonData.phaseDeg < 270 ? '🌖' :
        moonData.phaseDeg < 315 ? '🌗' : '🌘';

    return (
        <div className="fixed inset-0 z-50 flex" style={{ background: '#060610' }}>

            {/* ═══ Left Panel ═══ */}
            <div
                className="relative z-10 w-72 shrink-0 flex flex-col overflow-y-auto"
                style={{
                    background: 'linear-gradient(135deg, rgba(10,12,30,0.98), rgba(6,8,20,0.98))',
                    borderRight: '1px solid rgba(126,184,247,0.08)',
                }}
            >
                {/* Title */}
                <div className="p-5 pb-2">
                    <h2 className="text-xl font-bold text-white tracking-wider leading-tight">
                        {phaseEmoji} LUNAR<br />OBSERVATORY
                    </h2>
                    <p className="text-[10px] text-white/40 mt-1">Interactive 3D Moon &bull; Real-time Phase</p>
                </div>

                {/* Phase card */}
                <div className="mx-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Current Phase</div>
                    <div className="flex items-center gap-4">
                        {/* Phase circle */}
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
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {LANDING_SITES.map((s) => (
                                <div
                                    key={s.name}
                                    className="px-2.5 py-1.5 rounded-md text-[10px] border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-default"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: `#${TYPE_COLORS[s.type].toString(16).padStart(6, '0')}` }}
                                        />
                                        <span className="font-semibold text-white">{s.name}</span>
                                    </div>
                                    <div className="text-white/35 mt-0.5 pl-4">
                                        {s.lat.toFixed(2)}°, {s.lon.toFixed(2)}° &bull; {s.year}
                                    </div>
                                </div>
                            ))}
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
                    Drag to rotate &bull; Scroll to zoom
                </div>
            </div>

            {/* ═══ 3D Canvas ═══ */}
            <div
                ref={canvasContainerRef}
                className="flex-1 relative cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
            />

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
