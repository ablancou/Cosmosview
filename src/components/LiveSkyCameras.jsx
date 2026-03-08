import React from 'react';

/**
 * LiveSkyCameras — Panel showing links to free public all-sky cameras
 * from observatories around the world. Opens in new tabs.
 */

const CAMERAS = [
    {
        name: 'Subaru Telescope',
        location: 'Mauna Kea, Hawaii',
        flag: '🇺🇸',
        desc: 'Live video stream from 4,200m on Mauna Kea',
        url: 'https://www.naoj.org/Observing/Telescope/skymon.html',
        type: 'Live Video',
        color: '#4ecdc4',
    },
    {
        name: 'Lowell Observatory',
        location: 'Flagstaff, Arizona',
        flag: '🇺🇸',
        desc: 'All-sky image updated every minute at night',
        url: 'https://lowell.edu/research/research-facilities/ldt/ldt-all-sky-camera/',
        type: 'Live Image',
        color: '#45b7d1',
    },
    {
        name: 'All-Sky Camera Project',
        location: 'Sardinia, Italy',
        flag: '🇮🇹',
        desc: 'Live feed with timelapse and keograms',
        url: 'https://allskycameraproject.com',
        type: 'Live Video',
        color: '#96ceb4',
    },
    {
        name: 'IRF All-Sky Camera',
        location: 'Kiruna, Sweden',
        flag: '🇸🇪',
        desc: 'Aurora monitoring all-sky camera near Arctic',
        url: 'https://www.irf.se/allsky/',
        type: 'Aurora Cam',
        color: '#a8e6cf',
    },
    {
        name: 'ESO Paranal Webcam',
        location: 'Atacama, Chile',
        flag: '🇨🇱',
        desc: 'Views from the world\'s best observatory site',
        url: 'https://www.eso.org/public/live-webcams/',
        type: 'Webcam',
        color: '#dda0dd',
    },
    {
        name: 'Universe Monitor',
        location: 'Global Network',
        flag: '🌍',
        desc: 'Aggregated feeds from observatories worldwide',
        url: 'https://universemonitor.com',
        type: 'Directory',
        color: '#ffd93d',
    },
    {
        name: 'CFHT Sky Camera',
        location: 'Mauna Kea, Hawaii',
        flag: '🇺🇸',
        desc: 'Canada-France-Hawaii Telescope all-sky view',
        url: 'https://www.cfht.hawaii.edu/en/gallery/cloudcams/',
        type: 'Live Image',
        color: '#6bcb77',
    },
    {
        name: 'McDonald Observatory',
        location: 'Texas, USA',
        flag: '🇺🇸',
        desc: 'Dark skies of west Texas all-sky camera',
        url: 'https://mcdonaldobservatory.org/research/telescopes',
        type: 'Live Image',
        color: '#ff6b6b',
    },
];

export default function LiveSkyCameras({ open, onClose }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, rgba(15,20,40,0.97), rgba(10,15,30,0.98))',
                    border: '1px solid rgba(100,140,255,0.15)',
                    boxShadow: '0 0 60px rgba(80,120,255,0.12)',
                }}
            >
                {/* Header */}
                <div className="p-5 pb-3" style={{ borderBottom: '1px solid rgba(100,140,255,0.1)' }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">🌐</span>
                            Live Observatory Cameras
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Free public all-sky cameras from observatories around the world
                    </p>
                </div>

                {/* Camera list */}
                <div className="p-4 overflow-y-auto space-y-2" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                    {CAMERAS.map((cam, i) => (
                        <a
                            key={i}
                            href={cam.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3.5 rounded-xl transition-all hover:scale-[1.01] group"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(100,140,255,0.08)',
                                animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-2xl shrink-0">{cam.flag}</span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                                                {cam.name}
                                            </h3>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                                                style={{
                                                    background: `${cam.color}20`,
                                                    color: cam.color,
                                                    border: `1px solid ${cam.color}30`,
                                                }}
                                            >
                                                {cam.type}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500">{cam.location}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{cam.desc}</p>
                                    </div>
                                </div>
                                <span className="text-gray-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2">
                                    ↗
                                </span>
                            </div>
                        </a>
                    ))}

                    {/* Disclaimer */}
                    <div
                        className="mt-3 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(255,200,50,0.06)',
                            border: '1px solid rgba(255,200,50,0.1)',
                        }}
                    >
                        <p className="text-xs text-gray-400">
                            ⚠️ Camera availability depends on time of day, weather, and maintenance.
                            Feeds are operated by their respective observatories.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
