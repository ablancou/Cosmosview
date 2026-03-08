import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import useAppStore from '../store/useAppStore';
import { useTranslation } from 'react-i18next';

/**
 * Real-time ISS and satellite tracker.
 * Uses TLE (Two-Line Element) data from CelesTrak (public domain).
 * satellite.js performs SGP4 orbital propagation.
 *
 * TLE data source: CelesTrak (https://celestrak.org)
 * License: Public domain orbital data
 */

// Embedded TLE data for key satellites (updated periodically)
// These are representative TLEs — in production you'd fetch live data
const SATELLITE_TLES = [
    {
        name: 'ISS (ZARYA)',
        tle1: '1 25544U 98067A   26060.50000000  .00016717  00000-0  10270-3 0  9002',
        tle2: '2 25544  51.6400 200.0000 0007417  50.0000 310.0000 15.49000000400000',
        color: 0x00ff88,
        size: 6,
        trailColor: 0x00ff88,
        showLabel: true,
        showOrbit: true,
    },
    {
        name: 'Hubble Space Telescope',
        tle1: '1 20580U 90037B   26060.50000000  .00001200  00000-0  60000-4 0  9002',
        tle2: '2 20580  28.4700 260.0000 0002850 120.0000 240.0000 15.09100000500000',
        color: 0xffaa00,
        size: 4,
        trailColor: 0xffaa00,
        showLabel: true,
        showOrbit: false,
    },
    {
        name: 'Tiangong',
        tle1: '1 48274U 21035A   26060.50000000  .00020000  00000-0  12000-3 0  9002',
        tle2: '2 48274  41.4700 150.0000 0005200  80.0000 280.0000 15.62000000200000',
        color: 0xff4444,
        size: 5,
        trailColor: 0xff4444,
        showLabel: true,
        showOrbit: false,
    },
    {
        name: 'Starlink-1007',
        tle1: '1 44713U 19074A   26060.50000000  .00002000  00000-0  10000-3 0  9002',
        tle2: '2 44713  53.0500 100.0000 0001500  90.0000 270.0000 15.06400000300000',
        color: 0x8888ff,
        size: 2,
        trailColor: 0x4444aa,
        showLabel: false,
        showOrbit: false,
    },
    {
        name: 'Starlink-1019',
        tle1: '1 44725U 19074B   26060.50000000  .00002100  00000-0  10500-3 0  9002',
        tle2: '2 44725  53.0500 102.0000 0001600  92.0000 268.0000 15.06400000300000',
        color: 0x8888ff,
        size: 2,
        trailColor: 0x4444aa,
        showLabel: false,
        showOrbit: false,
    },
    {
        name: 'Starlink-1030',
        tle1: '1 44736U 19074C   26060.50000000  .00002200  00000-0  11000-3 0  9002',
        tle2: '2 44736  53.0500 104.0000 0001700  94.0000 266.0000 15.06400000300000',
        color: 0x8888ff,
        size: 2,
        trailColor: 0x4444aa,
        showLabel: false,
        showOrbit: false,
    },
];

/**
 * Convert satellite ECI position to celestial sphere position for rendering.
 */
function eciToSkyPosition(positionEci, gmst, observerLat, observerLon, radius) {
    // Convert ECI to ECF (Earth-Centered Fixed)
    const ecf = satellite.eciToEcf(positionEci, gmst);

    // Convert ECF to observer look angles
    const observerGd = {
        latitude: satellite.degreesToRadians(observerLat),
        longitude: satellite.degreesToRadians(observerLon),
        height: 0,
    };

    const lookAngles = satellite.ecfToLookAngles(observerGd, ecf);

    // Convert azimuth/elevation to 3D position on sky sphere
    const az = lookAngles.azimuth; // radians
    const el = lookAngles.elevation; // radians

    // Only show if above horizon
    if (el < 0) return null;

    const x = radius * Math.cos(el) * Math.sin(az);
    const y = radius * Math.sin(el);
    const z = -radius * Math.cos(el) * Math.cos(az);

    return { x, y, z, azimuth: az, elevation: el, range: lookAngles.rangeSat };
}

export default function SatelliteTracker({ scene }) {
    const groupRef = useRef(null);
    const spritesRef = useRef({});
    const orbitsRef = useRef({});
    const animRef = useRef(null);
    const location = useAppStore((s) => s.location);
    const time = useAppStore((s) => s.time);
    const { t } = useTranslation();

    useEffect(() => {
        if (!scene) return;

        const group = new THREE.Group();
        groupRef.current = group;

        // Create sprites for each satellite
        SATELLITE_TLES.forEach((sat) => {
            // Satellite dot
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            const color = new THREE.Color(sat.color);

            // Glowing dot
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 1)`);
            gradient.addColorStop(0.3, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0.7)`);
            gradient.addColorStop(1, `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

            const sprite = new THREE.Sprite(material);
            sprite.scale.set(sat.size, sat.size, 1);
            sprite.renderOrder = 30;
            sprite.visible = false;
            group.add(sprite);

            // Label
            let labelSprite = null;
            if (sat.showLabel) {
                const labelCanvas = document.createElement('canvas');
                labelCanvas.width = 256;
                labelCanvas.height = 32;
                const lCtx = labelCanvas.getContext('2d');
                lCtx.clearRect(0, 0, 256, 32);
                lCtx.font = 'bold 14px Inter, sans-serif';
                lCtx.fillStyle = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, 0.9)`;
                lCtx.textAlign = 'center';
                lCtx.textBaseline = 'middle';
                lCtx.fillText(sat.name, 128, 16);

                const labelTexture = new THREE.CanvasTexture(labelCanvas);
                const labelMat = new THREE.SpriteMaterial({
                    map: labelTexture,
                    transparent: true,
                    depthTest: false,
                });
                labelSprite = new THREE.Sprite(labelMat);
                labelSprite.scale.set(50, 6, 1);
                labelSprite.renderOrder = 31;
                labelSprite.visible = false;
                group.add(labelSprite);
            }

            // ISS orbit path
            let orbitLine = null;
            if (sat.showOrbit) {
                const orbitMat = new THREE.LineBasicMaterial({
                    color: sat.trailColor,
                    transparent: true,
                    opacity: 0.25,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                });
                const orbitGeom = new THREE.BufferGeometry();
                const orbitPositions = new Float32Array(360 * 3);
                orbitGeom.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
                orbitLine = new THREE.Line(orbitGeom, orbitMat);
                orbitLine.renderOrder = 29;
                group.add(orbitLine);
            }

            // Parse TLE
            let satrec = null;
            try {
                satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
            } catch (e) {
                console.warn(`Failed to parse TLE for ${sat.name}:`, e);
            }

            spritesRef.current[sat.name] = {
                sprite,
                labelSprite,
                orbitLine,
                satrec,
                config: sat,
            };
        });

        scene.add(group);

        // Animation loop — update satellite positions
        const updatePositions = () => {
            animRef.current = requestAnimationFrame(updatePositions);

            const now = time.current || new Date();
            const gmst = satellite.gstime(now);

            Object.values(spritesRef.current).forEach((satData) => {
                if (!satData.satrec) return;

                try {
                    const positionAndVelocity = satellite.propagate(satData.satrec, now);
                    if (!positionAndVelocity.position) {
                        satData.sprite.visible = false;
                        if (satData.labelSprite) satData.labelSprite.visible = false;
                        return;
                    }

                    const skyPos = eciToSkyPosition(
                        positionAndVelocity.position,
                        gmst,
                        location.lat,
                        location.lon,
                        820
                    );

                    if (skyPos) {
                        satData.sprite.position.set(skyPos.x, skyPos.y, skyPos.z);
                        satData.sprite.visible = true;

                        if (satData.labelSprite) {
                            satData.labelSprite.position.set(skyPos.x, skyPos.y + 8, skyPos.z);
                            satData.labelSprite.visible = true;
                        }
                    } else {
                        satData.sprite.visible = false;
                        if (satData.labelSprite) satData.labelSprite.visible = false;
                    }

                    // Update orbit path
                    if (satData.orbitLine && satData.config.showOrbit) {
                        const positions = satData.orbitLine.geometry.attributes.position.array;
                        let validPoints = 0;

                        for (let i = 0; i < 360; i++) {
                            const futureTime = new Date(now.getTime() + i * 16000); // ~90 min orbit
                            const futureGmst = satellite.gstime(futureTime);

                            try {
                                const futurePosVel = satellite.propagate(satData.satrec, futureTime);
                                if (futurePosVel.position) {
                                    const futurePos = eciToSkyPosition(
                                        futurePosVel.position,
                                        futureGmst,
                                        location.lat,
                                        location.lon,
                                        815
                                    );

                                    if (futurePos) {
                                        positions[validPoints * 3] = futurePos.x;
                                        positions[validPoints * 3 + 1] = futurePos.y;
                                        positions[validPoints * 3 + 2] = futurePos.z;
                                        validPoints++;
                                    }
                                }
                            } catch (e) {
                                break;
                            }
                        }

                        satData.orbitLine.geometry.setDrawRange(0, validPoints);
                        satData.orbitLine.geometry.attributes.position.needsUpdate = true;
                    }
                } catch (e) {
                    satData.sprite.visible = false;
                    if (satData.labelSprite) satData.labelSprite.visible = false;
                }
            });
        };

        updatePositions();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            scene.remove(group);
            group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            spritesRef.current = {};
        };
    }, [scene, location.lat, location.lon, time.current]);

    return null;
}
