import { useState, useEffect, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { DEFAULT_CITY } from '../utils/cityList';

/**
 * Custom hook for browser geolocation with city fallback.
 */
export default function useGeolocation() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const setLocation = useAppStore((s) => s.setLocation);

    const detectLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            setLocation(DEFAULT_CITY.lat, DEFAULT_CITY.lon, DEFAULT_CITY.name);
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(
                    position.coords.latitude,
                    position.coords.longitude,
                    'Current Location'
                );
                setLoading(false);
            },
            (err) => {
                console.warn('Geolocation error:', err.message);
                setError(err.message);
                setLocation(DEFAULT_CITY.lat, DEFAULT_CITY.lon, DEFAULT_CITY.name);
                setLoading(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 300000, // Cache for 5 minutes
            }
        );
    }, [setLocation]);

    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    return { loading, error, detectLocation };
}
