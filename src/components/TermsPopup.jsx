import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function TermsPopup() {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!localStorage.getItem('orbitaldome_terms_accepted')) {
            const timer = setTimeout(() => setOpen(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('orbitaldome_terms_accepted', '1');
        setOpen(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="glass-panel max-w-md w-full p-6 relative flex flex-col gap-5 animate-slideUp shadow-2xl border border-cosmos-border/50 rounded-xl overflow-hidden">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cosmos-accent via-purple-500 to-cosmos-accent opacity-70"></div>

                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl">🌌</span>
                    <h2 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-cosmos-muted">
                        ORBITAL DOME
                    </h2>
                </div>

                <div className="space-y-4 text-sm text-cosmos-muted">
                    <p className="text-center font-medium text-cosmos-text">
                        {t('terms.welcome', 'Bienvenido a Orbital Dome.')}
                    </p>
                    <p className="text-center text-xs opacity-80 px-2">
                        {t('terms.subtitle', 'Para continuar explorando el universo y utilizando nuestras herramientas astronómicas, por favor revisa y acepta nuestros términos.')}
                    </p>

                    <div className="p-4 bg-black/50 rounded-lg border border-white/5 h-40 overflow-y-auto custom-scrollbar text-xs leading-relaxed space-y-4 font-mono shadow-inner">
                        <div>
                            <strong className="text-cosmos-accent mb-1 inline-block">{t('terms.privacyTitle', 'Aviso de Privacidad')}:</strong>
                            <p>{t('terms.privacyText', 'Respetamos tu privacidad. Esta aplicación utiliza los datos de tu ubicación geográfica únicamente en tu dispositivo para calcular posiciones astronómicas locales en tiempo real. No se guardan, procesan ni comparten tus datos personales en servidores externos en ningún momento.')}</p>
                        </div>
                        <div>
                            <strong className="text-cosmos-accent mb-1 inline-block">{t('terms.termsTitle', 'Términos y Condiciones')}:</strong>
                            <p>{t('terms.termsText', 'Orbital Dome es una herramienta desarrollada con fines educativos, de divulgación astronómica y entretenimiento. A pesar de utilizar algoritmos de mecánica celeste comprobados, los datos mostrados (como la posición espacial de satélites, cuerpos celestes y eventos) pueden contener desviaciones o tener márgenes de error debido a factores externos o la naturaleza de los modelos simplificados en navegador. La información obtenida aquí no debe utilizarse para fines de navegación real, misiones críticas ni propósitos científicos oficiales.')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/50 transition-all font-mono text-sm tracking-widest uppercase touch-manipulation focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        {t('terms.accept', 'Aceptar y Entrar')}
                    </button>
                </div>
            </div>
        </div>
    );
}
