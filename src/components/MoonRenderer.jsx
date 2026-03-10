import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { useLocationContext } from '../contexts/LocationContext';
import useAppStore from '../store/useAppStore';
import { raDecToCartesian } from '../utils/coordinates';

/**
 * High-fidelity Moon renderer with real-time phase illumination.
 * Uses astronomy-engine to compute exact Moon position and phase angle,
 * then renders a textured disc with correct crescent/gibbous shading.
 */
export default function MoonRenderer({ scene }) {
    const groupRef = useRef(null);
    const discRef = useRef(null);
    const materialRef = useRef(null);
    const animRef = useRef(null);
    const time = useAppStore((s) => s.time);
    const location = useLocationContext();

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        // === Generate Moon surface texture on canvas ===
        const texSize = 512;
        const moonCanvas = document.createElement('canvas');
        moonCanvas.width = texSize;
        moonCanvas.height = texSize;
        const ctx = moonCanvas.getContext('2d');

        // Base grey color
        ctx.fillStyle = '#b8b8b0';
        ctx.beginPath();
        ctx.arc(texSize / 2, texSize / 2, texSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Seeded random for consistent crater placement
        let seed = 73;
        const rand = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };

        // Mare (dark areas) — large dark patches
        const mare = [
            { x: 0.42, y: 0.35, r: 0.18, color: '#787878' }, // Mare Imbrium
            { x: 0.55, y: 0.5, r: 0.14, color: '#808080' },  // Mare Serenitatis
            { x: 0.5, y: 0.6, r: 0.16, color: '#7a7a7a' },  // Mare Tranquillitatis
            { x: 0.35, y: 0.55, r: 0.12, color: '#828282' }, // Oceanus Procellarum
            { x: 0.6, y: 0.4, r: 0.08, color: '#858585' },  // Mare Crisium
            { x: 0.45, y: 0.7, r: 0.1, color: '#7e7e7e' },  // Mare Nubium
            { x: 0.58, y: 0.65, r: 0.09, color: '#7c7c7c' },  // Mare Fecunditatis
        ];

        mare.forEach((m) => {
            const cx = m.x * texSize;
            const cy = m.y * texSize;
            const radius = m.r * texSize;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, m.color);
            gradient.addColorStop(0.7, m.color);
            gradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Craters — various sizes
        for (let i = 0; i < 80; i++) {
            const angle = rand() * Math.PI * 2;
            const dist = rand() * texSize * 0.42;
            const cx = texSize / 2 + Math.cos(angle) * dist;
            const cy = texSize / 2 + Math.sin(angle) * dist;
            const radius = rand() * 12 + 2;

            // Crater shadow (darker edge)
            ctx.strokeStyle = `rgba(100, 100, 95, ${rand() * 0.4 + 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Crater bright rim (simulated sunlight)
            ctx.fillStyle = `rgba(200, 200, 195, ${rand() * 0.15 + 0.05})`;
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 1, radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highland bright patches
        for (let i = 0; i < 30; i++) {
            const cx = texSize / 2 + (rand() - 0.5) * texSize * 0.7;
            const cy = texSize / 2 + (rand() - 0.5) * texSize * 0.7;
            const r = rand() * 20 + 5;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            gradient.addColorStop(0, `rgba(210, 210, 200, ${rand() * 0.1 + 0.05})`);
            gradient.addColorStop(1, 'rgba(210, 210, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }

        // Clip to circle
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(texSize / 2, texSize / 2, texSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        const moonTexture = new THREE.CanvasTexture(moonCanvas);
        moonTexture.needsUpdate = true;

        // === Phase shadow shader ===
        const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      uniform sampler2D uMoonTexture;
      uniform float uPhaseAngle;     // 0-360 degrees
      uniform float uIllumination;   // 0.0-1.0
      varying vec2 vUv;

      void main() {
        vec4 texColor = texture2D(uMoonTexture, vUv);

        // Convert UV to polar from center
        vec2 center = vUv - 0.5;
        float dist = length(center) * 2.0;

        // Discard outside moon disc
        if (dist > 1.0) discard;

        // Phase illumination
        // Map the phase angle to a terminator position
        // phaseAngle: 0=new moon, 90=first quarter, 180=full, 270=last quarter
        float pa = uPhaseAngle * 3.14159 / 180.0;

        // The terminator is a great circle; we project it as an ellipse
        float terminatorX = cos(pa);

        // Compare x-coordinate with terminator position
        float nx = center.x * 2.0; // normalized -1 to 1

        // Determine if this pixel is on the illuminated side
        float illumination;
        if (uPhaseAngle < 180.0) {
          // Waxing: illuminated on the right (positive x)
          illumination = smoothstep(terminatorX - 0.05, terminatorX + 0.05, nx);
        } else {
          // Waning: illuminated on the left (negative x)
          illumination = smoothstep(terminatorX + 0.05, terminatorX - 0.05, nx);
        }

        // Earthshine — faint illumination on the dark side
        float earthshine = 0.06;

        // Mix lit and shadowed
        vec3 litColor = texColor.rgb * 1.2;
        vec3 shadowColor = texColor.rgb * earthshine;
        vec3 finalColor = mix(shadowColor, litColor, illumination);

        // Limb darkening
        float limb = 1.0 - pow(dist, 3.0) * 0.3;
        finalColor *= limb;

        // Soft edge antialiasing
        float edgeAlpha = 1.0 - smoothstep(0.95, 1.0, dist);

        // Glow around the moon
        float glow = exp(-dist * dist * 3.0) * 0.15 * uIllumination;

        gl_FragColor = vec4(finalColor + glow, edgeAlpha * texColor.a);
      }
    `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uMoonTexture: { value: moonTexture },
                uPhaseAngle: { value: 0 },
                uIllumination: { value: 0.5 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        materialRef.current = material;

        // Moon disc — larger than planet sprites
        const geometry = new THREE.PlaneGeometry(30, 30);
        const disc = new THREE.Mesh(geometry, material);
        disc.renderOrder = 14;
        group.add(disc);
        discRef.current = disc;

        // Moon label
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128;
        labelCanvas.height = 32;
        const lCtx = labelCanvas.getContext('2d');
        lCtx.clearRect(0, 0, 128, 32);
        lCtx.font = '14px Inter, sans-serif';
        lCtx.fillStyle = 'rgba(232, 236, 244, 0.7)';
        lCtx.textAlign = 'center';
        lCtx.textBaseline = 'middle';
        lCtx.fillText('☽ Moon', 64, 16);

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

        scene.add(group);

        // Animation — keep moon billboard facing camera
        const updateMoon = () => {
            animRef.current = requestAnimationFrame(updateMoon);

            const date = time.current;

            try {
                // Get Moon equatorial position
                const observer = new Astronomy.Observer(location.lat, location.lon, 0);
                const equ = Astronomy.Equator('Moon', date, observer, true, true);

                if (equ) {
                    const pos = raDecToCartesian(equ.ra, equ.dec, 860);
                    disc.position.set(pos.x, pos.y, pos.z);
                    labelSprite.position.set(pos.x, pos.y - 20, pos.z);

                    // Billboard — face the camera (origin)
                    disc.lookAt(0, 0, 0);
                }

                // Get Moon phase
                const phase = Astronomy.MoonPhase(date);
                material.uniforms.uPhaseAngle.value = phase;

                // Get illumination fraction
                const illum = Astronomy.Illumination('Moon', date);
                material.uniforms.uIllumination.value = illum.phase_fraction;
            } catch (e) {
                // Fallback
            }
        };

        updateMoon();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(group);
            moonTexture.dispose();
            material.dispose();
            geometry.dispose();
            labelTexture.dispose();
            labelMat.dispose();
        };
    }, [scene, time.current, location]);

    return null;
}
