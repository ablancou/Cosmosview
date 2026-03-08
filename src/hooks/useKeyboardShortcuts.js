import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Keyboard shortcuts for power users:
 * N — Toggle night vision
 * R — Toggle auto-rotate
 * Space — Play/pause time
 * + — Zoom in
 * - — Zoom out
 * Escape — Close panels
 * ? — Show help (console)
 */
export default function useKeyboardShortcuts({ onToggleMoon, onToggleEvents }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            const key = e.key.toLowerCase();

            switch (key) {
                case 'n':
                    e.preventDefault();
                    useAppStore.getState().toggleNightVision();
                    break;
                case 'r':
                    e.preventDefault();
                    useAppStore.getState().toggleAutoRotate();
                    break;
                case ' ':
                    e.preventDefault();
                    useAppStore.getState().togglePlaying();
                    break;
                case 'm':
                    e.preventDefault();
                    onToggleMoon?.();
                    break;
                case 'e':
                    e.preventDefault();
                    onToggleEvents?.();
                    break;
                case 'escape':
                    // Close everything
                    onToggleMoon?.(false);
                    onToggleEvents?.(false);
                    break;
                case '?':
                    console.log(
                        '%c🔭 CosmosView Keyboard Shortcuts',
                        'font-size: 16px; font-weight: bold; color: #7eb8f7',
                        '\n\nN — Night Vision',
                        '\nR — Auto-Rotate',
                        '\nSpace — Play/Pause',
                        '\nM — Moon Dashboard',
                        '\nE — Sky Events',
                        '\nEsc — Close Panels',
                    );
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggleMoon, onToggleEvents]);
}
