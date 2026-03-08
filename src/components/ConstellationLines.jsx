import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useAppStore from '../store/useAppStore';
import { raDecToCartesian } from '../utils/coordinates';
import { useTranslation } from 'react-i18next';

/**
 * Renders IAU constellation lines and optionally names as sprites.
 */
export default function ConstellationLines({ scene, camera }) {
    const groupRef = useRef(null);
    const labelsRef = useRef([]);
    const constellationData = useAppStore((s) => s.constellationData);
    const showNames = useAppStore((s) => s.layers.constellationNames);
    const { t } = useTranslation();

    useEffect(() => {
        if (!scene || !constellationData) return;

        const group = new THREE.Group();
        groupRef.current = group;

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x4a6fa5,
            transparent: true,
            opacity: 0.35,
            linewidth: 1,
        });

        const constellations = constellationData.constellations || [];

        constellations.forEach((constellation) => {
            if (!constellation.lines) return;

            constellation.lines.forEach((line) => {
                // Each line is [ra1, dec1, ra2, dec2]
                const p1 = raDecToCartesian(line[0], line[1], 895);
                const p2 = raDecToCartesian(line[2], line[3], 895);

                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(p1.x, p1.y, p1.z),
                    new THREE.Vector3(p2.x, p2.y, p2.z),
                ]);

                const segment = new THREE.Line(geometry, lineMaterial);
                group.add(segment);
            });

            // Add constellation name label at center of lines
            if (showNames && constellation.lines.length > 0) {
                // Calculate center position from all line endpoints
                let sumRA = 0, sumDec = 0, count = 0;
                constellation.lines.forEach((line) => {
                    sumRA += line[0] + line[2];
                    sumDec += line[1] + line[3];
                    count += 2;
                });
                const centerRA = sumRA / count;
                const centerDec = sumDec / count;
                const centerPos = raDecToCartesian(centerRA, centerDec, 880);

                // Create text sprite
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 256, 64);
                ctx.font = 'italic 24px "Cormorant Garamond", Georgia, serif';
                ctx.fillStyle = 'rgba(126, 184, 247, 0.6)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const conName = t(`constellations.${constellation.id}`, constellation.name);
                ctx.fillText(conName, 128, 32);

                const texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;

                const spriteMaterial = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    depthTest: false,
                });

                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.set(centerPos.x, centerPos.y, centerPos.z);
                sprite.scale.set(80, 20, 1);
                sprite.renderOrder = 20;
                group.add(sprite);
                labelsRef.current.push({ sprite, texture, canvas, conId: constellation.id });
            }
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            labelsRef.current = [];
        };
    }, [scene, constellationData, showNames, t]);

    return null;
}
