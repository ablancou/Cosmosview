import React, { useEffect, useRef, useCallback, useState } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * AmbientSoundscape — Procedural space ambience using Web Audio API.
 * 
 * Creates layered synthesized sounds:
 * - Deep cosmic drone (low-frequency pad)
 * - Solar wind (filtered noise)
 * - Pulsar rhythm (subtle rhythmic ping)
 * - Stellar hum (mid-frequency shimmer)
 * 
 * All sounds are generated procedurally — no audio files needed.
 * Volume and mix change based on time of day (night = more intense).
 */

// Audio context singleton
let audioCtx = null;
let masterGain = null;
let isInitialized = false;

// Node refs
const nodes = {
    drone: null,
    droneGain: null,
    noise: null,
    noiseGain: null,
    noiseFilter: null,
    pulsar: null,
    pulsarGain: null,
    shimmer: null,
    shimmerGain: null,
    lfo: null,
    lfoGain: null,
};

function initAudio() {
    if (isInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    // ── Layer 1: Deep Cosmic Drone ──
    // Two detuned oscillators for a rich pad sound
    const drone1 = audioCtx.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.value = 55; // A1
    const drone2 = audioCtx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 55.3; // Slight detune for beating
    const drone3 = audioCtx.createOscillator();
    drone3.type = 'sine';
    drone3.frequency.value = 82.5; // Perfect fifth

    const droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.12;

    const droneFilter = audioCtx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 200;
    droneFilter.Q.value = 2;

    drone1.connect(droneFilter);
    drone2.connect(droneFilter);
    drone3.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    drone1.start();
    drone2.start();
    drone3.start();
    nodes.drone = [drone1, drone2, drone3];
    nodes.droneGain = droneGain;

    // ── Layer 2: Solar Wind (filtered noise) ──
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 0.5;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.03;

    // LFO for wind movement
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Very slow sweep
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);
    lfo.start();

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();

    nodes.noise = noise;
    nodes.noiseGain = noiseGain;
    nodes.noiseFilter = noiseFilter;
    nodes.lfo = lfo;
    nodes.lfoGain = lfoGain;

    // ── Layer 3: Pulsar Ping (rhythmic) ──
    // Use a gain node with periodic modulation
    const pulsar = audioCtx.createOscillator();
    pulsar.type = 'sine';
    pulsar.frequency.value = 1200;

    const pulsarEnv = audioCtx.createGain();
    pulsarEnv.gain.value = 0;

    const pulsarGain = audioCtx.createGain();
    pulsarGain.gain.value = 0.015;

    const pulsarFilter = audioCtx.createBiquadFilter();
    pulsarFilter.type = 'bandpass';
    pulsarFilter.frequency.value = 1200;
    pulsarFilter.Q.value = 20;

    pulsar.connect(pulsarFilter);
    pulsarFilter.connect(pulsarEnv);
    pulsarEnv.connect(pulsarGain);
    pulsarGain.connect(masterGain);
    pulsar.start();
    nodes.pulsar = pulsar;
    nodes.pulsarGain = pulsarGain;

    // Pulsar rhythm scheduler
    const schedulePulse = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        const now = audioCtx.currentTime;
        pulsarEnv.gain.cancelScheduledValues(now);
        pulsarEnv.gain.setValueAtTime(0, now);
        pulsarEnv.gain.linearRampToValueAtTime(1, now + 0.005);
        pulsarEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        pulsarEnv.gain.setValueAtTime(0, now + 0.16);
        // Random interval 1.5-4s
        const nextTime = 1500 + Math.random() * 2500;
        setTimeout(schedulePulse, nextTime);
    };
    setTimeout(schedulePulse, 2000);

    // ── Layer 4: Stellar Shimmer ──
    const shimmer1 = audioCtx.createOscillator();
    shimmer1.type = 'sine';
    shimmer1.frequency.value = 440;
    const shimmer2 = audioCtx.createOscillator();
    shimmer2.type = 'sine';
    shimmer2.frequency.value = 554.37; // C#5

    const shimmerGain = audioCtx.createGain();
    shimmerGain.gain.value = 0.008;

    const shimmerFilter = audioCtx.createBiquadFilter();
    shimmerFilter.type = 'highpass';
    shimmerFilter.frequency.value = 2000;

    // Shimmer LFO — very slow volume movement
    const shimmerLFO = audioCtx.createOscillator();
    shimmerLFO.type = 'sine';
    shimmerLFO.frequency.value = 0.15;
    const shimmerLFOGain = audioCtx.createGain();
    shimmerLFOGain.gain.value = 0.005;
    shimmerLFO.connect(shimmerLFOGain);
    shimmerLFOGain.connect(shimmerGain.gain);
    shimmerLFO.start();

    shimmer1.connect(shimmerFilter);
    shimmer2.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer1.start();
    shimmer2.start();
    nodes.shimmer = [shimmer1, shimmer2, shimmerLFO];
    nodes.shimmerGain = shimmerGain;

    isInitialized = true;
}

function setMasterVolume(vol) {
    if (!masterGain || !audioCtx) return;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.5);
}

function cleanup() {
    if (audioCtx && audioCtx.state !== 'closed') {
        try {
            setMasterVolume(0);
            setTimeout(() => {
                try { audioCtx.close(); } catch { }
                audioCtx = null;
                masterGain = null;
                isInitialized = false;
                Object.keys(nodes).forEach(k => { nodes[k] = null; });
            }, 600);
        } catch { }
    }
}

export default function AmbientSoundscape({ enabled }) {
    const [volume, setVolume] = useState(0.5);
    const [showControls, setShowControls] = useState(false);
    const time = useAppStore((s) => s.time);
    const animRef = useRef(null);

    useEffect(() => {
        if (!enabled) {
            if (isInitialized) {
                setMasterVolume(0);
            }
            return;
        }

        // Init on first enable (must be triggered by user gesture)
        if (!isInitialized) {
            initAudio();
        }

        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Fade in
        setMasterVolume(volume * 0.3);

        return () => {
            // Don't destroy, just mute
            setMasterVolume(0);
        };
    }, [enabled]);

    // Update volume
    useEffect(() => {
        if (enabled && isInitialized) {
            setMasterVolume(volume * 0.3);
        }
    }, [volume, enabled]);

    // Modulate based on time of day
    useEffect(() => {
        if (!enabled || !isInitialized || !nodes.droneGain) return;

        const date = time.current;
        const hour = date.getHours() + date.getMinutes() / 60;

        // Night (20-5) = more intense, day = lighter
        const isNight = hour < 5 || hour > 20;
        const isDusk = (hour >= 17 && hour <= 20) || (hour >= 5 && hour <= 7);

        const t = audioCtx.currentTime;

        if (isNight) {
            // Deep, rich night ambience
            nodes.droneGain.gain.linearRampToValueAtTime(0.14, t + 2);
            nodes.noiseGain.gain.linearRampToValueAtTime(0.035, t + 2);
            if (nodes.pulsarGain) nodes.pulsarGain.gain.linearRampToValueAtTime(0.02, t + 2);
            if (nodes.shimmerGain) nodes.shimmerGain.gain.linearRampToValueAtTime(0.01, t + 2);
        } else if (isDusk) {
            // Dusk/dawn — transitional
            nodes.droneGain.gain.linearRampToValueAtTime(0.10, t + 2);
            nodes.noiseGain.gain.linearRampToValueAtTime(0.025, t + 2);
            if (nodes.pulsarGain) nodes.pulsarGain.gain.linearRampToValueAtTime(0.01, t + 2);
            if (nodes.shimmerGain) nodes.shimmerGain.gain.linearRampToValueAtTime(0.006, t + 2);
        } else {
            // Daytime — minimal
            nodes.droneGain.gain.linearRampToValueAtTime(0.06, t + 2);
            nodes.noiseGain.gain.linearRampToValueAtTime(0.015, t + 2);
            if (nodes.pulsarGain) nodes.pulsarGain.gain.linearRampToValueAtTime(0.005, t + 2);
            if (nodes.shimmerGain) nodes.shimmerGain.gain.linearRampToValueAtTime(0.003, t + 2);
        }
    }, [enabled, time.current]);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, []);

    if (!enabled) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
            <button
                onClick={() => setShowControls((s) => !s)}
                className="px-3 py-1.5 rounded-full glass-panel text-cosmos-muted hover:text-cosmos-accent transition-all flex items-center gap-2 text-xs"
                style={{ backdropFilter: 'blur(12px)' }}
            >
                <span className="animate-pulse text-green-400">♪</span>
                <span>Ambient Sound</span>
                <span className="text-[10px] text-cosmos-muted/60 ml-1">{Math.round(volume * 100)}%</span>
            </button>

            {showControls && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 glass-panel rounded-lg p-3 space-y-2"
                    style={{ backdropFilter: 'blur(16px)' }}>
                    <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1">🎵 Soundscape Volume</div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(volume * 100)}
                        onChange={(e) => setVolume(e.target.value / 100)}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: '#00cccc' }}
                    />
                    <div className="flex items-center justify-between text-[9px] text-cosmos-muted/60">
                        <span>Layers: Drone • Wind • Pulsar • Shimmer</span>
                    </div>
                    <div className="text-[8px] text-cosmos-muted/40 pt-1 border-t border-cosmos-border/15">
                        Sound intensity adapts to time of day — richer at night, lighter during day.
                    </div>
                </div>
            )}
        </div>
    );
}
