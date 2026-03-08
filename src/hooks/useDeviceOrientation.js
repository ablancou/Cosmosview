import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for DeviceOrientation API (mobile gyroscope).
 * Returns alpha (compass), beta (pitch), gamma (roll).
 * Includes iOS permission request handling.
 */
export default function useDeviceOrientation() {
    const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
    const [supported, setSupported] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const handleOrientation = useCallback((event) => {
        setOrientation({
            alpha: event.alpha || 0,  // Compass direction (0-360)
            beta: event.beta || 0,    // Front-back tilt (-180 to 180)
            gamma: event.gamma || 0,  // Left-right tilt (-90 to 90)
        });
    }, []);

    const requestPermission = useCallback(async () => {
        // iOS 13+ requires explicit permission
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    setPermissionGranted(true);
                    setEnabled(true);
                    window.addEventListener('deviceorientation', handleOrientation, true);
                }
            } catch (err) {
                console.warn('DeviceOrientation permission denied:', err);
            }
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            // Android and older iOS — no permission needed
            setPermissionGranted(true);
            setEnabled(true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }, [handleOrientation]);

    useEffect(() => {
        const isSupported = typeof DeviceOrientationEvent !== 'undefined';
        setSupported(isSupported);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [handleOrientation]);

    const toggle = useCallback(() => {
        if (enabled) {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            setEnabled(false);
        } else {
            if (permissionGranted) {
                window.addEventListener('deviceorientation', handleOrientation, true);
                setEnabled(true);
            } else {
                requestPermission();
            }
        }
    }, [enabled, permissionGranted, handleOrientation, requestPermission]);

    return { orientation, supported, enabled, toggle, requestPermission };
}
