import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import useAppStore from '../store/useAppStore';

/**
 * 3D Solar System Orrery — Interactive miniature solar system with real planet positions.
 * Renders all 8 planets orbiting the Sun with accurate relative positions computed
 * from astronomy-engine. Includes orbit lines, planet labels, and rotation.
 */

const PLANET_DATA = [
    { name: 'Mercury', color: '#b5a7a7', size: 2.5, orbitRadius: 40, speed: 4.15 },
    { name: 'Venus', color: '#e8cda0', size: 4, orbitRadius: 60, speed: 1.62 },
    { name: 'Earth', color: '#6b93d6', size: 4.2, orbitRadius: 85, speed: 1.0 },
    { name: 'Mars', color: '#c1440e', size: 3, orbitRadius: 110, speed: 0.53 },
    { name: 'Jupiter', color: '#c88b3a', size: 8, orbitRadius: 150, speed: 0.084 },
    { name: 'Saturn', color: '#ead6b8', size: 7, orbitRadius: 195, speed: 0.034 },
    { name: 'Uranus', color: '#d1e7e7', size: 5, orbitRadius: 230, speed: 0.012 },
    { name: 'Neptune', color: '#5b5ddf', size: 4.8, orbitRadius: 260, speed: 0.006 },
];

export default function SolarSystemOrrery({ open, onClose }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const frameRef = useRef(null);
    const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
    const rotRef = useRef({ theta: 0.6, phi: 0.8 });
    const time = useAppStore((s) => s.time);

    useEffect(() => {
        if (!open || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 1, 2000);
        camera.position.set(0, 200, 350);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Lighting
        const ambient = new THREE.AmbientLight(0x222233, 0.5);
        scene.add(ambient);

        const sunLight = new THREE.PointLight(0xffffff, 2, 600);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(12, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Sun glow
        const glowGeometry = new THREE.SphereGeometry(16, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.15,
        });
        scene.add(new THREE.Mesh(glowGeometry, glowMaterial));

        // Planets
        const planetMeshes = [];
        const now = time.current;

        PLANET_DATA.forEach((p) => {
            // Orbit ring
            const orbitGeometry = new THREE.RingGeometry(p.orbitRadius - 0.3, p.orbitRadius + 0.3, 128);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x444466,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
            });
            const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbitMesh.rotation.x = -Math.PI / 2;
            scene.add(orbitMesh);

            // Planet sphere
            const geometry = new THREE.SphereGeometry(p.size, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(p.color),
                roughness: 0.7,
                metalness: 0.1,
            });
            const mesh = new THREE.Mesh(geometry, material);

            // Get real position from astronomy-engine
            try {
                const body = p.name === 'Earth' ? null : p.name;
                if (body) {
                    const pos = Astronomy.HelioVector(body, now);
                    const scale = p.orbitRadius / (pos.x * pos.x + pos.y * pos.y + pos.z * pos.z) ** 0.5 || p.orbitRadius;
                    const angle = Math.atan2(pos.y, pos.x);
                    mesh.position.set(
                        Math.cos(angle) * p.orbitRadius,
                        0,
                        Math.sin(angle) * p.orbitRadius
                    );
                } else {
                    // Earth at 0 degrees
                    const earthPos = Astronomy.HelioVector('Earth', now);
                    const angle = Math.atan2(earthPos.y, earthPos.x);
                    mesh.position.set(
                        Math.cos(angle) * p.orbitRadius,
                        0,
                        Math.sin(angle) * p.orbitRadius
                    );
                }
            } catch (e) {
                const angle = Math.random() * Math.PI * 2;
                mesh.position.set(Math.cos(angle) * p.orbitRadius, 0, Math.sin(angle) * p.orbitRadius);
            }

            scene.add(mesh);

            // Label
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 128;
            labelCanvas.height = 32;
            const ctx = labelCanvas.getContext('2d');
            ctx.fillStyle = p.color;
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.name, 64, 16);
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            labelTexture.minFilter = THREE.LinearFilter;
            const labelSprite = new THREE.Sprite(
                new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false })
            );
            labelSprite.position.copy(mesh.position);
            labelSprite.position.y += p.size + 6;
            labelSprite.scale.set(30, 8, 1);
            scene.add(labelSprite);

            // Saturn rings
            if (p.name === 'Saturn') {
                const ringGeo = new THREE.RingGeometry(p.size * 1.3, p.size * 2, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xead6b8,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide,
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2.5;
                ring.position.copy(mesh.position);
                scene.add(ring);
            }

            planetMeshes.push({ mesh, labelSprite, data: p });
        });

        // Background stars
        const bgStarGeometry = new THREE.BufferGeometry();
        const bgStarPositions = [];
        for (let i = 0; i < 500; i++) {
            const r = 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            bgStarPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        bgStarGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgStarPositions, 3));
        const bgStarMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.5 });
        scene.add(new THREE.Points(bgStarGeometry, bgStarMaterial));

        // Animation
        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);

            // Slow auto-rotation
            rotRef.current.theta += 0.001;

            const dist = 400;
            const { theta, phi } = rotRef.current;
            camera.position.set(
                dist * Math.sin(phi) * Math.sin(theta),
                dist * Math.cos(phi),
                dist * Math.sin(phi) * Math.cos(theta)
            );
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        // Pointer controls
        const onPointerDown = (e) => {
            mouseRef.current.isDown = true;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };
        const onPointerMove = (e) => {
            if (!mouseRef.current.isDown) return;
            const dx = e.clientX - mouseRef.current.lastX;
            const dy = e.clientY - mouseRef.current.lastY;
            rotRef.current.theta += dx * 0.005;
            rotRef.current.phi = Math.max(0.2, Math.min(Math.PI - 0.2, rotRef.current.phi + dy * 0.005));
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };
        const onPointerUp = () => { mouseRef.current.isDown = false; };

        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointerleave', onPointerUp);

        return () => {
            cancelAnimationFrame(frameRef.current);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointerleave', onPointerUp);
            renderer.dispose();
            scene.clear();
        };
    }, [open, time.current]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 w-[740px] max-w-[95vw] h-[520px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(8,8,25,0.98), rgba(15,12,35,0.98))',
                    border: '1px solid rgba(126,184,247,0.15)',
                }}
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 px-5 py-3 flex items-start gap-4"
                    style={{ background: 'linear-gradient(180deg, rgba(8,8,25,0.9), transparent)' }}
                >
                    <button onClick={onClose} className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-cosmos-muted hover:text-white touch-manipulation mt-1">
                        <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-cosmos-accent">☀️ Solar System</h2>
                        <p className="text-[10px] text-cosmos-muted">Real-time planet positions • Drag to rotate</p>
                    </div>
                </div>

                {/* 3D Canvas */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                />

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 py-2 flex items-center gap-3 text-[9px] text-cosmos-muted/50"
                    style={{ background: 'linear-gradient(0deg, rgba(8,8,25,0.9), transparent)' }}
                >
                    <span>Positions computed from astronomy-engine</span>
                    <span>•</span>
                    <span>{time.current.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>
        </div>
    );
}
