import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Compass rose with cardinal and intercardinal directions.
 * Rendered as a circle at the horizon plane with glowing direction markers.
 */
export default function CompassRose({ scene }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        const directions = [
            { label: 'N', angle: 0, major: true },
            { label: 'NE', angle: 45, major: false },
            { label: 'E', angle: 90, major: true },
            { label: 'SE', angle: 135, major: false },
            { label: 'S', angle: 180, major: true },
            { label: 'SW', angle: 225, major: false },
            { label: 'W', angle: 270, major: true },
            { label: 'NW', angle: 315, major: false },
        ];

        directions.forEach((dir) => {
            const rad = (dir.angle * Math.PI) / 180;
            const r = 780;
            const x = r * Math.sin(rad);
            const y = -5;
            const z = -r * Math.cos(rad);

            // Label sprite
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 128, 64);

            if (dir.major) {
                ctx.font = 'bold 32px Inter, sans-serif';
                ctx.fillStyle = dir.label === 'N'
                    ? 'rgba(255, 100, 100, 0.9)' // North = red
                    : 'rgba(126, 184, 247, 0.7)';
            } else {
                ctx.font = '20px Inter, sans-serif';
                ctx.fillStyle = 'rgba(126, 184, 247, 0.4)';
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dir.label, 64, 28);

            // Degree number below
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = 'rgba(126, 184, 247, 0.3)';
            ctx.fillText(`${dir.angle}°`, 64, 48);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
            });

            const sprite = new THREE.Sprite(material);
            sprite.position.set(x, y, z);
            sprite.scale.set(dir.major ? 40 : 25, dir.major ? 20 : 12.5, 1);
            sprite.renderOrder = 22;
            group.add(sprite);

            // Tick mark on compass ring
            if (dir.major) {
                const tickLength = 15;
                const innerR = r - tickLength;
                const tickGeom = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(r * Math.sin(rad), -2, -r * Math.cos(rad)),
                    new THREE.Vector3(innerR * Math.sin(rad), -2, -innerR * Math.cos(rad)),
                ]);
                const tickMat = new THREE.LineBasicMaterial({
                    color: dir.label === 'N' ? 0xff6666 : 0x7eb8f7,
                    transparent: true,
                    opacity: 0.5,
                });
                group.add(new THREE.Line(tickGeom, tickMat));
            }
        });

        // Degree marks every 10°
        for (let angle = 0; angle < 360; angle += 10) {
            if (angle % 45 === 0) continue; // Skip cardinal/intercardinal

            const rad = (angle * Math.PI) / 180;
            const r = 780;
            const tickLength = 5;
            const innerR = r - tickLength;

            const tickGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(r * Math.sin(rad), -2, -r * Math.cos(rad)),
                new THREE.Vector3(innerR * Math.sin(rad), -2, -innerR * Math.cos(rad)),
            ]);
            const tickMat = new THREE.LineBasicMaterial({
                color: 0x7eb8f7,
                transparent: true,
                opacity: 0.15,
            });
            group.add(new THREE.Line(tickGeom, tickMat));
        }

        // ── Zenith marker (directly overhead) ──
        const zenithCanvas = document.createElement('canvas');
        zenithCanvas.width = 128;
        zenithCanvas.height = 64;
        const zCtx = zenithCanvas.getContext('2d');
        zCtx.clearRect(0, 0, 128, 64);
        // Crosshair
        zCtx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
        zCtx.lineWidth = 1;
        zCtx.beginPath();
        zCtx.moveTo(54, 12); zCtx.lineTo(54, 22);
        zCtx.moveTo(74, 12); zCtx.lineTo(74, 22);
        zCtx.moveTo(54, 12); zCtx.lineTo(74, 12);
        zCtx.stroke();
        // Label
        zCtx.font = 'bold 16px Inter, sans-serif';
        zCtx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        zCtx.textAlign = 'center';
        zCtx.textBaseline = 'middle';
        zCtx.fillText('ZENITH', 64, 32);
        zCtx.font = '10px Inter, sans-serif';
        zCtx.fillStyle = 'rgba(255, 200, 100, 0.4)';
        zCtx.fillText('90° altitude', 64, 48);

        const zenithTexture = new THREE.CanvasTexture(zenithCanvas);
        const zenithSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: zenithTexture, transparent: true, depthTest: false,
        }));
        zenithSprite.position.set(0, 800, 0);
        zenithSprite.scale.set(40, 20, 1);
        zenithSprite.renderOrder = 22;
        group.add(zenithSprite);

        // Zenith dot (small glowing ring)
        const zenithRing = new THREE.RingGeometry(3, 4, 32);
        const zenithRingMat = new THREE.MeshBasicMaterial({
            color: 0xffc864, transparent: true, opacity: 0.35, side: THREE.DoubleSide,
        });
        const zenithMesh = new THREE.Mesh(zenithRing, zenithRingMat);
        zenithMesh.position.set(0, 790, 0);
        zenithMesh.rotation.x = Math.PI / 2;
        zenithMesh.renderOrder = 21;
        group.add(zenithMesh);

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
        };
    }, [scene]);

    return null;
}
