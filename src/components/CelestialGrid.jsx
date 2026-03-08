import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { raDecToCartesian, horizontalToCartesian, DEG_TO_RAD } from '../utils/coordinates';

/**
 * Renders equatorial coordinate grid and/or alt-az grid.
 */
export default function CelestialGrid({ scene, altAzScene }) {
    const eqGroupRef = useRef(null);
    const azGroupRef = useRef(null);

    // Equatorial grid (attached to celestial sphere)
    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        eqGroupRef.current = group;

        const material = new THREE.LineBasicMaterial({
            color: 0x2a4a7a,
            transparent: true,
            opacity: 0.15,
        });

        // RA lines (every 2 hours = 30°)
        for (let ra = 0; ra < 24; ra += 2) {
            const points = [];
            for (let dec = -90; dec <= 90; dec += 2) {
                const p = raDecToCartesian(ra, dec, 850);
                points.push(new THREE.Vector3(p.x, p.y, p.z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geometry, material));
        }

        // Dec lines (every 15°)
        for (let dec = -75; dec <= 75; dec += 15) {
            const points = [];
            for (let ra = 0; ra <= 24.1; ra += 0.2) {
                const p = raDecToCartesian(ra, dec, 850);
                points.push(new THREE.Vector3(p.x, p.y, p.z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geometry, material));
        }

        // Celestial equator (highlighted)
        const eqMat = new THREE.LineBasicMaterial({
            color: 0x4a8ad4,
            transparent: true,
            opacity: 0.3,
        });
        const eqPoints = [];
        for (let ra = 0; ra <= 24.1; ra += 0.1) {
            const p = raDecToCartesian(ra, 0, 852);
            eqPoints.push(new THREE.Vector3(p.x, p.y, p.z));
        }
        const eqGeom = new THREE.BufferGeometry().setFromPoints(eqPoints);
        group.add(new THREE.Line(eqGeom, eqMat));

        scene.add(group);

        return () => {
            scene.remove(group);
            group.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        };
    }, [scene]);

    // Alt-Az grid (fixed to observer's horizon)
    useEffect(() => {
        if (!altAzScene) return;

        const group = new THREE.Group();
        azGroupRef.current = group;

        const material = new THREE.LineBasicMaterial({
            color: 0x5a7a4a,
            transparent: true,
            opacity: 0.15,
        });

        // Altitude circles (every 15°)
        for (let alt = 0; alt <= 75; alt += 15) {
            const points = [];
            for (let az = 0; az <= 360; az += 2) {
                const p = horizontalToCartesian(alt, az, 840);
                points.push(new THREE.Vector3(p.x, p.y, p.z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geometry, material));
        }

        // Azimuth lines (every 30°)
        for (let az = 0; az < 360; az += 30) {
            const points = [];
            for (let alt = 0; alt <= 90; alt += 2) {
                const p = horizontalToCartesian(alt, az, 840);
                points.push(new THREE.Vector3(p.x, p.y, p.z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            group.add(new THREE.Line(geometry, material));
        }

        // Horizon line (highlighted)
        const hMat = new THREE.LineBasicMaterial({
            color: 0x6aaa4a,
            transparent: true,
            opacity: 0.35,
        });
        const hPoints = [];
        for (let az = 0; az <= 360; az += 1) {
            const p = horizontalToCartesian(0, az, 842);
            hPoints.push(new THREE.Vector3(p.x, p.y, p.z));
        }
        const hGeom = new THREE.BufferGeometry().setFromPoints(hPoints);
        group.add(new THREE.Line(hGeom, hMat));

        altAzScene.add(group);

        return () => {
            altAzScene.remove(group);
            group.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        };
    }, [altAzScene]);

    return null;
}
