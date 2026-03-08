import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * Toggle switches for each sky layer.
 */
const LAYER_KEYS = [
    'stars',
    'constellations',
    'constellationNames',
    'equatorialGrid',
    'altAzGrid',
    'milkyWay',
    'planets',
    'satellites',
    'atmosphere',
    'ground',
    'aurora',
    'ecliptic',
    'cardinalDirections',
];

export default function LayerToggles() {
    const { t } = useTranslation();
    const layers = useAppStore((s) => s.layers);
    const toggleLayer = useAppStore((s) => s.toggleLayer);

    return (
        <div className="space-y-1">
            {LAYER_KEYS.map((key) => (
                <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-cosmos-border/30 transition-colors group"
                    role="switch"
                    aria-checked={layers[key]}
                    aria-label={t(`layers.${key}`)}
                >
                    <span className="text-sm text-cosmos-text group-hover:text-cosmos-accent transition-colors">
                        {t(`layers.${key}`)}
                    </span>
                    <div
                        className={`toggle-switch ${layers[key] ? 'active' : ''}`}
                        aria-hidden="true"
                    />
                </button>
            ))}
        </div>
    );
}
