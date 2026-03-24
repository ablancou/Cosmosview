import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * High-quality procedural starfield background.
 * Generates a 4096x2048 canvas texture with thousands of faint background stars,
 * nebula-colored regions, and Milky Way glow — all at crisp resolution.
 *
 * This replaces the low-res NASA JPEG to eliminate pixelation.
 * Fully procedural — no external assets, no attribution needed.
 */
export default function ProceduralSkybox({ scene }) {
    const meshRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        // Detect max texture size — iOS limits to 4096, some older devices to 2048
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const maxSize = isMobile ? 2048 : 4096;
        const WIDTH = maxSize * 2;
        const HEIGHT = maxSize;

        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        // === Background: deep space gradient ===
        ctx.fillStyle = '#030308';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // === Milky Way band ===
        for (let pass = 0; pass < 3; pass++) {
            const opacity = [0.12, 0.08, 0.06][pass];
            const spread = [400, 280, 550][pass]; // Wider bands for 8K

            for (let x = 0; x < WIDTH; x += 2) {
                const ra = (x / WIDTH) * 360;
                const galacticDec = -29 + 63 * Math.sin((ra - 266 + 90) * Math.PI / 180);
                const yCenter = ((90 - galacticDec) / 180) * HEIGHT;

                for (let y = 0; y < HEIGHT; y += 2) {
                    const dist = Math.abs(y - yCenter);
                    if (dist < spread) {
                        const brightness = (1 - dist / spread);
                        const b = brightness * brightness;

                        const noise1 = Math.sin(x * 0.01 + y * 0.005) * 0.5 + 0.5;
                        const noise2 = Math.sin(x * 0.0025 + y * 0.0015) * 0.5 + 0.5;
                        const noise3 = Math.sin(x * 0.025 + pass) * Math.cos(y * 0.02) * 0.5 + 0.5;
                        const noise4 = Math.sin(x * 0.004 + y * 0.006 + pass * 2) * 0.5 + 0.5; // Extra detail
                        const detail = (noise1 * 0.3 + noise2 * 0.3 + noise3 * 0.2 + noise4 * 0.2);

                        const alpha = b * opacity * (0.5 + detail * 0.5);

                        if (alpha > 0.003) {
                            const warmth = Math.sin(x * 0.0015 + pass) * 0.5 + 0.5;
                            const r = Math.round(180 + warmth * 40);
                            const g = Math.round(170 + warmth * 20);
                            const blue = Math.round(200 - warmth * 10);

                            ctx.fillStyle = `rgba(${r}, ${g}, ${blue}, ${alpha})`;
                            ctx.fillRect(x, y, 2, 2);
                        }
                    }
                }
            }
        }

        // === Nebula color patches — MUCH more visible ===
        const nebulaRegions = [
            { x: 0.31, y: 0.53, r: 140, g: 55, b: 80, radius: 320, alpha: 0.09 },
            { x: 0.75, y: 0.63, r: 80, g: 65, b: 130, radius: 380, alpha: 0.08 },
            { x: 0.15, y: 0.35, r: 55, g: 75, b: 120, radius: 250, alpha: 0.06 },
            { x: 0.85, y: 0.55, r: 120, g: 45, b: 55, radius: 280, alpha: 0.07 },
            { x: 0.55, y: 0.48, r: 50, g: 90, b: 110, radius: 350, alpha: 0.06 },
            { x: 0.42, y: 0.42, r: 80, g: 45, b: 110, radius: 220, alpha: 0.06 },
            { x: 0.68, y: 0.38, r: 100, g: 65, b: 75, radius: 260, alpha: 0.05 },
            { x: 0.22, y: 0.65, r: 60, g: 55, b: 120, radius: 240, alpha: 0.06 },
            { x: 0.05, y: 0.50, r: 70, g: 50, b: 100, radius: 200, alpha: 0.04 },
            { x: 0.92, y: 0.40, r: 110, g: 55, b: 65, radius: 220, alpha: 0.05 },
            { x: 0.48, y: 0.60, r: 60, g: 80, b: 100, radius: 180, alpha: 0.04 },
            { x: 0.35, y: 0.30, r: 90, g: 40, b: 90, radius: 200, alpha: 0.04 },
        ];

        nebulaRegions.forEach((neb) => {
            const cx = neb.x * WIDTH;
            const cy = neb.y * HEIGHT;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, neb.radius);
            gradient.addColorStop(0, `rgba(${neb.r}, ${neb.g}, ${neb.b}, ${neb.alpha})`);
            gradient.addColorStop(0.3, `rgba(${neb.r}, ${neb.g}, ${neb.b}, ${neb.alpha * 0.6})`);
            gradient.addColorStop(0.6, `rgba(${neb.r}, ${neb.g}, ${neb.b}, ${neb.alpha * 0.2})`);
            gradient.addColorStop(1, `rgba(${neb.r}, ${neb.g}, ${neb.b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - neb.radius, cy - neb.radius, neb.radius * 2, neb.radius * 2);
        });

        // === Background stars — 8K density ===
        let seed = 42;
        const seededRandom = () => {
            seed = (seed * 16807 + 0) % 2147483647;
            return seed / 2147483647;
        };

        // Layer 1: Faint tiny stars (60K for 8K resolution)
        for (let i = 0; i < 60000; i++) {
            const x = seededRandom() * WIDTH;
            const y = seededRandom() * HEIGHT;
            const size = seededRandom() * 1.2 + 0.4;
            const brightness = seededRandom() * 0.3 + 0.05;

            const colorRand = seededRandom();
            let r, g, b;
            if (colorRand < 0.15) {
                r = 255; g = Math.round(180 + seededRandom() * 60); b = Math.round(140 + seededRandom() * 40);
            } else if (colorRand < 0.3) {
                r = Math.round(170 + seededRandom() * 40); g = Math.round(190 + seededRandom() * 40); b = 255;
            } else {
                r = Math.round(220 + seededRandom() * 35);
                g = Math.round(220 + seededRandom() * 35);
                b = Math.round(230 + seededRandom() * 25);
            }

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Layer 2: Medium stars (12K)
        for (let i = 0; i < 12000; i++) {
            const x = seededRandom() * WIDTH;
            const y = seededRandom() * HEIGHT;
            const size = seededRandom() * 1.5 + 1;
            const brightness = seededRandom() * 0.5 + 0.15;

            const colorRand = seededRandom();
            let r, g, b;
            if (colorRand < 0.2) {
                r = 255; g = Math.round(200 + seededRandom() * 40); b = Math.round(160 + seededRandom() * 50);
            } else if (colorRand < 0.35) {
                r = Math.round(180 + seededRandom() * 50); g = Math.round(200 + seededRandom() * 40); b = 255;
            } else {
                r = Math.round(240 + seededRandom() * 15);
                g = Math.round(240 + seededRandom() * 15);
                b = Math.round(245 + seededRandom() * 10);
            }

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
        }

        // Layer 3: Bright stars with glow (800)
        for (let i = 0; i < 800; i++) {
            const x = seededRandom() * WIDTH;
            const y = seededRandom() * HEIGHT;
            const size = seededRandom() * 2.5 + 2;
            const brightness = seededRandom() * 0.7 + 0.3;

            const r = Math.round(230 + seededRandom() * 25);
            const g = Math.round(235 + seededRandom() * 20);
            const b = Math.round(245 + seededRandom() * 10);

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness})`);
            gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${brightness * 0.4})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);
        }

        // === Create Three.js texture ===
        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;

        const geometry = new THREE.SphereGeometry(960, 128, 64);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: false,
            depthWrite: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = -1;
        mesh.scale.x = -1;
        scene.add(mesh);
        meshRef.current = mesh;

        return () => {
            if (meshRef.current) {
                scene.remove(meshRef.current);
                meshRef.current.material.map.dispose();
                meshRef.current.material.dispose();
                meshRef.current.geometry.dispose();
            }
        };
    }, [scene]);

    return null;
}
