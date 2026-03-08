import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Loading screen with animated starfield and progress bar.
 */
export default function LoadingScreen({ progress, onComplete }) {
    const { t } = useTranslation();
    const [stars, setStars] = useState([]);
    const [fadeOut, setFadeOut] = useState(false);

    // Generate random stars for background
    useEffect(() => {
        const generatedStars = Array.from({ length: 150 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 3,
        }));
        setStars(generatedStars);
    }, []);

    // Handle completion
    useEffect(() => {
        if (progress >= 100) {
            setTimeout(() => setFadeOut(true), 500);
            setTimeout(() => onComplete && onComplete(), 1200);
        }
    }, [progress, onComplete]);

    const getStatusText = () => {
        if (progress < 30) return t('app.loadingStars');
        if (progress < 70) return t('app.loadingConstellations');
        if (progress < 100) return t('app.loading');
        return t('app.ready');
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
            style={{ background: '#08080f' }}
        >
            {/* Animated starfield */}
            <div className="absolute inset-0 overflow-hidden">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            opacity: 0.6,
                            animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Logo and title */}
            <div className="relative z-10 text-center mb-12">
                {/* Animated rings */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div
                        className="absolute inset-0 rounded-full border border-cosmos-accent/30"
                        style={{ animation: 'spin 20s linear infinite' }}
                    />
                    <div
                        className="absolute inset-2 rounded-full border border-cosmos-accent/20"
                        style={{ animation: 'spin 15s linear infinite reverse' }}
                    />
                    <div
                        className="absolute inset-4 rounded-full border border-cosmos-accent/40"
                        style={{ animation: 'spin 10s linear infinite' }}
                    />
                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="w-4 h-4 rounded-full bg-cosmos-accent"
                            style={{ boxShadow: '0 0 20px rgba(126, 184, 247, 0.6)' }}
                        />
                    </div>
                </div>

                <h1 className="font-display text-4xl font-bold text-cosmos-text tracking-wide">
                    {t('app.title')}
                </h1>
                <p className="text-cosmos-muted text-sm mt-2 tracking-widest uppercase">
                    {t('app.subtitle')}
                </p>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 w-64">
                <div className="h-0.5 bg-cosmos-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-cosmos-accent rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${progress}%`,
                            boxShadow: '0 0 10px rgba(126, 184, 247, 0.5)',
                        }}
                    />
                </div>
                <p className="text-xs text-cosmos-muted text-center mt-3">
                    {getStatusText()}
                </p>
            </div>
        </div>
    );
}
