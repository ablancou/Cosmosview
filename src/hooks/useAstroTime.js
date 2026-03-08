import { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Custom hook that manages astronomical time.
 * Supports time-lapse mode with configurable speed multiplier.
 * At speed=1: updates every 10 seconds (real-time)
 * At speed>1: updates every second to show smooth time-lapse
 */
export default function useAstroTime() {
    const intervalRef = useRef(null);
    const updateCurrentTime = useAppStore((s) => s.updateCurrentTime);
    const playing = useAppStore((s) => s.time.playing);
    const speed = useAppStore((s) => s.time.speed);

    useEffect(() => {
        // Initial update
        updateCurrentTime();

        if (playing) {
            // Faster tick rate when in time-lapse mode
            const tickInterval = speed > 1 ? 1000 : 10000;
            intervalRef.current = setInterval(() => {
                updateCurrentTime();
            }, tickInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [playing, speed, updateCurrentTime]);

    return null;
}
