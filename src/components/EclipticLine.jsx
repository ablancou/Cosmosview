import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ecliptic line — shows the Sun's apparent path across the sky (the plane of the
 * Solar System projected onto the celestial sphere). Zodiac constellation labels
 * are placed along this line.
 *
 * The ecliptic is tilted 23.44° from the celestial equator.
 */
const OBLIQUITY = 23.4393 * (Math.PI / 180);

// Zodiac constellations with approximate ecliptic longitude (degrees)
const ZODIAC = [
    { name: 'Aries', lon: 30 },
    { name: 'Taurus', lon: 60 },
    { name: 'Gemini', lon: 90 },
    { name: 'Cancer', lon: 120 },
    { name: 'Leo', lon: 150 },
    { name: 'Virgo', lon: 180 },
    { name: 'Libra', lon: 210 },
    { name: 'Scorpio', lon: 240 },
    { name: 'Sagittarius', lon: 270 },
    { name: 'Capricorn', lon: 300 },
    { name: 'Aquarius', lon: 330 },
    { name: 'Pisces', lon: 360 },
];

const ZODIAC_SYMBOLS = {
    Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
    Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
    Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export default function EclipticLine({ scene }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;
        const radius = 900;

        // === Ecliptic line ===
        const points = [];
        const segments = 360;
        for (let i = 0; i <= segments; i++) {
            const lon = (i / segments) * 2 * Math.PI;

            // Convert ecliptic coordinates to equatorial (RA, Dec)
            const x = Math.cos(lon);
            const y = Math.sin(lon) * Math.cos(OBLIQUITY);
            const z = Math.sin(lon) * Math.sin(OBLIQUITY);

            points.push(new THREE.Vector3(x * radius, z * radius, -y * radius));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffaa33,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        });
        const eclipticLine = new THREE.Line(lineGeometry, lineMaterial);
        eclipticLine.renderOrder = 3;
        group.add(eclipticLine);

        // === Zodiac labels ===
        ZODIAC.forEach((sign) => {
            const lonRad = (sign.lon * Math.PI) / 180;

            // Convert ecliptic to equatorial
            const x = Math.cos(lonRad);
            const y = Math.sin(lonRad) * Math.cos(OBLIQUITY);
            const z = Math.sin(lonRad) * Math.sin(OBLIQUITY);

            const labelRadius = radius + 15;
            const pos = new THREE.Vector3(x * labelRadius, z * labelRadius, -y * labelRadius);

            // Create text sprite
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 48;
            const ctx = canvas.getContext('2d');

            const symbol = ZODIAC_SYMBOLS[sign.name] || '★';

            ctx.fillStyle = 'rgba(255, 170, 51, 0.7)';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${symbol} ${sign.name}`, 64, 24);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(pos);
            sprite.scale.set(50, 18, 1);
            sprite.renderOrder = 4;
            group.add(sprite);
        });

        // === Solstice/Equinox markers ===
        const markers = [
            { lon: 0, label: 'Vernal ☀️', color: 0x44ff88 },
            { lon: 90, label: 'Summer ☀️', color: 0xffdd44 },
            { lon: 180, label: 'Autumnal 🍂', color: 0xff8844 },
            { lon: 270, label: 'Winter ❄️', color: 0x44aaff },
        ];

        markers.forEach((m) => {
            const lonRad = (m.lon * Math.PI) / 180;
            const x = Math.cos(lonRad);
            const y = Math.sin(lonRad) * Math.cos(OBLIQUITY);
            const z = Math.sin(lonRad) * Math.sin(OBLIQUITY);

            const dotGeometry = new THREE.SphereGeometry(3, 8, 8);
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: m.color,
                transparent: true,
                opacity: 0.6,
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.position.set(x * radius, z * radius, -y * radius);
            dot.renderOrder = 4;
            group.add(dot);
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            group.children.forEach((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        };
    }, [scene]);

    return null;
}
