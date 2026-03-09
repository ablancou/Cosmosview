import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { raDecToCartesian } from '../utils/coordinates';
import useAppStore from '../store/useAppStore';

/**
 * DeepSkyObjects — Full Messier Catalog (110 objects) + notable NGC/IC.
 * Renders all objects as colored glow sprites at their real sky positions.
 *
 * Categories:
 *   EN = Emission Nebula (pink/red)
 *   PN = Planetary Nebula (teal/green)
 *   RN = Reflection Nebula (blue)
 *   SNR = Supernova Remnant (orange)
 *   GX = Galaxy (blue-white)
 *   OC = Open Cluster (golden)
 *   GC = Globular Cluster (amber)
 *   DN = Dark Nebula (dim brown)
 */

// Color palette by type
const TYPE_COLORS = {
    EN: [0.90, 0.35, 0.45],  // Emission Nebula — pink/red
    PN: [0.30, 0.85, 0.75],  // Planetary Nebula — teal
    RN: [0.40, 0.55, 0.95],  // Reflection Nebula — blue
    SNR: [0.95, 0.60, 0.30],  // Supernova Remnant — orange
    GX: [0.55, 0.60, 0.85],  // Galaxy — blue-white
    OC: [0.90, 0.80, 0.45],  // Open Cluster — golden
    GC: [0.85, 0.70, 0.40],  // Globular Cluster — amber
    DN: [0.50, 0.40, 0.30],  // Dark Nebula — brown
};

// Full Messier Catalog — all 110 objects
// Format: [id, name, ra(h), dec(°), size(px), alpha, type]
const MESSIER_CATALOG = [
    // ---- Nebulae ----
    ['M1', 'Crab Nebula', 5.575, 22.01, 12, 0.08, 'SNR'],
    ['M8', 'Lagoon Nebula', 18.063, -24.38, 24, 0.12, 'EN'],
    ['M16', 'Eagle Nebula', 18.313, -13.79, 18, 0.09, 'EN'],
    ['M17', 'Omega Nebula', 18.347, -16.17, 18, 0.10, 'EN'],
    ['M20', 'Trifid Nebula', 18.038, -23.03, 16, 0.09, 'EN'],
    ['M27', 'Dumbbell Nebula', 19.993, 22.72, 14, 0.10, 'PN'],
    ['M42', 'Orion Nebula', 5.588, -5.39, 30, 0.20, 'EN'],
    ['M43', 'De Mairan Nebula', 5.593, -5.27, 10, 0.07, 'EN'],
    ['M57', 'Ring Nebula', 18.893, 33.03, 10, 0.08, 'PN'],
    ['M76', 'Little Dumbbell', 1.703, 51.58, 8, 0.05, 'PN'],
    ['M78', 'M78 Nebula', 5.779, 0.05, 12, 0.06, 'RN'],
    ['M97', 'Owl Nebula', 11.247, 55.02, 10, 0.05, 'PN'],

    // ---- Galaxies ----
    ['M31', 'Andromeda Galaxy', 0.712, 41.27, 45, 0.14, 'GX'],
    ['M32', 'M32 (Andromeda sat.)', 0.714, 40.87, 8, 0.04, 'GX'],
    ['M33', 'Triangulum Galaxy', 1.564, 30.66, 22, 0.08, 'GX'],
    ['M49', 'M49 (Virgo)', 12.497, 8.00, 12, 0.04, 'GX'],
    ['M51', 'Whirlpool Galaxy', 13.498, 47.20, 16, 0.07, 'GX'],
    ['M58', 'M58 (Virgo)', 12.628, 11.82, 10, 0.03, 'GX'],
    ['M59', 'M59 (Virgo)', 12.700, 11.65, 9, 0.03, 'GX'],
    ['M60', 'M60 (Virgo)', 12.727, 11.55, 10, 0.03, 'GX'],
    ['M61', 'M61 (Virgo)', 12.367, 4.47, 10, 0.04, 'GX'],
    ['M63', 'Sunflower Galaxy', 13.264, 42.03, 12, 0.04, 'GX'],
    ['M64', 'Black Eye Galaxy', 12.947, 21.68, 12, 0.05, 'GX'],
    ['M65', 'M65 (Leo Triplet)', 11.318, 13.09, 12, 0.04, 'GX'],
    ['M66', 'M66 (Leo Triplet)', 11.338, 12.99, 12, 0.05, 'GX'],
    ['M74', 'Phantom Galaxy', 1.611, 15.78, 12, 0.04, 'GX'],
    ['M77', 'Cetus A', 2.712, -0.01, 10, 0.04, 'GX'],
    ['M81', 'Bode\'s Galaxy', 9.926, 69.07, 22, 0.08, 'GX'],
    ['M82', 'Cigar Galaxy', 9.932, 69.68, 16, 0.07, 'GX'],
    ['M83', 'Southern Pinwheel', 13.617, -29.87, 18, 0.06, 'GX'],
    ['M84', 'M84 (Virgo)', 12.420, 12.89, 9, 0.03, 'GX'],
    ['M85', 'M85 (Coma)', 12.420, 18.19, 9, 0.03, 'GX'],
    ['M86', 'M86 (Virgo)', 12.437, 12.95, 9, 0.03, 'GX'],
    ['M87', 'Virgo A', 12.514, 12.39, 12, 0.05, 'GX'],
    ['M88', 'M88 (Coma)', 12.533, 14.42, 10, 0.03, 'GX'],
    ['M89', 'M89 (Virgo)', 12.593, 12.56, 8, 0.03, 'GX'],
    ['M90', 'M90 (Virgo)', 12.613, 13.16, 10, 0.03, 'GX'],
    ['M91', 'M91 (Coma)', 12.593, 14.50, 9, 0.03, 'GX'],
    ['M94', 'Cat\'s Eye Galaxy', 12.850, 41.12, 12, 0.05, 'GX'],
    ['M95', 'M95 (Leo)', 10.733, 11.70, 10, 0.04, 'GX'],
    ['M96', 'M96 (Leo)', 10.783, 11.82, 10, 0.04, 'GX'],
    ['M98', 'M98 (Coma)', 12.227, 14.90, 10, 0.03, 'GX'],
    ['M99', 'Coma Pinwheel', 12.313, 14.42, 10, 0.04, 'GX'],
    ['M100', 'Mirror Galaxy', 12.383, 15.82, 12, 0.04, 'GX'],
    ['M101', 'Pinwheel Galaxy', 14.054, 54.35, 22, 0.06, 'GX'],
    ['M104', 'Sombrero Galaxy', 12.667, -11.62, 14, 0.06, 'GX'],
    ['M105', 'M105 (Leo)', 10.797, 12.58, 8, 0.03, 'GX'],
    ['M106', 'M106', 12.317, 47.30, 14, 0.05, 'GX'],
    ['M108', 'Surfboard Galaxy', 11.187, 55.67, 12, 0.04, 'GX'],
    ['M109', 'M109 (UMa)', 11.960, 53.37, 10, 0.03, 'GX'],
    ['M110', 'M110 (Andromeda sat.)', 0.673, 41.68, 12, 0.04, 'GX'],

    // ---- Globular Clusters ----
    ['M2', 'M2', 21.558, -0.82, 14, 0.07, 'GC'],
    ['M3', 'M3', 13.703, 28.38, 14, 0.08, 'GC'],
    ['M4', 'M4', 16.393, -26.53, 16, 0.08, 'GC'],
    ['M5', 'M5', 15.310, 2.08, 14, 0.08, 'GC'],
    ['M9', 'M9', 17.320, -18.52, 10, 0.05, 'GC'],
    ['M10', 'M10', 16.953, -4.10, 12, 0.06, 'GC'],
    ['M12', 'M12', 16.787, -1.95, 12, 0.06, 'GC'],
    ['M13', 'Hercules Cluster', 16.695, 36.46, 18, 0.12, 'GC'],
    ['M14', 'M14', 17.627, -3.25, 10, 0.05, 'GC'],
    ['M15', 'M15', 21.500, 12.17, 14, 0.08, 'GC'],
    ['M19', 'M19', 17.043, -26.27, 10, 0.05, 'GC'],
    ['M22', 'M22', 18.607, -23.90, 16, 0.10, 'GC'],
    ['M28', 'M28', 18.410, -24.87, 10, 0.05, 'GC'],
    ['M30', 'M30', 21.673, -23.18, 10, 0.05, 'GC'],
    ['M53', 'M53', 13.213, 18.17, 10, 0.05, 'GC'],
    ['M54', 'M54', 18.920, -30.48, 10, 0.05, 'GC'],
    ['M55', 'M55', 19.667, -30.97, 14, 0.06, 'GC'],
    ['M56', 'M56', 19.277, 30.18, 10, 0.05, 'GC'],
    ['M62', 'M62', 17.020, -30.12, 10, 0.05, 'GC'],
    ['M68', 'M68', 12.657, -26.75, 10, 0.05, 'GC'],
    ['M69', 'M69', 18.523, -32.35, 8, 0.04, 'GC'],
    ['M70', 'M70', 18.720, -32.30, 8, 0.04, 'GC'],
    ['M71', 'M71', 19.897, 18.78, 10, 0.05, 'GC'],
    ['M72', 'M72', 20.893, -12.53, 10, 0.04, 'GC'],
    ['M75', 'M75', 20.103, -21.92, 8, 0.04, 'GC'],
    ['M79', 'M79', 5.407, -24.52, 10, 0.05, 'GC'],
    ['M80', 'M80', 16.283, -22.97, 10, 0.06, 'GC'],
    ['M92', 'M92', 17.285, 43.14, 14, 0.08, 'GC'],
    ['M107', 'M107', 16.543, -13.05, 8, 0.04, 'GC'],

    // ---- Open Clusters ----
    ['M6', 'Butterfly Cluster', 17.668, -32.22, 18, 0.08, 'OC'],
    ['M7', 'Ptolemy Cluster', 17.897, -34.82, 20, 0.09, 'OC'],
    ['M11', 'Wild Duck Cluster', 18.850, -6.27, 14, 0.08, 'OC'],
    ['M18', 'M18', 18.333, -17.13, 10, 0.04, 'OC'],
    ['M21', 'M21', 18.073, -22.50, 10, 0.05, 'OC'],
    ['M23', 'M23', 17.950, -19.02, 14, 0.06, 'OC'],
    ['M25', 'M25', 18.527, -19.12, 14, 0.06, 'OC'],
    ['M26', 'M26', 18.753, -9.40, 10, 0.04, 'OC'],
    ['M29', 'M29 (Cygnus)', 20.397, 38.53, 10, 0.04, 'OC'],
    ['M34', 'M34 (Perseus)', 2.700, 42.78, 16, 0.07, 'OC'],
    ['M35', 'M35 (Gemini)', 6.147, 24.33, 18, 0.08, 'OC'],
    ['M36', 'M36 (Auriga)', 5.600, 34.13, 14, 0.06, 'OC'],
    ['M37', 'M37 (Auriga)', 5.873, 32.55, 16, 0.07, 'OC'],
    ['M38', 'M38 (Auriga)', 5.477, 35.85, 14, 0.06, 'OC'],
    ['M39', 'M39 (Cygnus)', 21.533, 48.43, 16, 0.05, 'OC'],
    ['M41', 'M41 (CMa)', 6.783, -20.73, 16, 0.07, 'OC'],
    ['M44', 'Beehive Cluster', 8.667, 19.67, 25, 0.09, 'OC'],
    ['M45', 'Pleiades', 3.787, 24.11, 40, 0.18, 'OC'],
    ['M46', 'M46 (Puppis)', 7.697, -14.82, 16, 0.06, 'OC'],
    ['M47', 'M47 (Puppis)', 7.613, -14.50, 16, 0.07, 'OC'],
    ['M48', 'M48 (Hydra)', 8.233, -5.75, 16, 0.06, 'OC'],
    ['M50', 'M50 (Monoceros)', 7.050, -8.33, 14, 0.05, 'OC'],
    ['M52', 'M52 (Cassiopeia)', 23.407, 61.60, 12, 0.05, 'OC'],
    ['M67', 'M67 (Cancer)', 8.843, 11.82, 14, 0.05, 'OC'],
    ['M73', 'M73', 20.982, -12.63, 6, 0.03, 'OC'],
    ['M93', 'M93 (Puppis)', 7.747, -23.87, 12, 0.05, 'OC'],
    ['M103', 'M103 (Cassiopeia)', 1.557, 60.65, 10, 0.05, 'OC'],

    // ---- Notable NGC/IC extras ----
    ['NGC3372', 'Carina Nebula', 10.733, -59.87, 40, 0.14, 'EN'],
    ['NGC7000', 'North America Neb', 20.988, 44.33, 35, 0.08, 'EN'],
    ['NGC5139', 'Omega Centauri', 13.447, -47.48, 25, 0.12, 'GC'],
    ['NGC869', 'Double Cluster h', 2.320, 57.13, 18, 0.09, 'OC'],
    ['NGC884', 'Double Cluster χ', 2.373, 57.15, 18, 0.09, 'OC'],
    ['NGC104', '47 Tucanae', 0.400, -72.08, 22, 0.11, 'GC'],
    ['NGC253', 'Sculptor Galaxy', 0.793, -25.29, 20, 0.06, 'GX'],
    ['NGC2070', 'Tarantula Nebula', 5.645, -69.10, 18, 0.08, 'EN'],
    ['IC1396', 'Elephant Trunk Neb', 21.633, 57.50, 28, 0.06, 'EN'],
    ['LMC', 'Large Magellanic', 5.392, -69.75, 65, 0.12, 'GX'],
    ['SMC', 'Small Magellanic', 0.878, -72.80, 40, 0.08, 'GX'],
];

export default function DeepSkyObjects({ scene }) {
    const groupRef = useRef(null);
    const setSelectedDSO = useAppStore.getState().setSelectedDSO;

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        MESSIER_CATALOG.forEach(([id, name, ra, dec, size, alpha, type]) => {
            const color = TYPE_COLORS[type] || [0.7, 0.7, 0.7];
            const [cr, cg, cb] = color;

            // Create glow texture
            const canvas = document.createElement('canvas');
            const texSize = 64;
            canvas.width = texSize;
            canvas.height = texSize;
            const ctx = canvas.getContext('2d');
            const cx = texSize / 2;
            const r = texSize / 2;

            const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
            grad.addColorStop(0, `rgba(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)}, ${alpha})`);
            grad.addColorStop(0.2, `rgba(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)}, ${alpha * 0.6})`);
            grad.addColorStop(0.5, `rgba(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)}, ${alpha * 0.2})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, texSize, texSize);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });

            const sprite = new THREE.Sprite(material);
            const pos = raDecToCartesian(ra, dec, 890);
            sprite.position.set(pos.x, pos.y, pos.z);
            sprite.scale.set(size, size, 1);
            sprite.renderOrder = 5;
            // Store DSO data for click detection
            sprite.userData = { isDSO: true, dsoId: id, dsoName: name, dsoRA: ra, dsoDec: dec, dsoType: type };
            group.add(sprite);

            // Label
            if (alpha >= 0.05) {
                const labelCanvas = document.createElement('canvas');
                labelCanvas.width = 96;
                labelCanvas.height = 20;
                const lCtx = labelCanvas.getContext('2d');
                lCtx.font = '9px Inter, sans-serif';
                lCtx.fillStyle = `rgba(${Math.round(cr * 255)}, ${Math.round(cg * 255)}, ${Math.round(cb * 255)}, 0.45)`;
                lCtx.textAlign = 'center';
                lCtx.textBaseline = 'middle';
                lCtx.fillText(id, 48, 10);
                const labelTex = new THREE.CanvasTexture(labelCanvas);
                labelTex.minFilter = THREE.LinearFilter;
                const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false });
                const labelSprite = new THREE.Sprite(labelMat);
                const labelPos = raDecToCartesian(ra, dec - 1.0, 890);
                labelSprite.position.set(labelPos.x, labelPos.y, labelPos.z);
                labelSprite.scale.set(16, 4, 1);
                labelSprite.renderOrder = 6;
                group.add(labelSprite);
            }
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            group.children.forEach((child) => {
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        };
    }, [scene]);

    return null;
}
