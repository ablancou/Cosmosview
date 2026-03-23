import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../store/useAppStore';

/**
 * ShareThisSky Modal Component
 * Allows users to generate shareable URLs that encode the current sky view state
 * (location, timestamp) and share them via social platforms or direct link.
 * Uses glassmorphism styling with backdrop blur and semi-transparent panels.
 */

export default function ShareThisSky({ open, onClose }) {
    const { t } = useTranslation();
    const location = useAppStore((s) => s.location);
    const currentTime = useAppStore((s) => s.time.current);

    // State for copy confirmation
    const [copied, setCopied] = useState(false);

    // Generate shareable URL with encoded state
    const shareUrl = useMemo(() => {
        if (!location || !currentTime) return '';

        const timestamp = currentTime.getTime();
        const params = new URLSearchParams({
            lat: location.lat.toFixed(2),
            lon: location.lon.toFixed(2),
            t: timestamp,
        });

        // Build full URL (in production, replace with actual domain)
        const baseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}`
            : 'https://orbitaldome.app';

        return `${baseUrl}?${params.toString()}`;
    }, [location, currentTime]);

    // Copy URL to clipboard with confirmation feedback
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);

            // Reset confirmation message after 2 seconds
            const timer = setTimeout(() => {
                setCopied(false);
            }, 2000);

            return () => clearTimeout(timer);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    // Social share intents
    const handleTwitterShare = () => {
        const text = encodeURIComponent('Check out this exact moment in the night sky from my location!');
        const url = encodeURIComponent(shareUrl);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    };

    const handleWhatsAppShare = () => {
        const message = encodeURIComponent(`Check out the exact same sky I'm seeing right now! ${shareUrl}`);
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
            onClick={handleBackdropClick}
            style={{
                background: 'rgba(8, 8, 15, 0.7)',
                backdropFilter: 'blur(4px)',
            }}
        >
            {/* Modal Panel */}
            <div
                className="glass-panel w-[90%] max-w-md animate-slideUp border border-cosmos-border/30 shadow-2xl"
                style={{
                    background: 'rgba(8, 8, 15, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                }}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 border-b border-cosmos-border/20 flex items-center justify-between"
                    style={{
                        background: 'linear-gradient(135deg, rgba(126, 184, 247, 0.08), transparent)',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🌌</span>
                        <h2 className="text-base font-bold text-cosmos-accent">
                            {t('share.title', 'Share This Sky')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-cosmos-muted hover:text-cosmos-text transition-colors duration-200 text-xl leading-none"
                        aria-label={t('common.close', 'Close')}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Preview Text */}
                    <div className="text-center mb-2">
                        <p className="text-xs text-cosmos-muted uppercase tracking-wider mb-1">
                            {t('share.subtitle', 'Shareable Link')}
                        </p>
                        <p className="text-sm text-cosmos-text/80">
                            {t(
                                'share.description',
                                'Share this exact sky with anyone'
                            )}
                        </p>
                    </div>

                    {/* Share URL Input */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="w-full px-3 py-2.5 rounded-lg text-xs bg-cosmos-bg/40 border border-cosmos-border/30 text-cosmos-text/70 font-mono focus:outline-none focus:ring-1 focus:ring-cosmos-accent/50 cursor-text select-all"
                            style={{
                                backdropFilter: 'blur(8px)',
                            }}
                        />
                        <p className="text-[10px] text-cosmos-muted/60 leading-relaxed">
                            {t(
                                'share.message',
                                'Anyone who opens this link will see the exact same sky you\'re seeing right now'
                            )}
                        </p>
                    </div>

                    {/* Copy Link Button */}
                    <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 border"
                        style={{
                            background: copied
                                ? 'rgba(126, 184, 247, 0.15)'
                                : 'rgba(126, 184, 247, 0.1)',
                            borderColor: copied
                                ? 'rgba(126, 184, 247, 0.5)'
                                : 'rgba(126, 184, 247, 0.3)',
                            color: 'rgb(126, 184, 247)',
                        }}
                    >
                        <span>{copied ? '✓' : '📋'}</span>
                        <span>{copied ? t('share.copied', 'Copied!') : t('share.copyLink', 'Copy Link')}</span>
                    </button>

                    {/* Social Share Section */}
                    <div className="space-y-2 pt-2">
                        <p className="text-xs text-cosmos-muted uppercase tracking-wider">
                            {t('share.shareVia', 'Or share via')}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Twitter/X Button */}
                            <button
                                onClick={handleTwitterShare}
                                className="px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 border hover:shadow-lg"
                                style={{
                                    background: 'rgba(29, 155, 240, 0.08)',
                                    borderColor: 'rgba(29, 155, 240, 0.3)',
                                    color: 'rgb(29, 155, 240)',
                                }}
                                title={t('share.shareTwitter', 'Share on Twitter/X')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                                <span className="hidden sm:inline">X</span>
                            </button>

                            {/* WhatsApp Button */}
                            <button
                                onClick={handleWhatsAppShare}
                                className="px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 border hover:shadow-lg"
                                style={{
                                    background: 'rgba(37, 211, 102, 0.08)',
                                    borderColor: 'rgba(37, 211, 102, 0.3)',
                                    color: 'rgb(37, 211, 102)',
                                }}
                                title={t('share.shareWhatsApp', 'Share on WhatsApp')}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-9.746 9.798c0 2.364.577 4.625 1.682 6.655L0 24l7.104-1.864a9.865 9.865 0 004.708 1.2h.005c5.45 0 9.905-4.453 9.92-9.852.01-2.633-.808-5.112-2.34-7.231A9.913 9.913 0 0011.051 6.979z" />
                                </svg>
                                <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div
                        className="px-3 py-2 rounded-lg border text-[10px] leading-relaxed text-cosmos-text/60"
                        style={{
                            background: 'rgba(126, 184, 247, 0.05)',
                            borderColor: 'rgba(126, 184, 247, 0.15)',
                        }}
                    >
                        <p>
                            <span className="font-semibold text-cosmos-accent">💡 Tip:</span>{' '}
                            {t(
                                'share.tip',
                                'This link preserves your exact location and time, so recipients see the identical sky view.'
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
