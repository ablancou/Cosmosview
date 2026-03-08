import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { raDecToCartesian } from '../utils/coordinates';

/**
 * Renders soft glow sprites at real positions of famous deep-sky objects.
 * Makes the sky feel alive with subtle nebula and galaxy glows.
 * All positions from publicly available astronomical data.
 */

const DEEP_SKY_OBJECTS = [
    // Name, RA (hours), Dec (degrees), size, color, brightness
    { name: 'Orion Nebula', ra: 5.588, dec: -5.39, size: 45, color: 0xff6688, brightness: 0.35 },
    { name: 'Pleiades', ra: 3.791, dec: 24.105, size: 60, color: 0x8899dd, brightness: 0.25 },
    { name: 'Andromeda Galaxy', ra: 0.712, dec: 41.269, size: 80, color: 0xaabb99, brightness: 0.20 },
    { name: 'Carina Nebula', ra: 10.733, dec: -59.867, size: 50, color: 0xff8844, brightness: 0.30 },
    { name: 'Lagoon Nebula', ra: 18.063, dec: -24.383, size: 35, color: 0xff5566, brightness: 0.25 },
    { name: 'Eagle Nebula', ra: 18.313, dec: -13.783, size: 30, color: 0xdd7788, brightness: 0.20 },
    { name: 'Trifid Nebula', ra: 18.038, dec: -23.033, size: 25, color: 0xcc6688, brightness: 0.18 },
    { name: 'Omega Centauri', ra: 13.447, dec: -47.479, size: 40, color: 0xddcc88, brightness: 0.22 },
    { name: 'Large Magellanic Cloud', ra: 5.392, dec: -69.756, size: 100, color: 0xbbaacc, brightness: 0.30 },
    { name: 'Small Magellanic Cloud', ra: 0.877, dec: -72.816, size: 50, color: 0xaabbcc, brightness: 0.20 },
    { name: 'Eta Carinae', ra: 10.752, dec: -59.684, size: 20, color: 0xff7744, brightness: 0.35 },
    { name: 'North America Nebula', ra: 20.988, dec: 44.333, size: 50, color: 0xff5544, brightness: 0.15 },
    { name: 'Hercules Cluster', ra: 16.695, dec: 36.462, size: 25, color: 0xddcc77, brightness: 0.15 },
    { name: 'Ring Nebula', ra: 18.893, dec: 33.029, size: 12, color: 0x66aadd, brightness: 0.12 },
    { name: 'Crab Nebula', ra: 5.575, dec: 22.017, size: 15, color: 0xdd8866, brightness: 0.12 },
    { name: 'Whirlpool Galaxy', ra: 13.498, dec: 47.195, size: 20, color: 0x99aacc, brightness: 0.12 },
];

export default function NebulaGlow({ scene }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        DEEP_SKY_OBJECTS.forEach((obj) => {
            const pos = raDecToCartesian(obj.ra, obj.dec, 860);

            // Create a glow texture on canvas
            const canvas = document.createElement('canvas');
            const size = 128;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const color = new THREE.Color(obj.color);
            const r = Math.round(color.r * 255);
            const g = Math.round(color.g * 255);
            const b = Math.round(color.b * 255);

            // Multi-layer radial gradient for realistic nebula glow
            const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${obj.brightness})`);
            gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${obj.brightness * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${obj.brightness * 0.2})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
            });

            const sprite = new THREE.Sprite(material);
            sprite.position.set(pos.x, pos.y, pos.z);
            sprite.scale.set(obj.size, obj.size, 1);
            sprite.renderOrder = 5;
            group.add(sprite);
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            group.traverse((child) => {
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        };
    }, [scene]);

    return null;
}
