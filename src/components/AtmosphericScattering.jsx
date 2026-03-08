import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';
import atmosphereFragShader from '../shaders/atmosphere.frag.glsl?raw';

/**
 * AtmosphericScattering — Rayleigh/Mie sky gradient.
 * Creates a realistic sky color dome that changes based on Sun altitude:
 *   - Night: deep blue-to-black
 *   - Twilight: beautiful gradient with warm horizon glow
 *   - Daytime: Rayleigh blue sky
 */
export default function AtmosphericScattering({ scene }) {
    const meshRef = useRef(null);
    const materialRef = useRef(null);
    const time = useAppStore((s) => s.time);
    const location = useAppStore((s) => s.location);

    useEffect(() => {
        if (!scene) return;

        const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vWorldPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunDirection: { value: new THREE.Vector3(0, -1, 0) },
                uSunAltitude: { value: -20 },
                uIntensity: { value: 1.0 },
            },
            vertexShader,
            fragmentShader: atmosphereFragShader,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.NormalBlending,
        });
        materialRef.current = material;

        // Sky dome — slightly smaller than skybox
        const geometry = new THREE.SphereGeometry(940, 64, 32);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 0; // Behind everything else
        scene.add(mesh);
        meshRef.current = mesh;

        return () => {
            scene.remove(mesh);
            geometry.dispose();
            material.dispose();
        };
    }, [scene]);

    // Update sun altitude
    useEffect(() => {
        if (!materialRef.current) return;

        try {
            const observer = new Astronomy.Observer(location.lat, location.lon, 0);
            const equ = Astronomy.Equator('Sun', time.current, observer, true, true);
            const hor = Astronomy.Horizon(time.current, observer, equ.ra, equ.dec, 'normal');

            materialRef.current.uniforms.uSunAltitude.value = hor.altitude;

            // Sun direction (normalized)
            const azRad = hor.azimuth * Math.PI / 180;
            const altRad = hor.altitude * Math.PI / 180;
            materialRef.current.uniforms.uSunDirection.value.set(
                -Math.sin(azRad) * Math.cos(altRad),
                Math.sin(altRad),
                -Math.cos(azRad) * Math.cos(altRad)
            );
        } catch (e) {
            materialRef.current.uniforms.uSunAltitude.value = -20;
        }
    }, [time.current, location]);

    return null;
}
