import { create } from 'zustand';
import { DEFAULT_CITY } from '../utils/cityList';

const useAppStore = create((set, get) => ({
    // Location
    location: {
        lat: DEFAULT_CITY.lat,
        lon: DEFAULT_CITY.lon,
        city: DEFAULT_CITY.name,
    },
    setLocation: (lat, lon, city) =>
        set({ location: { lat, lon, city: city || '' } }),

    // Time
    time: {
        current: new Date(),
        offset: 0, // milliseconds offset from real time
        playing: true,
        speed: 1, // 1 = real-time, 10 = 10x, 60 = 1min/s, 360 = 6min/s
    },
    setTimeOffset: (offset) =>
        set((state) => ({
            time: { ...state.time, offset },
        })),
    togglePlaying: () =>
        set((state) => ({
            time: { ...state.time, playing: !state.time.playing },
        })),
    setPlaying: (playing) =>
        set((state) => ({
            time: { ...state.time, playing },
        })),
    setTimeSpeed: (speed) =>
        set((state) => ({
            time: { ...state.time, speed },
        })),
    updateCurrentTime: () => {
        const state = get();
        if (state.time.playing) {
            if (state.time.speed === 1) {
                // Real-time: sync with wall clock + offset
                set({
                    time: {
                        ...state.time,
                        current: new Date(Date.now() + state.time.offset),
                    },
                });
            } else {
                // Time-lapse: advance offset by speed * tick interval
                const advanceMs = state.time.speed * 1000; // speed seconds per tick
                const newOffset = state.time.offset + advanceMs;
                set({
                    time: {
                        ...state.time,
                        offset: newOffset,
                        current: new Date(Date.now() + newOffset),
                    },
                });
            }
        }
    },
    jumpToNow: () =>
        set((state) => ({
            time: { ...state.time, offset: 0, current: new Date(), playing: true, speed: 1 },
        })),

    // Layers
    layers: {
        stars: true,
        constellations: true,
        constellationNames: true,
        equatorialGrid: false,
        altAzGrid: false,
        milkyWay: true,
        planets: true,
        atmosphere: true,
        cardinalDirections: true,
        satellites: true,
        ground: true,
        aurora: false,
        ecliptic: false,
    },
    toggleLayer: (layer) =>
        set((state) => ({
            layers: { ...state.layers, [layer]: !state.layers[layer] },
        })),

    // Selected Star
    selectedStar: null,
    setSelectedStar: (star) => set({ selectedStar: star }),
    clearSelectedStar: () => set({ selectedStar: null }),

    // Selected Celestial Body (planet/Moon)
    selectedBody: null,
    setSelectedBody: (body) => set({ selectedBody: body }),
    clearSelectedBody: () => set({ selectedBody: null }),

    selectedDSO: null,
    setSelectedDSO: (dso) => set({ selectedDSO: dso }),
    clearSelectedDSO: () => set({ selectedDSO: null }),

    // Night Vision Mode (red filter for real stargazing)
    nightVision: false,
    toggleNightVision: () =>
        set((state) => ({ nightVision: !state.nightVision })),

    // Auto-rotate (screensaver mode)
    autoRotate: false,
    toggleAutoRotate: () =>
        set((state) => ({ autoRotate: !state.autoRotate })),

    // Gyroscope
    gyroscope: false,
    toggleGyroscope: () => set((state) => ({ gyroscope: !state.gyroscope })),

    // Star Trails
    starTrails: false,
    toggleStarTrails: () => set((state) => ({ starTrails: !state.starTrails })),

    // Selected Constellation
    selectedConstellation: null,
    setSelectedConstellation: (id) => set({ selectedConstellation: id }),
    clearSelectedConstellation: () => set({ selectedConstellation: null }),

    // Dark Mode
    darkMode: (() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('od-dark-mode');
            if (stored !== null) return stored === 'true';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true;
    })(),
    toggleDarkMode: () =>
        set((state) => {
            const newMode = !state.darkMode;
            localStorage.setItem('od-dark-mode', String(newMode));
            return { darkMode: newMode };
        }),

    // Language
    language: 'en',
    setLanguage: (lang) => set({ language: lang }),

    // Search
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    searchTarget: null,
    setSearchTarget: (target) => set({ searchTarget: target }),

    // UI State
    controlPanelOpen: false,
    toggleControlPanel: () =>
        set((state) => ({ controlPanelOpen: !state.controlPanelOpen })),
    setControlPanelOpen: (open) => set({ controlPanelOpen: open }),

    // Loading
    loading: true,
    loadingProgress: 0,
    setLoading: (loading) => set({ loading }),
    setLoadingProgress: (progress) => set({ loadingProgress: progress }),

    // GPU Performance
    isLowPerf: false,
    setLowPerf: (isLow) => set({ isLowPerf: isLow }),

    // Star data
    starData: [],
    setStarData: (data) => set({ starData: data }),

    // Constellation data
    constellationData: null,
    setConstellationData: (data) => set({ constellationData: data }),
}));

export default useAppStore;
