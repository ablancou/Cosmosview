import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Constellation Mythology/Info Panel — Shows when a constellation is selected.
 * Displays the mythology, notable stars, best viewing season, and observation tips.
 */

const MYTHOLOGY = {
    UMa: {
        title: 'Ursa Major — The Great Bear',
        myth: 'In Greek mythology, Zeus fell in love with the nymph Callisto. His jealous wife Hera transformed Callisto into a bear. Zeus later placed her among the stars. The most famous asterism within this constellation is the Big Dipper.',
        stars: ['Dubhe (α)', 'Merak (β)', 'Alioth (ε)', 'Mizar (ζ)'],
        season: 'Year-round (northern hemisphere)',
        tip: 'Follow the two "pointer stars" Dubhe and Merak to find Polaris.',
        emoji: '🐻',
    },
    UMi: {
        title: 'Ursa Minor — The Little Bear',
        myth: 'Arcas, son of Callisto, was also transformed and placed in the sky by Zeus. The tip of the bear\'s tail is Polaris, the North Star, making this constellation essential for navigation.',
        stars: ['Polaris (α)', 'Kochab (β)', 'Pherkad (γ)'],
        season: 'Year-round (northern hemisphere)',
        tip: 'Find Polaris at the end of the Little Dipper\'s handle — it marks true North.',
        emoji: '⭐',
    },
    Ori: {
        title: 'Orion — The Hunter',
        myth: 'The great hunter of Greek mythology, placed in the sky by Zeus after his death. His three belt stars are one of the most recognizable patterns in the night sky. The glowing Orion Nebula (M42) hangs from his sword.',
        stars: ['Betelgeuse (α)', 'Rigel (β)', 'Bellatrix (γ)', 'Mintaka (δ)', 'Alnilam (ε)', 'Alnitak (ζ)'],
        season: 'Winter (Dec–Mar)',
        tip: 'Look for the three belt stars in a row. Betelgeuse is the red-orange shoulder star.',
        emoji: '🏹',
    },
    Sco: {
        title: 'Scorpius — The Scorpion',
        myth: 'The scorpion that killed Orion. As punishment, both were placed on opposite sides of the sky so they can never be seen together. The red supergiant Antares ("rival of Mars") marks the scorpion\'s heart.',
        stars: ['Antares (α)', 'Shaula (λ)', 'Sargas (θ)'],
        season: 'Summer (Jun–Sep)',
        tip: 'The curved tail with its stinger is one of the sky\'s most beautiful formations.',
        emoji: '🦂',
    },
    Leo: {
        title: 'Leo — The Lion',
        myth: 'The Nemean Lion from Heracles\' twelve labors. Its hide was impervious to weapons, so Heracles had to strangle it. Zeus placed it among the stars to honor the beast.',
        stars: ['Regulus (α)', 'Denebola (β)', 'Algieba (γ)'],
        season: 'Spring (Mar–Jun)',
        tip: 'The "sickle" of Leo (a backwards question mark) makes the lion\'s mane easy to find.',
        emoji: '🦁',
    },
    Cyg: {
        title: 'Cygnus — The Swan',
        myth: 'Zeus disguised himself as a swan to seduce Leda, queen of Sparta. The constellation forms the Northern Cross, with brilliant Deneb at its tail. Cygnus flies along the Milky Way.',
        stars: ['Deneb (α)', 'Sadr (γ)', 'Albireo (β) — stunning double star'],
        season: 'Summer–Autumn (Jul–Nov)',
        tip: 'Albireo, the head of the swan, is a beautiful gold-and-blue double star in any telescope.',
        emoji: '🦢',
    },
    Cas: {
        title: 'Cassiopeia — The Queen',
        myth: 'The vain Ethiopian queen who boasted her beauty exceeded that of the sea nymphs. As punishment, she was placed upside-down in the sky. Her distinctive W-shape is circumpolar.',
        stars: ['Schedar (α)', 'Caph (β)', 'Ruchbah (δ)'],
        season: 'Year-round (northern hemisphere)',
        tip: 'The W-shape is one of the easiest constellations to identify. Opposite the Big Dipper from Polaris.',
        emoji: '👑',
    },
    Tau: {
        title: 'Taurus — The Bull',
        myth: 'Zeus transformed into a white bull to carry Europa across the sea. The Pleiades star cluster (M45) rides on the bull\'s shoulder, while the red giant Aldebaran marks his fiery eye.',
        stars: ['Aldebaran (α)', 'Elnath (β)', 'Pleiades (M45)'],
        season: 'Winter (Nov–Mar)',
        tip: 'The V-shaped Hyades cluster forms the bull\'s face. The Pleiades are nearby.',
        emoji: '🐂',
    },
    Gem: {
        title: 'Gemini — The Twins',
        myth: 'Castor and Pollux, twin brothers from Greek mythology. Pollux was immortal (son of Zeus), Castor was mortal. When Castor died, Pollux asked Zeus to share his immortality.',
        stars: ['Pollux (β)', 'Castor (α) — sextuple star system'],
        season: 'Winter (Dec–Apr)',
        tip: 'The two bright "head" stars are easy to spot northeast of Orion.',
        emoji: '👬',
    },
    Sgr: {
        title: 'Sagittarius — The Archer',
        myth: 'The centaur Chiron, a wise teacher and healer. His arrow points toward the heart of Scorpius (Antares). The center of the Milky Way lies in this direction.',
        stars: ['Kaus Australis (ε)', 'Nunki (σ)'],
        season: 'Summer (Jun–Sep)',
        tip: 'The "Teapot" asterism is easier to see than the archer. Look toward the brightest part of the Milky Way.',
        emoji: '🏇',
    },
    Lyr: {
        title: 'Lyra — The Lyre',
        myth: 'The lyre of Orpheus, the legendary musician. His music could charm all living things and even stones. After his death, Zeus placed the lyre among the stars.',
        stars: ['Vega (α) — 5th brightest star', 'Sheliak (β)'],
        season: 'Summer (Jun–Oct)',
        tip: 'Vega dominates this small constellation. It\'s part of the Summer Triangle with Deneb and Altair.',
        emoji: '🎵',
    },
    Aql: {
        title: 'Aquila — The Eagle',
        myth: 'The eagle that carried Zeus\'s thunderbolts. In another myth, it carried the shepherd Ganymede to Olympus to serve as cupbearer to the gods.',
        stars: ['Altair (α) — 12th brightest star'],
        season: 'Summer (Jul–Oct)',
        tip: 'Altair forms the Summer Triangle with Vega (Lyra) and Deneb (Cygnus).',
        emoji: '🦅',
    },
};

export default function ConstellationInfoPanel({ constellationId, onClose }) {
    const { t } = useTranslation();

    if (!constellationId) return null;

    const info = MYTHOLOGY[constellationId];
    if (!info) {
        // Fallback for constellations without mythology data
        return (
            <div className="fixed bottom-4 left-[340px] z-30 w-[320px] glass-panel p-4 animate-slideUp">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-cosmos-accent">
                        {t(`constellations.${constellationId}`, constellationId)}
                    </h3>
                    <button onClick={onClose} className="text-cosmos-muted hover:text-cosmos-text text-lg">×</button>
                </div>
                <p className="text-xs text-cosmos-muted">Constellation info coming soon.</p>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 left-[340px] z-30 w-[380px] glass-panel overflow-hidden animate-slideUp">
            {/* Header with emoji */}
            <div className="px-5 py-3 border-b border-cosmos-border/20 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, rgba(126,184,247,0.05), transparent)' }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                        <h3 className="text-sm font-bold text-cosmos-accent">{info.title}</h3>
                        <span className="text-[10px] text-cosmos-muted">📅 {info.season}</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-cosmos-muted hover:text-cosmos-text text-lg">×</button>
            </div>

            <div className="p-4 space-y-3">
                {/* Mythology */}
                <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-cosmos-muted mb-1">📜 Mythology</h4>
                    <p className="text-xs text-cosmos-text/80 leading-relaxed">{info.myth}</p>
                </div>

                {/* Notable stars */}
                <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-cosmos-muted mb-1">⭐ Notable Stars</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {info.stars.map((star) => (
                            <span key={star} className="text-[10px] px-2 py-1 rounded-full bg-cosmos-border/20 text-cosmos-text/70">
                                {star}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tip */}
                <div className="px-3 py-2 rounded-lg bg-cosmos-accent/5 border border-cosmos-accent/10">
                    <h4 className="text-[10px] uppercase tracking-wider text-cosmos-accent mb-0.5">💡 Observation Tip</h4>
                    <p className="text-[11px] text-cosmos-text/70">{info.tip}</p>
                </div>
            </div>
        </div>
    );
}
