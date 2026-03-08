import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import useAppStore from '../store/useAppStore';

/**
 * Star Trails Mode — Simulates long-exposure photography showing
 * beautiful circular star trails around the celestial pole (Polaris).
 *
 * Uses additive blending to accumulate star positions as the sky rotates,
 * creating the iconic circular arc trails seen in real astrophotography.
 */
export default function StarTrails({ scene, camera }) {
    const active = useAppStore((s) => s.starTrails);
    const trailRef = useRef(null);
    const pointsRef = useRef([]);
    const frameCountRef = useRef(0);

    useEffect(() => {
        if (!active || !scene || !camera) return;

        // Create trail geometry with many segments
        const MAX_TRAIL_POINTS = 200;
        const starData = useAppStore.getState().starData;
        if (!starData || starData.length === 0) return;

        // Pick brightest stars for trails
        const brightStars = starData
            .filter((s) => s.mag < 4.5)
            .slice(0, 300);

        const group = new THREE.Group();
        trailRef.current = group;
        group.renderOrder = 10;

        // Trail material
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        // Create a trail line for each bright star
        brightStars.forEach((star) => {
            const raRad = (star.ra * 15 * Math.PI) / 180;
            const decRad = (star.dec * Math.PI) / 180;
            const r = 950;

            // Generate arc points (simulating Earth's rotation)
            const positions = [];
            const arcLength = 0.5; // radians of rotation (~30 degrees)

            for (let i = 0; i <= 60; i++) {
                const angle = (i / 60) * arcLength;
                const adjustedRa = raRad + angle;

                const x = r * Math.cos(decRad) * Math.cos(adjustedRa);
                const y = r * Math.sin(decRad);
                const z = -r * Math.cos(decRad) * Math.sin(adjustedRa);

                positions.push(x, y, z);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );

            // Color based on star color index
            const bv = star.ci || 0;
            let color;
            if (bv < -0.1) color = new THREE.Color(0.6, 0.7, 1.0);      // Blue
            else if (bv < 0.3) color = new THREE.Color(0.8, 0.85, 1.0);  // Blue-white
            else if (bv < 0.6) color = new THREE.Color(1.0, 1.0, 0.9);   // White-yellow
            else if (bv < 1.0) color = new THREE.Color(1.0, 0.85, 0.6);  // Yellow-orange
            else color = new THREE.Color(1.0, 0.6, 0.4);                  // Red-orange

            const mat = trailMaterial.clone();
            mat.color = color;
            // Brighter stars = more visible trails
            mat.opacity = Math.max(0.05, 0.3 - star.mag * 0.04);

            const line = new THREE.Line(geometry, mat);
            line.renderOrder = 10;
            group.add(line);
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            group.children.forEach((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        };
    }, [active, scene, camera]);

    return null;
}
