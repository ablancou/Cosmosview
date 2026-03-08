import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Renders a realistic ground / landscape silhouette at the horizon.
 * Creates a dark terrain ring with subtle tree/mountain silhouettes.
 * Makes the experience feel immersive — you're standing in a real place.
 */
export default function GroundLandscape({ scene }) {
    const groupRef = useRef(null);

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        // === Ground hemisphere (everything below horizon is dark earth) ===
        const groundGeom = new THREE.SphereGeometry(835, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const groundMat = new THREE.MeshBasicMaterial({
            color: 0x050508,
            side: THREE.BackSide,
            transparent: false,
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.renderOrder = 3;
        group.add(ground);

        // === Tree/mountain silhouette ring ===
        const silhouetteCanvas = document.createElement('canvas');
        const canvasWidth = 2048;
        const canvasHeight = 128;
        silhouetteCanvas.width = canvasWidth;
        silhouetteCanvas.height = canvasHeight;
        const ctx = silhouetteCanvas.getContext('2d');

        // Clear with transparency
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Generate procedural silhouette (trees + gentle hills)
        ctx.fillStyle = '#060609';
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);

        // Layer 1: distant hills
        for (let x = 0; x <= canvasWidth; x += 2) {
            const hillBase = canvasHeight * 0.65;
            const hill1 = Math.sin(x * 0.003) * 15;
            const hill2 = Math.sin(x * 0.007 + 1) * 10;
            const hill3 = Math.sin(x * 0.002 + 3) * 20;
            const y = hillBase - hill1 - hill2 - hill3;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.closePath();
        ctx.fill();

        // Layer 2: trees (random spikes)
        ctx.fillStyle = '#040406';
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);

        for (let x = 0; x <= canvasWidth; x += 1) {
            const treeBase = canvasHeight * 0.7;
            const hill = Math.sin(x * 0.003) * 12 + Math.sin(x * 0.007) * 8;
            let y = treeBase - hill;

            // Add tree spikes (conifers)
            const treeFreq = Math.sin(x * 0.05) * 0.5 + 0.5;
            const treeDensity = Math.sin(x * 0.01 + 2) * 0.3 + 0.7;
            if (treeFreq > 0.4 && treeDensity > 0.5) {
                const treeHeight = (Math.sin(x * 0.13) * 0.5 + 0.5) * 18 * treeDensity;
                const spike = Math.max(0, treeHeight - Math.abs(Math.sin(x * 0.08)) * 12);
                y -= spike;
            }

            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.closePath();
        ctx.fill();

        // Layer 3: Foreground with some buildings/structures
        ctx.fillStyle = '#030305';
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);

        for (let x = 0; x <= canvasWidth; x += 1) {
            let y = canvasHeight * 0.82;

            // Occasional building shapes
            const buildingSeed = Math.sin(x * 0.01 + 5);
            if (buildingSeed > 0.7) {
                const buildingHeight = (buildingSeed - 0.7) * 60;
                const buildingWidth = 20 + Math.sin(x * 0.02) * 10;
                const inBuilding = Math.abs(Math.sin(x * 0.05)) < 0.3;
                if (inBuilding) {
                    y -= buildingHeight;
                }
            }

            ctx.lineTo(x, y);
        }
        ctx.lineTo(canvasWidth, canvasHeight);
        ctx.closePath();
        ctx.fill();

        const silhouetteTexture = new THREE.CanvasTexture(silhouetteCanvas);
        silhouetteTexture.wrapS = THREE.RepeatWrapping;
        silhouetteTexture.repeat.set(1, 1);

        // Create cylinder for silhouette
        const silhouetteMat = new THREE.MeshBasicMaterial({
            map: silhouetteTexture,
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
        });

        const silhouetteGeom = new THREE.CylinderGeometry(834, 834, 40, 64, 1, true);
        const silhouette = new THREE.Mesh(silhouetteGeom, silhouetteMat);
        silhouette.position.y = 10;
        silhouette.renderOrder = 4;
        group.add(silhouette);

        // === Horizon glow line ===
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 512;
        glowCanvas.height = 64;
        const gCtx = glowCanvas.getContext('2d');

        const glowGradient = gCtx.createLinearGradient(0, 0, 0, 64);
        glowGradient.addColorStop(0, 'rgba(30, 40, 80, 0)');
        glowGradient.addColorStop(0.4, 'rgba(40, 55, 100, 0.15)');
        glowGradient.addColorStop(0.7, 'rgba(20, 30, 60, 0.08)');
        glowGradient.addColorStop(1, 'rgba(10, 15, 30, 0)');
        gCtx.fillStyle = glowGradient;
        gCtx.fillRect(0, 0, 512, 64);

        const glowTexture = new THREE.CanvasTexture(glowCanvas);
        glowTexture.wrapS = THREE.RepeatWrapping;

        const glowMat = new THREE.MeshBasicMaterial({
            map: glowTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const glowGeom = new THREE.CylinderGeometry(833, 833, 50, 64, 1, true);
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        glowMesh.position.y = 20;
        glowMesh.renderOrder = 5;
        group.add(glowMesh);

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
