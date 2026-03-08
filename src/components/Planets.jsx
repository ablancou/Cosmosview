import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';
import { raDecToCartesian } from '../utils/coordinates';
import { useTranslation } from 'react-i18next';

/**
 * Planet colors and sizes for rendering.
 */
const PLANET_CONFIG = {
    Sun: { color: 0xffdd44, size: 45, emissive: true },
    Mercury: { color: 0xb5a89a, size: 12, emissive: false },
    Venus: { color: 0xffe8a0, size: 20, emissive: false },
    Mars: { color: 0xff6644, size: 16, emissive: false },
    Jupiter: { color: 0xd4a87a, size: 24, emissive: false },
    Saturn: { color: 0xe8d8a0, size: 22, emissive: false },
};

/**
 * Renders Sun, Moon, and visible planets using astronomy-engine positions.
 */
export default function Planets({ scene }) {
    const groupRef = useRef(null);
    const spritesRef = useRef({});
    const time = useAppStore((s) => s.time);
    const { t } = useTranslation();

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        // Create sprite for each body
        Object.entries(PLANET_CONFIG).forEach(([name, config]) => {
            // Create a canvas texture for the planet
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            // Draw glow
            const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            const color = new THREE.Color(config.color);
            gradient.addColorStop(0, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 1)`);
            gradient.addColorStop(0.2, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0.9)`);
            gradient.addColorStop(0.5, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0.4)`);
            gradient.addColorStop(1, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);

            const texture = new THREE.CanvasTexture(canvas);

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                blending: config.emissive ? THREE.AdditiveBlending : THREE.NormalBlending,
            });

            const sprite = new THREE.Sprite(material);
            sprite.scale.set(config.size, config.size, 1);
            sprite.renderOrder = 15;
            group.add(sprite);
            spritesRef.current[name] = { sprite, texture, canvas };

            // Add label
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 128;
            labelCanvas.height = 32;
            const lCtx = labelCanvas.getContext('2d');
            lCtx.clearRect(0, 0, 128, 32);
            lCtx.font = '14px Inter, sans-serif';
            lCtx.fillStyle = 'rgba(232, 236, 244, 0.7)';
            lCtx.textAlign = 'center';
            lCtx.textBaseline = 'middle';
            const planetKey = name.toLowerCase();
            lCtx.fillText(t(`planets.${planetKey}`, name), 64, 16);

            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            const labelMat = new THREE.SpriteMaterial({
                map: labelTexture,
                transparent: true,
                depthTest: false,
            });
            const labelSprite = new THREE.Sprite(labelMat);
            labelSprite.scale.set(40, 10, 1);
            labelSprite.renderOrder = 16;
            group.add(labelSprite);
            spritesRef.current[name + '_label'] = { sprite: labelSprite, texture: labelTexture, canvas: labelCanvas };
        });

        scene.add(group);

        return () => {
            scene.remove(group);
            Object.values(spritesRef.current).forEach(({ texture, sprite }) => {
                if (texture) texture.dispose();
                if (sprite && sprite.material) sprite.material.dispose();
            });
            spritesRef.current = {};
        };
    }, [scene, t]);

    // Update planet positions based on current time
    useEffect(() => {
        if (!groupRef.current || Object.keys(spritesRef.current).length === 0) return;

        const date = time.current;
        const bodies = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

        bodies.forEach((name) => {
            try {
                const equ = Astronomy.Equator(name, date, new Astronomy.Observer(0, 0, 0), true, true);

                if (equ) {
                    const pos = raDecToCartesian(equ.ra, equ.dec, 870);
                    const spriteData = spritesRef.current[name];
                    if (spriteData) {
                        spriteData.sprite.position.set(pos.x, pos.y, pos.z);
                    }
                    // Position label slightly offset
                    const labelData = spritesRef.current[name + '_label'];
                    if (labelData) {
                        const labelPos = raDecToCartesian(equ.ra, equ.dec - 1.5, 870);
                        labelData.sprite.position.set(labelPos.x, labelPos.y, labelPos.z);
                    }
                }
            } catch (e) {
                // Skip if calculation fails
            }
        });
    }, [time.current]);

    return null;
}
