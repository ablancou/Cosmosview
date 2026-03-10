import React, { createContext, useContext } from 'react';
import useAppStore from '../store/useAppStore';

const LocationContext = createContext(null);

export function LocationProvider({ location, children }) {
    return (
        <LocationContext.Provider value={location}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocationContext() {
    const contextLocation = useContext(LocationContext);
    const storeLocation = useAppStore((s) => s.location);
    return contextLocation || storeLocation;
}
