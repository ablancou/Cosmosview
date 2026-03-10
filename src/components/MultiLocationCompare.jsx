import React, { useState } from 'react';
import { LocationProvider } from '../contexts/LocationContext';
import SkyCanvas from './SkyCanvas';
import cityList from '../utils/cityList';
import { useTranslation } from 'react-i18next';

export default function MultiLocationCompare({ onClose }) {
    const { t } = useTranslation();
    const [locationA, setLocationA] = useState(cityList.find(c => c.name === 'New York') || cityList[0]);
    const [locationB, setLocationB] = useState(cityList.find(c => c.name === 'Tokyo') || cityList[1]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-row bg-cosmos-bg animate-in fade-in duration-500 overflow-hidden">
            {/* Split A */}
            <div className="relative flex-1 border-r-2 border-cosmos-border/50">
                <div className="absolute top-6 left-6 z-10 py-2 px-3 bg-cosmos-ui/80 backdrop-blur-md rounded-lg border border-cosmos-border shadow-lg">
                    <select
                        value={locationA.name}
                        onChange={(e) => setLocationA(cityList.find(c => c.name === e.target.value))}
                        className="bg-transparent text-white outline-none font-bold text-lg cursor-pointer"
                    >
                        {cityList.map(city => (
                            <option key={city.name} value={city.name} className="bg-cosmos-bg text-base">{city.name}, {city.country}</option>
                        ))}
                    </select>
                </div>
                <LocationProvider location={locationA}>
                    <SkyCanvas />
                </LocationProvider>
            </div>

            {/* Split B */}
            <div className="relative flex-1">
                <div className="absolute top-6 right-24 z-10 py-2 px-3 bg-cosmos-ui/80 backdrop-blur-md rounded-lg border border-cosmos-border shadow-lg">
                    <select
                        value={locationB.name}
                        onChange={(e) => setLocationB(cityList.find(c => c.name === e.target.value))}
                        className="bg-transparent text-white outline-none font-bold text-lg cursor-pointer"
                    >
                        {cityList.map(city => (
                            <option key={city.name} value={city.name} className="bg-cosmos-bg text-base">{city.name}, {city.country}</option>
                        ))}
                    </select>
                </div>
                <LocationProvider location={locationB}>
                    <SkyCanvas />
                </LocationProvider>
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-cosmos-ui/80 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors shadow-lg backdrop-blur-md border border-cosmos-border"
                title={t('actions.close', 'Close')}
            >
                ✕
            </button>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-white/80 bg-black/70 px-6 py-3 rounded-xl backdrop-blur-md text-sm border border-white/20 shadow-xl flex flex-col items-center gap-1">
                <span className="font-mono tracking-wide text-xs text-cosmos-accent">// SYNCED MULTI-LOCATION</span>
                <span className="text-center w-80 text-[13px]">
                    Drag to pan. Use the main clock dial below to time&#8209;lapse both skies simultaneously.
                </span>
            </div>
        </div>
    );
}
