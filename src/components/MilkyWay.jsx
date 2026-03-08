import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import milkywayFragShader from '../shaders/milkyway.frag.glsl?raw';

/**
 * Milky Way rendered as a large sphere with procedural GLSL shader.
 */
export default function MilkyWay({ scene }) {
    const meshRef = useRef(null);
    const materialRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const vertexShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 1.0 },
            },
            vertexShader,
            fragmentShader: milkywayFragShader,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
        });
        materialRef.current = material;

        const geometry = new THREE.SphereGeometry(800, 64, 32);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 1;
        scene.add(mesh);
        meshRef.current = mesh;

        const animate = () => {
            animRef.current = requestAnimationFrame(animate);
            material.uniforms.uTime.value += 0.016;
        };
        animate();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(mesh);
            geometry.dispose();
            material.dispose();
        };
    }, [scene]);

    return null;
}
