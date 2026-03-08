import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Gyroscope/DeviceOrientation hook — uses the device's gyroscope/accelerometer
 * to control the sky camera. When active, tilt your phone to look around.
 *
 * iOS requires permission prompt. Android works automatically.
 * Falls back gracefully if:
 * - Not on a mobile device
 * - Permission denied
 * - DeviceOrientation API not available
 */
export default function useGyroscope(cameraRef) {
    const gyroEnabled = useAppStore((s) => s.gyroscope);
    const orientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

    const handleOrientation = useCallback((event) => {
        if (!cameraRef?.current || !gyroEnabled) return;

        const { alpha, beta, gamma } = event;
        if (alpha == null || beta == null) return;

        orientationRef.current = { alpha, beta, gamma };

        // Convert device orientation to camera rotation
        // alpha = compass heading (0-360)
        // beta = front-back tilt (-180 to 180)
        // gamma = left-right tilt (-90 to 90)
        const camera = cameraRef.current;

        // Convert to radians
        const alphaRad = (alpha * Math.PI) / 180;
        const betaRad = (beta * Math.PI) / 180;
        const gammaRad = (gamma * Math.PI) / 180;

        // Set camera rotation using Euler angles
        // Adjust for phone being held vertically (portrait)
        camera.rotation.set(
            betaRad - Math.PI / 2, // Look up when phone tilts back
            alphaRad,              // Compass heading
            -gammaRad,             // Device twist
            'YXZ'
        );
    }, [cameraRef, gyroEnabled]);

    useEffect(() => {
        if (!gyroEnabled) return;

        // iOS 13+ requires explicit permission
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then((response) => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                    }
                })
                .catch(console.error);
        } else if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [gyroEnabled, handleOrientation]);
}
