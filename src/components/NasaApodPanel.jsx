import React, { useState, useEffect } from 'react';

/**
 * NASA Astronomy Picture of the Day — shows a new stunning space image every day.
 * Uses NASA's free APOD API (DEMO_KEY rate: 30 req/hr, 50/day — plenty for this use).
 * Falls back gracefully if the API is unavailable.
 */
const APOD_URL = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';

export default function NasaApodPanel({ open, onClose }) {
    const [apod, setApod] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || apod) return;

        setLoading(true);
        setError(null);

        fetch(APOD_URL)
            .then((res) => {
                if (!res.ok) throw new Error('API unavailable');
                return res.json();
            })
            .then((data) => {
                setApod(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [open, apod]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] max-w-full z-50 glass-panel overflow-y-auto animate-slideRight"
            style={{ backdropFilter: 'blur(20px)' }}
        >
            {/* Header */}
            <div
                className="sticky top-0 z-10 px-5 flex items-center gap-4 border-b border-cosmos-border/30 h-[64px] min-h-[64px]"
                style={{ background: 'inherit' }}
            >
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full hover:bg-cosmos-border/30 transition-colors text-cosmos-muted hover:text-cosmos-accent touch-manipulation"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-lg font-bold text-cosmos-accent flex items-center gap-2 truncate">
                    🛸 NASA Picture of the Day
                </h2>
            </div>

            <div className="p-5">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-2 border-cosmos-accent/30 border-t-cosmos-accent rounded-full animate-spin-slow mb-4" />
                        <p className="text-sm text-cosmos-muted">Loading from NASA...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-10">
                        <p className="text-sm text-red-400 mb-2">Could not load NASA APOD</p>
                        <p className="text-xs text-cosmos-muted">{error}</p>
                        <button
                            onClick={() => { setApod(null); setError(null); }}
                            className="mt-4 px-4 py-2 rounded-lg bg-cosmos-accent/20 text-cosmos-accent text-sm hover:bg-cosmos-accent/30 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {apod && (
                    <div className="space-y-4">
                        {/* Image */}
                        {apod.media_type === 'image' ? (
                            <div className="rounded-xl overflow-hidden shadow-lg">
                                <img
                                    src={apod.url}
                                    alt={apod.title}
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                />
                            </div>
                        ) : apod.media_type === 'video' ? (
                            <div className="rounded-xl overflow-hidden shadow-lg aspect-video">
                                <iframe
                                    src={apod.url}
                                    title={apod.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        ) : null}

                        {/* Title & Date */}
                        <div>
                            <h3 className="text-lg font-bold text-cosmos-text">{apod.title}</h3>
                            <p className="text-xs text-cosmos-muted mt-1">
                                📅 {new Date(apod.date).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>

                        {/* Explanation */}
                        <p className="text-sm text-cosmos-text/80 leading-relaxed">
                            {apod.explanation}
                        </p>

                        {/* HD link */}
                        {apod.hdurl && (
                            <a
                                href={apod.hdurl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cosmos-accent/20 text-cosmos-accent text-sm hover:bg-cosmos-accent/30 transition-colors"
                            >
                                🖼️ View HD Image
                            </a>
                        )}

                        {/* Copyright */}
                        {apod.copyright && (
                            <p className="text-[10px] text-cosmos-muted/50">
                                © {apod.copyright}
                            </p>
                        )}

                        {/* NASA credit */}
                        <div className="text-[10px] text-cosmos-muted/40 border-t border-cosmos-border/20 pt-3">
                            Data from NASA Astronomy Picture of the Day API • Public Domain
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
