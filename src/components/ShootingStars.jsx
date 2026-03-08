import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Animated shooting stars / meteors for visual wow factor.
 * Renders random meteor streaks across the sky with glowing trails.
 * Pure procedural — no external assets needed.
 */
export default function ShootingStars({ scene }) {
    const groupRef = useRef(null);
    const meteorsRef = useRef([]);
    const animRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;
        scene.add(group);

        // Meteor pool
        const POOL_SIZE = 5;
        const meteors = [];

        for (let i = 0; i < POOL_SIZE; i++) {
            // Each meteor is a line with gradient opacity
            const trailLength = 30;
            const positions = new Float32Array(trailLength * 3);
            const opacities = new Float32Array(trailLength);

            for (let j = 0; j < trailLength; j++) {
                opacities[j] = 1.0 - j / trailLength;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: 0xaaccff,
                transparent: true,
                opacity: 0,
                linewidth: 2,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

            const line = new THREE.Line(geometry, material);
            line.renderOrder = 25;
            group.add(line);

            meteors.push({
                line,
                geometry,
                material,
                active: false,
                life: 0,
                maxLife: 0,
                startPos: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                trailLength,
                trailPositions: [],
            });
        }
        meteorsRef.current = meteors;

        // Spawn a meteor at random intervals
        let lastSpawn = 0;
        const spawnInterval = () => 3000 + Math.random() * 12000; // 3-15 seconds
        let nextSpawn = spawnInterval();

        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            const now = performance.now();

            // Spawn new meteor
            if (now - lastSpawn > nextSpawn) {
                lastSpawn = now;
                nextSpawn = spawnInterval();

                const inactive = meteors.find((m) => !m.active);
                if (inactive) {
                    // Random position on the sky sphere
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI * 0.6 + 0.2; // Avoid exact zenith/horizon
                    const r = 850;

                    const x = r * Math.sin(phi) * Math.cos(theta);
                    const y = r * Math.cos(phi);
                    const z = r * Math.sin(phi) * Math.sin(theta);

                    inactive.startPos.set(x, y, z);

                    // Random velocity direction (tangent to sphere)
                    const speed = 8 + Math.random() * 12;
                    const vTheta = theta + (Math.random() - 0.5) * 0.5;
                    const vPhi = phi + 0.3 + Math.random() * 0.3;
                    inactive.velocity.set(
                        speed * Math.sin(vPhi) * Math.cos(vTheta) - x * 0.01,
                        speed * Math.cos(vPhi) - y * 0.01,
                        speed * Math.sin(vPhi) * Math.sin(vTheta) - z * 0.01
                    );

                    inactive.life = 0;
                    inactive.maxLife = 40 + Math.random() * 40;
                    inactive.active = true;
                    inactive.trailPositions = [];
                    inactive.material.opacity = 1;

                    // Set random color — mostly white/blue, occasional warm
                    const warmChance = Math.random();
                    if (warmChance < 0.15) {
                        inactive.material.color.setHex(0xffdd88); // Warm yellow
                    } else if (warmChance < 0.3) {
                        inactive.material.color.setHex(0xddffee); // Green tint
                    } else {
                        inactive.material.color.setHex(0xaaccff); // Blue-white
                    }
                }
            }

            // Update active meteors
            meteors.forEach((meteor) => {
                if (!meteor.active) return;

                meteor.life++;
                if (meteor.life > meteor.maxLife) {
                    meteor.active = false;
                    meteor.material.opacity = 0;
                    return;
                }

                // Current position
                const currentPos = meteor.startPos.clone().add(
                    meteor.velocity.clone().multiplyScalar(meteor.life * 0.5)
                );

                // Add to trail
                meteor.trailPositions.unshift(currentPos.clone());
                if (meteor.trailPositions.length > meteor.trailLength) {
                    meteor.trailPositions.pop();
                }

                // Update geometry
                const positions = meteor.geometry.attributes.position.array;
                for (let j = 0; j < meteor.trailLength; j++) {
                    if (j < meteor.trailPositions.length) {
                        positions[j * 3] = meteor.trailPositions[j].x;
                        positions[j * 3 + 1] = meteor.trailPositions[j].y;
                        positions[j * 3 + 2] = meteor.trailPositions[j].z;
                    } else {
                        // Collapse remaining points to last known position
                        const last = meteor.trailPositions[meteor.trailPositions.length - 1] || currentPos;
                        positions[j * 3] = last.x;
                        positions[j * 3 + 1] = last.y;
                        positions[j * 3 + 2] = last.z;
                    }
                }
                meteor.geometry.attributes.position.needsUpdate = true;

                // Fade out near end of life
                const lifeRatio = meteor.life / meteor.maxLife;
                meteor.material.opacity = lifeRatio < 0.8 ? 0.9 : (1 - lifeRatio) * 4.5;
            });
        };

        animate();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(group);
            meteors.forEach((m) => {
                m.geometry.dispose();
                m.material.dispose();
            });
        };
    }, [scene]);

    return null;
}
