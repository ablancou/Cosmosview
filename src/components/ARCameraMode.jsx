import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * ARCameraMode — Augmented Reality mode that overlays the starfield
 * onto the user's camera view using WebRTC getUserMedia.
 *
 * When active:
 *   - Camera feed shown as background <video>
 *   - Three.js canvas becomes transparent
 *   - DeviceOrientation used to align camera with sky
 *
 * Requires HTTPS and user permission.
 */
export default function ARCameraMode({ active, onActivate, onDeactivate }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    const [hasCamera, setHasCamera] = useState(true);

    // Start camera when AR mode is activated
    const startCamera = useCallback(async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.warn('Camera access denied or unavailable:', err.message);
            setError(err.message);
            setHasCamera(false);
            onDeactivate();
        }
    }, [onDeactivate]);

    // Stop camera when AR mode is deactivated
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (active) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [active, startCamera, stopCamera]);

    if (!active) return null;

    return (
        <>
            {/* Camera video feed — behind the transparent 3D canvas */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="fixed inset-0 w-full h-full object-cover z-0"
                style={{ transform: 'scaleX(-1)' }} // Mirror for back cam
            />

            {/* AR mode indicator */}
            <div
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2"
                style={{
                    background: 'rgba(0,200,120,0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0,200,120,0.4)',
                    color: '#00e88a',
                }}
            >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                AR Mode — Point your device at the sky
            </div>

            {/* Error display */}
            {error && (
                <div
                    className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs"
                    style={{
                        background: 'rgba(255,50,50,0.15)',
                        border: '1px solid rgba(255,50,50,0.3)',
                        color: '#ff6666',
                    }}
                >
                    ⚠️ Camera: {error}
                </div>
            )}
        </>
    );
}
