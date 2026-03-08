import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';
import { degToDMS, hoursToHMS } from '../utils/coordinates';

/**
 * Star information card shown when a star is selected.
 * Positioned bottom-right on desktop, slides up on mobile.
 */
export default function StarInfoCard() {
    const { t } = useTranslation();
    const selectedStar = useAppStore((s) => s.selectedStar);
    const clearSelectedStar = useAppStore((s) => s.clearSelectedStar);
    const darkMode = useAppStore((s) => s.darkMode);

    if (!selectedStar) return null;

    const displayName = selectedStar.proper || selectedStar.bayer || `Star ${selectedStar.id}`;
    const constellation = t(`constellations.${selectedStar.con}`, selectedStar.con);

    return (
        <div
            className={`
        fixed z-40 animate-slide-up
        bottom-4 right-4 w-80
        max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:w-full max-lg:rounded-b-none
        glass-panel ${darkMode ? '' : 'light'}
      `}
            role="dialog"
            aria-label={t('starInfo.name')}
        >
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-display text-xl font-bold text-cosmos-highlight">
                            {displayName}
                        </h3>
                        {selectedStar.bayer && selectedStar.proper && (
                            <p className="text-xs text-cosmos-muted">{selectedStar.bayer}</p>
                        )}
                    </div>
                    <button
                        onClick={clearSelectedStar}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cosmos-border transition-colors text-cosmos-muted hover:text-cosmos-text"
                        aria-label={t('starInfo.close')}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                        </svg>
                    </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <InfoRow label={t('starInfo.constellation')} value={constellation} />
                    <InfoRow label={t('starInfo.magnitude')} value={selectedStar.mag?.toFixed(2)} />
                    <InfoRow label={t('starInfo.spectralType')} value={selectedStar.spect || '—'} />
                    <InfoRow
                        label={t('starInfo.distance')}
                        value={selectedStar.dist ? `${selectedStar.dist.toFixed(1)} ${t('starInfo.lightYears')}` : '—'}
                    />
                    {selectedStar.alt !== undefined && (
                        <>
                            <InfoRow label={t('starInfo.altitude')} value={degToDMS(selectedStar.alt)} />
                            <InfoRow label={t('starInfo.azimuth')} value={degToDMS(selectedStar.az)} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <dt className="text-[10px] text-cosmos-muted uppercase tracking-wider">{label}</dt>
            <dd className="text-cosmos-text font-mono text-xs mt-0.5">{value}</dd>
        </div>
    );
}
