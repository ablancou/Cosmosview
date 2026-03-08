import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { raDecToCartesian } from '../utils/coordinates';
import starVertShader from '../shaders/star.vert.glsl?raw';
import starFragShader from '../shaders/star.frag.glsl?raw';

/**
 * FaintStarField — 95,000 procedurally generated faint stars (mag 6.5–10.0).
 * 
 * Stars are distributed following a realistic galactic model:
 * - Higher density near the galactic plane (Milky Way band)
 * - Galactic center bulge has extra density
 * - Realistic B-V color distribution by magnitude
 * - LOD: only rendered when FOV < 60° (hidden when zoomed out)
 * 
 * This fills the sky with thousands of additional stars visible
 * when zooming in, creating a Stellarium-quality starfield.
 */

const FAINT_STAR_COUNT = 95000;

// Seeded PRNG for deterministic star field
function createPRNG(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
    };
}

// Convert galactic coordinates to equatorial (RA/Dec)
function galacticToEquatorial(l, b) {
    const lRad = l * Math.PI / 180;
    const bRad = b * Math.PI / 180;

    // North Galactic Pole: RA=192.85948°, Dec=27.12825°
    const raGP = 192.85948 * Math.PI / 180;
    const decGP = 27.12825 * Math.PI / 180;
    const lNCP = 122.93192 * Math.PI / 180;

    const sinDec = Math.sin(bRad) * Math.sin(decGP) +
        Math.cos(bRad) * Math.cos(decGP) * Math.sin(lRad - lNCP);
    const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));

    const y = Math.cos(bRad) * Math.cos(lRad - lNCP);
    const x = Math.sin(bRad) * Math.cos(decGP) -
        Math.cos(bRad) * Math.sin(decGP) * Math.sin(lRad - lNCP);
    let ra = raGP + Math.atan2(y, x);

    // Normalize RA to [0, 2π]
    ra = ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return {
        ra: ra * 12 / Math.PI, // Convert to hours
        dec: dec * 180 / Math.PI, // Convert to degrees
    };
}

// Get star color from B-V color index
function bvToColor(bv) {
    // Approximate color mapping
    let r, g, b;
    if (bv < -0.2) { // Hot blue
        r = 0.6; g = 0.7; b = 1.0;
    } else if (bv < 0.0) { // Blue-white
        r = 0.7; g = 0.8; b = 1.0;
    } else if (bv < 0.3) { // White
        r = 0.9; g = 0.9; b = 1.0;
    } else if (bv < 0.6) { // Yellow-white
        r = 1.0; g = 0.95; b = 0.85;
    } else if (bv < 1.0) { // Yellow
        r = 1.0; g = 0.85; b = 0.6;
    } else if (bv < 1.4) { // Orange
        r = 1.0; g = 0.7; b = 0.4;
    } else { // Red
        r = 1.0; g = 0.5; b = 0.3;
    }
    return { r, g, b };
}

export default function FaintStarField({ scene, camera }) {
    const pointsRef = useRef(null);
    const materialRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const rand = createPRNG(12345);

        // Generate star positions using galactic coordinate model
        const positions = new Float32Array(FAINT_STAR_COUNT * 3);
        const colors = new Float32Array(FAINT_STAR_COUNT * 3);
        const magnitudes = new Float32Array(FAINT_STAR_COUNT);
        const indices = new Float32Array(FAINT_STAR_COUNT);

        for (let i = 0; i < FAINT_STAR_COUNT; i++) {
            // Galactic longitude: uniform [0, 360]
            const l = rand() * 360;

            // Galactic latitude: concentrated near plane
            // Use a mixture model: 70% thin disk, 20% thick disk, 10% halo
            let b;
            const diskChoice = rand();
            if (diskChoice < 0.70) {
                // Thin disk: narrow Gaussian, σ ≈ 8°
                b = gaussianRand(rand) * 8;
            } else if (diskChoice < 0.90) {
                // Thick disk: wider Gaussian, σ ≈ 25°
                b = gaussianRand(rand) * 25;
            } else {
                // Halo: uniform across sky
                b = (rand() - 0.5) * 180;
            }
            b = Math.max(-90, Math.min(90, b));

            // Extra density boost near galactic center (l ≈ 0°)
            const distFromCenter = Math.min(Math.abs(l), Math.abs(l - 360));
            if (distFromCenter < 30 && Math.abs(b) < 15) {
                // Galactic bulge: shift latitude closer to center
                b *= 0.6;
            }

            // Convert to equatorial
            const eq = galacticToEquatorial(l, b);

            // Place on celestial sphere
            const pos = raDecToCartesian(eq.ra, eq.dec, 895);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            // Magnitude: exponential distribution (more faint stars)
            // mag 6.5 to 10.0
            const mag = 6.5 + rand() * rand() * 3.5; // Skewed toward fainter
            magnitudes[i] = mag;

            // B-V color index: distribute realistically
            // Fainter stars tend to be redder (more K/M dwarfs)
            const bv = -0.2 + rand() * 1.8 + (mag - 6.5) * 0.1;
            const col = bvToColor(bv);
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            indices[i] = i + 10000; // Offset to avoid collision with catalog stars
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aMagnitude', new THREE.BufferAttribute(magnitudes, 1));
        geometry.setAttribute('aStarIndex', new THREE.BufferAttribute(indices, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uHoveredIndex: { value: -1 },
                uFOV: { value: camera ? camera.fov : 70 },
                uOpacity: { value: 0.0 }, // Start invisible, fade in with zoom
            },
            vertexShader: starVertShader,
            fragmentShader: starFragShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        materialRef.current = material;

        const points = new THREE.Points(geometry, material);
        points.renderOrder = 9; // Below catalog stars (10)
        scene.add(points);
        pointsRef.current = points;

        // Animation loop — update time and LOD opacity
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            material.uniforms.uTime.value += 0.016;

            if (camera) {
                material.uniforms.uFOV.value = camera.fov;
                // LOD: fade in faint stars as user zooms in
                // Full visibility at FOV ≤ 40°, hidden at FOV ≥ 65°
                const fov = camera.fov;
                const opacity = fov <= 40 ? 1.0 : fov >= 65 ? 0.0 : (65 - fov) / 25;
                material.uniforms.uOpacity.value = opacity;
                points.visible = opacity > 0.01;
            }
        };
        animate();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(points);
            geometry.dispose();
            material.dispose();
        };
    }, [scene]);

    return null;
}

// Box-Muller transform for Gaussian random
function gaussianRand(rand) {
    const u1 = rand();
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}
