import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * Time controls: play/pause, time scrubber (±24h), jump to now.
 */
export default function TimeControls() {
    const { t } = useTranslation();
    const time = useAppStore((s) => s.time);
    const togglePlaying = useAppStore((s) => s.togglePlaying);
    const setTimeOffset = useAppStore((s) => s.setTimeOffset);
    const jumpToNow = useAppStore((s) => s.jumpToNow);
    const updateCurrentTime = useAppStore((s) => s.updateCurrentTime);

    const offsetHours = time.offset / 3600000; // ms to hours

    const handleOffsetChange = (e) => {
        const hours = parseFloat(e.target.value);
        setTimeOffset(hours * 3600000);
        updateCurrentTime();
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                    onClick={togglePlaying}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-cosmos-border hover:bg-cosmos-accent/10 transition-colors"
                    aria-label={time.playing ? t('time.pause') : t('time.play')}
                    title={time.playing ? t('time.pause') : t('time.play')}
                >
                    {time.playing ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-cosmos-accent">
                            <rect x="2" y="1" width="4" height="12" rx="1" />
                            <rect x="8" y="1" width="4" height="12" rx="1" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-cosmos-accent">
                            <path d="M3 1.5v11l9-5.5z" />
                        </svg>
                    )}
                </button>

                {/* Jump to Now */}
                <button
                    onClick={jumpToNow}
                    className="flex-1 h-9 px-3 rounded-lg border border-cosmos-border text-xs text-cosmos-accent hover:bg-cosmos-accent/10 transition-colors"
                    aria-label={t('time.jumpToNow')}
                >
                    {t('time.jumpToNow')}
                </button>
            </div>

            {/* Time scrubber */}
            <div>
                <div className="flex justify-between text-[10px] text-cosmos-muted mb-1">
                    <span>-24h</span>
                    <span>{offsetHours > 0 ? '+' : ''}{offsetHours.toFixed(1)} {t('time.hours')}</span>
                    <span>+24h</span>
                </div>
                <input
                    type="range"
                    min="-24"
                    max="24"
                    step="0.5"
                    value={offsetHours}
                    onChange={handleOffsetChange}
                    className="w-full"
                    aria-label={t('time.timeOffset')}
                />
            </div>
        </div>
    );
}
