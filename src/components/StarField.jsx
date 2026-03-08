import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import useAppStore from '../store/useAppStore';
import { raDecToCartesian } from '../utils/coordinates';
import { getStarColor, magnitudeToSize } from '../utils/starColors';
import starVertShader from '../shaders/star.vert.glsl?raw';
import starFragShader from '../shaders/star.frag.glsl?raw';

/**
 * StarField component using Three.js Points with custom shaders.
 * Renders stars as GPU-accelerated point sprites with glow.
 */
const StarField = forwardRef(function StarField({ scene, camera }, ref) {
    const pointsRef = useRef(null);
    const materialRef = useRef(null);
    const animFrameRef = useRef(null);

    const starData = useAppStore((s) => s.starData);
    const selectedStar = useAppStore((s) => s.selectedStar);
    const isLowPerf = useAppStore((s) => s.isLowPerf);

    useImperativeHandle(ref, () => pointsRef.current, []);

    useEffect(() => {
        if (!scene || !starData || starData.length === 0) return;

        // Filter stars for performance on low-end devices
        const stars = isLowPerf ? starData.filter((s) => s.mag < 4.0) : starData;
        const count = stars.length;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const magnitudes = new Float32Array(count);
        const indices = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const star = stars[i];
            const pos = raDecToCartesian(star.ra, star.dec, 900);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            const color = getStarColor(star.spect);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            magnitudes[i] = star.mag;
            indices[i] = i;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aMagnitude', new THREE.BufferAttribute(magnitudes, 1));
        geometry.setAttribute('aStarIndex', new THREE.BufferAttribute(indices, 1));

        // Create shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uHoveredIndex: { value: -1 },
                uFOV: { value: camera ? camera.fov : 70 },
                uOpacity: { value: 1.0 },
            },
            vertexShader: starVertShader,
            fragmentShader: starFragShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        materialRef.current = material;

        // Create points
        const points = new THREE.Points(geometry, material);
        points.renderOrder = 10;
        scene.add(points);
        pointsRef.current = points;

        // Animation loop for shader time uniform
        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);
            material.uniforms.uTime.value += 0.016;
            // Update FOV for zoom-responsive star sizing
            if (camera) {
                material.uniforms.uFOV.value = camera.fov;
            }
        };
        animate();

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            scene.remove(points);
            geometry.dispose();
            material.dispose();
        };
    }, [scene, starData, isLowPerf]);

    // Update hovered star index
    useEffect(() => {
        if (materialRef.current && selectedStar) {
            materialRef.current.uniforms.uHoveredIndex.value = selectedStar.id;
        } else if (materialRef.current) {
            materialRef.current.uniforms.uHoveredIndex.value = -1;
        }
    }, [selectedStar]);

    return null;
});

export default StarField;
