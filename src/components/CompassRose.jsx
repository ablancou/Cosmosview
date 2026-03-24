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

        // ── Zenith marker (directly overhead) — elegant minimal design ──
        const zenithCanvas = document.createElement('canvas');
        zenithCanvas.width = 256;
        zenithCanvas.height = 96;
        const zCtx = zenithCanvas.getContext('2d');
        zCtx.clearRect(0, 0, 256, 96);

        // Subtle crosshair — thin precision lines
        const cx = 128, cy = 28;
        zCtx.strokeStyle = 'rgba(255, 210, 120, 0.3)';
        zCtx.lineWidth = 1;
        // Horizontal dashes
        zCtx.beginPath();
        zCtx.moveTo(cx - 28, cy); zCtx.lineTo(cx - 8, cy);
        zCtx.moveTo(cx + 8, cy);  zCtx.lineTo(cx + 28, cy);
        zCtx.stroke();
        // Vertical dashes
        zCtx.beginPath();
        zCtx.moveTo(cx, cy - 28); zCtx.lineTo(cx, cy - 8);
        zCtx.moveTo(cx, cy + 8);  zCtx.lineTo(cx, cy + 8 + 4);
        zCtx.stroke();
        // Center dot
        zCtx.beginPath();
        zCtx.arc(cx, cy, 2, 0, Math.PI * 2);
        zCtx.fillStyle = 'rgba(255, 210, 120, 0.5)';
        zCtx.fill();
        // Corner brackets
        const bLen = 8, bOff = 18;
        zCtx.strokeStyle = 'rgba(255, 210, 120, 0.25)';
        zCtx.lineWidth = 1.2;
        zCtx.beginPath();
        // Top-left
        zCtx.moveTo(cx - bOff, cy - bOff + bLen); zCtx.lineTo(cx - bOff, cy - bOff); zCtx.lineTo(cx - bOff + bLen, cy - bOff);
        // Top-right
        zCtx.moveTo(cx + bOff - bLen, cy - bOff); zCtx.lineTo(cx + bOff, cy - bOff); zCtx.lineTo(cx + bOff, cy - bOff + bLen);
        // Bottom-left
        zCtx.moveTo(cx - bOff, cy + bOff - bLen); zCtx.lineTo(cx - bOff, cy + bOff); zCtx.lineTo(cx - bOff + bLen, cy + bOff);
        // Bottom-right
        zCtx.moveTo(cx + bOff - bLen, cy + bOff); zCtx.lineTo(cx + bOff, cy + bOff); zCtx.lineTo(cx + bOff, cy + bOff - bLen);
        zCtx.stroke();

        // Label — wide letter-spacing, light weight
        zCtx.font = '300 16px Inter, sans-serif';
        zCtx.fillStyle = 'rgba(255, 210, 120, 0.55)';
        zCtx.textAlign = 'center';
        zCtx.textBaseline = 'middle';
        // Manual letter spacing
        const letters = 'Z E N I T H'.split('');
        const totalW = letters.length * 11;
        letters.forEach((ch, li) => {
            zCtx.fillText(ch.trim(), cx - totalW / 2 + li * 11 + 5, 72);
        });

        // Altitude indicator
        zCtx.font = '10px Inter, sans-serif';
        zCtx.fillStyle = 'rgba(255, 210, 120, 0.25)';
        zCtx.fillText('90°', cx, 88);

        const zenithTexture = new THREE.CanvasTexture(zenithCanvas);
        const zenithSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: zenithTexture, transparent: true, depthTest: false,
        }));
        zenithSprite.position.set(0, 800, 0);
        zenithSprite.scale.set(50, 18, 1);
        zenithSprite.renderOrder = 22;
        group.add(zenithSprite);

        // Zenith ring — subtle concentric rings for depth
        const zenithRing1 = new THREE.RingGeometry(4, 4.5, 64);
        const zenithRingMat1 = new THREE.MeshBasicMaterial({
            color: 0xffd278, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
        });
        const zenithMesh1 = new THREE.Mesh(zenithRing1, zenithRingMat1);
        zenithMesh1.position.set(0, 792, 0);
        zenithMesh1.rotation.x = Math.PI / 2;
        zenithMesh1.renderOrder = 21;
        group.add(zenithMesh1);

        const zenithRing2 = new THREE.RingGeometry(8, 8.3, 64);
        const zenithRingMat2 = new THREE.MeshBasicMaterial({
            color: 0xffd278, transparent: true, opacity: 0.08, side: THREE.DoubleSide,
        });
        const zenithMesh2 = new THREE.Mesh(zenithRing2, zenithRingMat2);
        zenithMesh2.position.set(0, 792, 0);
        zenithMesh2.rotation.x = Math.PI / 2;
        zenithMesh2.renderOrder = 21;
        group.add(zenithMesh2);

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
