import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';
import { useLocationContext } from '../contexts/LocationContext';

/**
 * Renders a subtle atmospheric glow at the horizon.
 * Changes color based on Sun altitude (orange near sunrise/sunset).
 */
export default function HorizonAtmosphere({ scene }) {
    const meshRef = useRef(null);
    const materialRef = useRef(null);
    const time = useAppStore((s) => s.time);
    const location = useLocationContext();

    useEffect(() => {
        if (!scene) return;

        const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      uniform vec3 uSunsetColor;
      uniform vec3 uDayColor;
      uniform float uSunAltitude;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        // Horizon glow at the bottom of the ring
        float horizonFactor = 1.0 - abs(vPosition.y) / 50.0;
        horizonFactor = clamp(horizonFactor, 0.0, 1.0);
        horizonFactor = pow(horizonFactor, 2.0);

        // Mix colors based on sun altitude
        float sunFactor = clamp((uSunAltitude + 18.0) / 36.0, 0.0, 1.0);
        float sunsetFactor = 1.0 - abs(uSunAltitude) / 18.0;
        sunsetFactor = clamp(sunsetFactor, 0.0, 1.0);
        sunsetFactor = pow(sunsetFactor, 1.5);

        vec3 color = mix(uSunsetColor, uDayColor, sunFactor);
        color = mix(color, uSunsetColor, sunsetFactor * 0.7);

        float alpha = horizonFactor * uIntensity * (0.1 + sunsetFactor * 0.25);
        gl_FragColor = vec4(color, alpha);
      }
    `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunsetColor: { value: new THREE.Color(0xff6b35) },
                uDayColor: { value: new THREE.Color(0x4a90d9) },
                uSunAltitude: { value: -10 },
                uIntensity: { value: 1.0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });
        materialRef.current = material;

        // Create a ring at the horizon
        const geometry = new THREE.CylinderGeometry(830, 830, 60, 64, 1, true);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0;
        mesh.renderOrder = 2;
        scene.add(mesh);
        meshRef.current = mesh;

        return () => {
            scene.remove(mesh);
            geometry.dispose();
            material.dispose();
        };
    }, [scene]);

    // Update sun altitude for atmosphere coloring
    useEffect(() => {
        if (!materialRef.current) return;

        try {
            const observer = new Astronomy.Observer(location.lat, location.lon, 0);
            const sunHor = Astronomy.Horizon(time.current, observer, 0, 0, 'normal');

            // Use actual sun altitude to determine atmosphere effect
            const equ = Astronomy.Equator('Sun', time.current, observer, true, true);
            const hor = Astronomy.Horizon(
                time.current,
                observer,
                equ.ra,
                equ.dec,
                'normal'
            );

            materialRef.current.uniforms.uSunAltitude.value = hor.altitude;
        } catch (e) {
            // Fallback
            materialRef.current.uniforms.uSunAltitude.value = -10;
        }
    }, [time.current, location]);

    return null;
}
