import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * NASA Deep Star Maps 2020 skybox — public domain (US Government work).
 * Renders a real photograph of 1.7 billion stars as an equirectangular
 * background sphere mapped to celestial coordinates.
 *
 * Source: https://svs.gsfc.nasa.gov/4851
 * License: Public Domain — no attribution required
 */
export default function NASASkybox({ scene }) {
    const meshRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/starmap_nasa.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;

            const geometry = new THREE.SphereGeometry(950, 64, 32);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 0; // Render behind everything
            // Flip horizontally to match RA direction convention
            mesh.scale.x = -1;
            scene.add(mesh);
            meshRef.current = mesh;
        });

        return () => {
            if (meshRef.current) {
                scene.remove(meshRef.current);
                if (meshRef.current.material.map) meshRef.current.material.map.dispose();
                meshRef.current.material.dispose();
                meshRef.current.geometry.dispose();
            }
        };
    }, [scene]);

    return null;
}
