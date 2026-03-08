import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Aurora Borealis effect — animated curtains of light near the poles.
 * Appears in the northern sky (or southern for aurora australis).
 * Uses vertex-animated ribbons with custom shaders.
 */
export default function AuroraBorealis({ scene }) {
    const groupRef = useRef(null);
    const materialsRef = useRef([]);
    const animRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;
        const materials = [];

        // Create multiple aurora curtain ribbons
        const curtainCount = 5;

        for (let c = 0; c < curtainCount; c++) {
            const segments = 80;
            const positions = new Float32Array((segments + 1) * 2 * 3);
            const uvs = new Float32Array((segments + 1) * 2 * 2);
            const indices = [];

            // Initial positions (will be animated)
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = (t - 0.5) * Math.PI * 0.6 + c * 0.15;
                const radius = 800;
                const elevation = 45 + c * 8; // degrees above horizon
                const elevRad = (elevation * Math.PI) / 180;

                // Bottom vertex
                const x0 = Math.sin(angle) * Math.cos(elevRad) * radius;
                const y0 = Math.sin(elevRad) * radius;
                const z0 = Math.cos(angle) * Math.cos(elevRad) * radius;
                positions[(i * 2) * 3] = x0;
                positions[(i * 2) * 3 + 1] = y0;
                positions[(i * 2) * 3 + 2] = z0;

                // Top vertex (higher elevation)
                const topElev = elevRad + 0.15 + Math.random() * 0.1;
                const x1 = Math.sin(angle) * Math.cos(topElev) * radius;
                const y1 = Math.sin(topElev) * radius;
                const z1 = Math.cos(angle) * Math.cos(topElev) * radius;
                positions[(i * 2 + 1) * 3] = x1;
                positions[(i * 2 + 1) * 3 + 1] = y1;
                positions[(i * 2 + 1) * 3 + 2] = z1;

                // UVs
                uvs[(i * 2) * 2] = t;
                uvs[(i * 2) * 2 + 1] = 0;
                uvs[(i * 2 + 1) * 2] = t;
                uvs[(i * 2 + 1) * 2 + 1] = 1;

                // Indices for triangle strip
                if (i < segments) {
                    const base = i * 2;
                    indices.push(base, base + 1, base + 2);
                    indices.push(base + 1, base + 3, base + 2);
                }
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);

            const vertexShader = `
        uniform float uTime;
        uniform float uCurtainIndex;
        varying vec2 vUv;
        varying float vWave;

        void main() {
          vUv = uv;

          // Animated wave displacement
          float wave = sin(position.x * 0.005 + uTime * 0.8 + uCurtainIndex * 1.5) * 15.0;
          wave += sin(position.z * 0.003 + uTime * 0.5) * 10.0;
          wave += sin(uTime * 1.2 + uv.x * 6.28 + uCurtainIndex) * 8.0;
          vWave = wave;

          vec3 pos = position;
          pos.y += wave * uv.y; // Only displace top vertices
          pos.x += sin(uTime * 0.3 + uv.x * 3.14) * 5.0;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `;

            const fragmentShader = `
        uniform float uTime;
        uniform float uCurtainIndex;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying float vWave;

        void main() {
          // Vertical gradient — bright at bottom, fading at top
          float verticalFade = pow(1.0 - vUv.y, 1.5);

          // Horizontal fade at edges
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

          // Animated curtain fold brightness
          float foldBright = 0.5 + 0.5 * sin(vUv.x * 20.0 + uTime * 2.0 + uCurtainIndex * 3.0);
          foldBright = pow(foldBright, 2.0);

          // Shimmer
          float shimmer = 0.7 + 0.3 * sin(uTime * 4.0 + vUv.x * 30.0 + vUv.y * 10.0);

          // Color mix based on height
          vec3 color = mix(uColor1, uColor2, vUv.y * 0.8 + vWave * 0.01);

          // Pulsing overall brightness
          float pulse = 0.6 + 0.4 * sin(uTime * 0.5 + uCurtainIndex * 2.0);

          float alpha = verticalFade * edgeFade * (0.3 + foldBright * 0.4) * shimmer * pulse * 0.12;

          gl_FragColor = vec4(color, alpha);
        }
      `;

            // Aurora colors — greens, teals, purples
            const colorSets = [
                { c1: new THREE.Color(0.1, 0.9, 0.3), c2: new THREE.Color(0.1, 0.5, 0.9) },
                { c1: new THREE.Color(0.1, 0.8, 0.4), c2: new THREE.Color(0.6, 0.2, 0.8) },
                { c1: new THREE.Color(0.2, 0.9, 0.5), c2: new THREE.Color(0.3, 0.4, 0.9) },
                { c1: new THREE.Color(0.0, 0.7, 0.3), c2: new THREE.Color(0.5, 0.1, 0.7) },
                { c1: new THREE.Color(0.15, 0.85, 0.35), c2: new THREE.Color(0.2, 0.6, 0.85) },
            ];

            const colors = colorSets[c % colorSets.length];

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uCurtainIndex: { value: c },
                    uColor1: { value: colors.c1 },
                    uColor2: { value: colors.c2 },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });

            materials.push(material);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 5;
            group.add(mesh);
        }

        materialsRef.current = materials;
        scene.add(group);

        // Animation
        const startTime = performance.now();
        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            const elapsed = (performance.now() - startTime) / 1000;
            materials.forEach((mat) => {
                mat.uniforms.uTime.value = elapsed;
            });
        };
        animate();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(group);
            group.children.forEach((child) => {
                child.geometry.dispose();
                child.material.dispose();
            });
        };
    }, [scene]);

    return null;
}
