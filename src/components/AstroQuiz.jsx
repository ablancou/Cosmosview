import React, { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * AstroQuiz — Duolingo-style astronomy quiz system.
 *
 * Features:
 * - 5 lesson categories with 50+ questions
 * - XP system with levels
 * - Streak tracking
 * - Animated feedback (correct/wrong)
 * - Progress persistence (localStorage)
 * - Beautiful card-based UI
 * - Fun astronomical facts as explanations
 */

// ──────────────────────────────────────────────────────
// QUESTION DATABASE
// ──────────────────────────────────────────────────────
const CATEGORIES = [
    {
        id: 'solar_system',
        name: 'Solar System',
        emoji: '☀️',
        color: '#ff9800',
        description: 'Planets, moons, and our cosmic neighborhood',
        questions: [
            { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], answer: 1, fact: 'Mercury orbits just 58 million km from the Sun — but it\'s NOT the hottest planet. Venus is, due to its thick CO₂ atmosphere.' },
            { q: 'How many planets are in our Solar System?', options: ['7', '8', '9', '10'], answer: 1, fact: 'Pluto was demoted to a "dwarf planet" in 2006 by the International Astronomical Union.' },
            { q: 'Which planet has the fastest winds?', options: ['Jupiter', 'Saturn', 'Neptune', 'Uranus'], answer: 2, fact: 'Neptune has supersonic winds reaching 2,100 km/h — the fastest in the Solar System!' },
            { q: 'What is the largest moon in the Solar System?', options: ['Titan', 'Europa', 'Ganymede', 'Io'], answer: 2, fact: 'Ganymede (Jupiter\'s moon) is even larger than Mercury! It also has its own magnetic field.' },
            { q: 'Which planet rotates on its side?', options: ['Neptune', 'Saturn', 'Uranus', 'Jupiter'], answer: 2, fact: 'Uranus has a 98° axial tilt — likely from a massive ancient collision. It essentially rolls around the Sun.' },
            { q: 'How long does light from the Sun take to reach Earth?', options: ['1 minute', '8 minutes', '1 hour', '1 second'], answer: 1, fact: 'About 8 minutes and 20 seconds. The sunlight you see left the Sun before you started reading this question!' },
            { q: 'Which planet could float in water?', options: ['Jupiter', 'Neptune', 'Saturn', 'Uranus'], answer: 2, fact: 'Saturn\'s average density is 0.687 g/cm³ — less than water. If you had a big enough bathtub, it would float!' },
            { q: 'What is the tallest mountain in the Solar System?', options: ['Mount Everest', 'Olympus Mons', 'Maxwell Montes', 'Boösaule Montes'], answer: 1, fact: 'Olympus Mons on Mars is 21.9 km tall — nearly 3× Mount Everest! It\'s also the size of France.' },
            { q: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 1, fact: 'Saturn has over 140 known moons as of 2024, overtaking Jupiter. New ones are still being discovered!' },
            { q: 'What is the Great Red Spot?', options: ['A volcano', 'An ocean', 'A storm', 'A crater'], answer: 2, fact: 'Jupiter\'s Great Red Spot is a storm 1.3× wider than Earth that has been raging for over 350 years.' },
        ],
    },
    {
        id: 'stars',
        name: 'Stars & Nebulae',
        emoji: '⭐',
        color: '#ffd54f',
        description: 'Stellar life cycles, types, and cosmic nurseries',
        questions: [
            { q: 'What is the brightest star in the night sky?', options: ['Polaris', 'Betelgeuse', 'Sirius', 'Alpha Centauri'], answer: 2, fact: 'Sirius is only 8.6 light-years away — practically a neighbor! It\'s actually a binary star system.' },
            { q: 'What color are the hottest stars?', options: ['Red', 'Yellow', 'White', 'Blue'], answer: 3, fact: 'Blue stars can reach 30,000°C+! Our yellow Sun (5,778°C) is relatively cool. Red stars are the coolest at ~3,000°C.' },
            { q: 'What happens when a massive star dies?', options: ['It fades away', 'It becomes a planet', 'It goes supernova', 'Nothing'], answer: 2, fact: 'Stars 8+ solar masses explode as supernovae — briefly outshining entire galaxies! The remnant becomes a neutron star or black hole.' },
            { q: 'What is a nebula?', options: ['A dead star', 'A cloud of gas and dust', 'A type of galaxy', 'A comet'], answer: 1, fact: 'Nebulae are stellar nurseries where new stars are born. The Orion Nebula (M42) is forming hundreds of new stars right now.' },
            { q: 'What star is closest to Earth (besides the Sun)?', options: ['Sirius', 'Alpha Centauri', 'Barnard\'s Star', 'Proxima Centauri'], answer: 3, fact: 'Proxima Centauri is 4.24 light-years away. It has at least one potentially habitable exoplanet!' },
            { q: 'How does the Sun generate energy?', options: ['Burning gas', 'Nuclear fission', 'Nuclear fusion', 'Chemical reactions'], answer: 2, fact: 'The Sun fuses 600 million tons of hydrogen into helium every SECOND, converting 4 million tons to pure energy (E=mc²).' },
            { q: 'What is a white dwarf?', options: ['A small planet', 'A baby star', 'The remnant of a dead star', 'A type of asteroid'], answer: 2, fact: 'White dwarfs are Earth-sized but Sun-mass — so dense that a teaspoon weighs about 5 tons!' },
            { q: 'What is the North Star called?', options: ['Sirius', 'Polaris', 'Vega', 'Arcturus'], answer: 1, fact: 'Polaris won\'t always be the North Star. Due to Earth\'s precession, Vega will take over in about 12,000 years!' },
            { q: 'What stellar phenomenon creates gold?', options: ['Solar flares', 'Supernovae', 'Neutron star mergers', 'Red giants'], answer: 2, fact: 'Almost all gold on Earth was created in neutron star collisions billions of years ago. Your gold jewelry is literally stardust!' },
            { q: 'Betelgeuse is what type of star?', options: ['White dwarf', 'Red supergiant', 'Neutron star', 'Main sequence'], answer: 1, fact: 'Betelgeuse is so enormous that if placed where the Sun is, it would engulf Mars! It could explode as a supernova any millennium.' },
        ],
    },
    {
        id: 'moon',
        name: 'Our Moon',
        emoji: '🌙',
        color: '#b0bec5',
        description: 'Earth\'s faithful companion',
        questions: [
            { q: 'How far is the Moon from Earth?', options: ['38,400 km', '384,400 km', '3,844,000 km', '38,440,000 km'], answer: 1, fact: 'About 384,400 km — you could fit all 7 other planets side by side in that gap!' },
            { q: 'Why do we always see the same side of the Moon?', options: ['It doesn\'t rotate', 'Tidal locking', 'It\'s flat', 'Magnetic attraction'], answer: 1, fact: 'The Moon is tidally locked — its rotation period equals its orbital period (27.3 days). The "dark side" gets just as much sunlight!' },
            { q: 'What causes the phases of the Moon?', options: ['Earth\'s shadow', 'The Moon\'s rotation', 'Sun\'s illumination angle', 'Clouds'], answer: 2, fact: 'Moon phases are caused by the changing angle between the Sun, Moon, and Earth — NOT by Earth\'s shadow (that\'s an eclipse!).' },
            { q: 'How many people have walked on the Moon?', options: ['2', '6', '12', '24'], answer: 2, fact: '12 astronauts walked on the Moon between 1969–1972. The last was Gene Cernan (Apollo 17). No one has been back since!' },
            { q: 'Is the Moon getting closer or farther from Earth?', options: ['Closer', 'Farther', 'Staying the same', 'It oscillates'], answer: 1, fact: 'The Moon moves away at 3.8 cm/year! In 600 million years, total solar eclipses will no longer be possible.' },
            { q: 'What is a "supermoon"?', options: ['A very bright moon', 'A full moon at perigee', 'An eclipse', 'A double moon'], answer: 1, fact: 'A supermoon appears up to 14% larger and 30% brighter than a micro-moon. The difference is subtle but real.' },
            { q: 'What are the dark areas on the Moon called?', options: ['Craters', 'Valleys', 'Maria (seas)', 'Deserts'], answer: 2, fact: 'Early astronomers thought the dark spots were seas, so they named them "maria" (Latin for seas). They\'re actually ancient lava plains!' },
            { q: 'What causes a lunar eclipse?', options: ['Moon blocks the Sun', 'Earth blocks sunlight to Moon', 'Moon enters a shadow', 'Solar flares'], answer: 1, fact: 'During a total lunar eclipse, the Moon turns red because Earth\'s atmosphere bends red sunlight onto it — a "Blood Moon"!' },
            { q: 'Does the Moon have an atmosphere?', options: ['Yes, thick like Earth', 'Yes, extremely thin', 'No, none at all', 'Only on the dark side'], answer: 1, fact: 'The Moon has an exosphere — so thin that atoms rarely collide. It contains helium, neon, and argon from solar wind.' },
            { q: 'What was the first Moon landing mission?', options: ['Apollo 1', 'Apollo 11', 'Apollo 13', 'Gemini 4'], answer: 1, fact: 'Apollo 11 landed on July 20, 1969. Neil Armstrong\'s "one small step" was watched by 600 million people worldwide.' },
        ],
    },
    {
        id: 'galaxies',
        name: 'Galaxies & Universe',
        emoji: '🌀',
        color: '#7c4dff',
        description: 'The vast cosmos beyond our galaxy',
        questions: [
            { q: 'What type of galaxy is the Milky Way?', options: ['Elliptical', 'Irregular', 'Barred spiral', 'Lenticular'], answer: 2, fact: 'The Milky Way is a barred spiral galaxy about 100,000 light-years across, containing 100–400 billion stars!' },
            { q: 'What is at the center of most galaxies?', options: ['A giant star', 'A supermassive black hole', 'A nebula', 'Nothing'], answer: 1, fact: 'Our Milky Way\'s central black hole, Sagittarius A*, has 4 million solar masses. It was first imaged in 2022!' },
            { q: 'How old is the universe?', options: ['4.5 billion years', '10 billion years', '13.8 billion years', '100 billion years'], answer: 2, fact: '13.8 billion years! We know this from measuring the cosmic microwave background — the "afterglow" of the Big Bang.' },
            { q: 'What is the nearest major galaxy to the Milky Way?', options: ['Triangulum', 'Andromeda', 'Sombrero', 'Whirlpool'], answer: 1, fact: 'The Andromeda Galaxy (M31) is 2.5 million light-years away and approaching us at 110 km/s. It will collide with us in ~4.5 billion years!' },
            { q: 'What is dark matter?', options: ['Black holes', 'Invisible matter that has gravity', 'Dark energy', 'Anti-matter'], answer: 1, fact: 'Dark matter makes up 27% of the universe but has never been directly detected! We only know it exists because of its gravitational effects.' },
            { q: 'Is the universe expanding?', options: ['No', 'Yes, at a constant rate', 'Yes, and accelerating', 'It\'s contracting'], answer: 2, fact: 'The universe\'s expansion is accelerating! This discovery won the 2011 Nobel Prize and is driven by mysterious "dark energy".' },
            { q: 'What is the observable universe\'s diameter?', options: ['93 billion light-years', '13.8 billion light-years', '1 trillion light-years', '93 million light-years'], answer: 0, fact: '93 billion light-years! It\'s larger than the age suggests because space itself has been expanding.' },
            { q: 'How many galaxies are in the observable universe?', options: ['Millions', 'Billions', '~2 trillion', 'Infinite'], answer: 2, fact: 'About 2 trillion galaxies! Most are too faint and distant to see with current telescopes.' },
            { q: 'What is a quasar?', options: ['A type of star', 'An active galactic nucleus', 'A dead galaxy', 'A space station'], answer: 1, fact: 'Quasars are supermassive black holes actively devouring matter, outshining their entire host galaxies. Some are visible billions of light-years away!' },
            { q: 'What is cosmic microwave background radiation?', options: ['Radio signals from aliens', 'Leftover glow from the Big Bang', 'Microwave radiation from stars', 'Radiation from black holes'], answer: 1, fact: 'The CMB is the afterglow from when the universe was 380,000 years old and cooled enough for light to travel freely. It\'s everywhere!' },
        ],
    },
    {
        id: 'observation',
        name: 'Stargazing Skills',
        emoji: '🔭',
        color: '#26a69a',
        description: 'Practical tips for observing the night sky',
        questions: [
            { q: 'What does "magnitude" measure?', options: ['Star size', 'Star brightness', 'Star temperature', 'Star distance'], answer: 1, fact: 'Lower magnitude = brighter! Sirius is -1.46, the Sun is -26.7, and the faintest naked-eye stars are about +6.' },
            { q: 'What is the Bortle Scale?', options: ['A temperature scale', 'A brightness scale', 'A light pollution scale', 'A telescope scale'], answer: 2, fact: 'Bortle 1 is pristine dark sky (rare today). Most cities are Bortle 7-9. At Bortle 1, the Milky Way casts shadows!' },
            { q: 'Why do stars twinkle?', options: ['They pulsate', 'Earth\'s atmosphere', 'They\'re very far away', 'They rotate'], answer: 1, fact: 'Atmospheric turbulence bends starlight rapidly — called "scintillation". Planets don\'t twinkle as much because they\'re not point sources.' },
            { q: 'What is "astronomical seeing"?', options: ['Telescope quality', 'Atmospheric stability', 'Eye adaptation', 'Sky brightness'], answer: 1, fact: 'Good seeing (stable atmosphere) is more important than telescope size. That\'s why observatories are on mountaintops!' },
            { q: 'How long does it take eyes to dark-adapt?', options: ['5 minutes', '10 minutes', '20-30 minutes', '1 hour'], answer: 2, fact: 'Full dark adaptation takes 20-30 minutes. Red light preserves it — that\'s why astronomers use red flashlights!' },
            { q: 'What is the ecliptic?', options: ['Earth\'s equator in space', 'The Sun\'s apparent path', 'The Moon\'s orbit', 'A type of eclipse'], answer: 1, fact: 'All planets, the Moon, and the Sun appear near the ecliptic because the Solar System is roughly flat (coplanar).' },
            { q: 'What is the Summer Triangle?', options: ['A constellation', 'An asterism of 3 bright stars', 'A seasonal event', 'A telescope type'], answer: 1, fact: 'Vega (Lyra), Deneb (Cygnus), and Altair (Aquila) form the Summer Triangle — dominating the summer/autumn sky.' },
            { q: 'What is a meridian?', options: ['A circle around Earth', 'An imaginary line from N to S through zenith', 'A type of telescope', 'A star catalog'], answer: 1, fact: 'Objects are highest (best for viewing) when they cross your local meridian — this is called "transit" or "culmination".' },
            { q: 'Best night for deep-sky observing?', options: ['Full Moon night', 'New Moon night', 'Quarter Moon night', 'Any night'], answer: 1, fact: 'New Moon nights are best! Moonlight washes out faint nebulae and galaxies. Plan deep-sky sessions around new Moons.' },
            { q: 'What does "right ascension" measure?', options: ['Star altitude', 'East-west position on sky', 'Star distance', 'North-south position'], answer: 1, fact: 'Right ascension (RA) is measured in hours (0-24h), like longitude on the celestial sphere. Declination is the celestial latitude.' },
        ],
    },
];

// ──────────────────────────────────────────────────────
// PROGRESS STORAGE
// ──────────────────────────────────────────────────────
function loadProgress() {
    try {
        const saved = localStorage.getItem('cosmosview-quiz-progress');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
}

function saveProgress(data) {
    try {
        localStorage.setItem('cosmosview-quiz-progress', JSON.stringify(data));
    } catch (e) { }
}

const DEFAULT_PROGRESS = {
    xp: 0,
    level: 1,
    streak: 0,
    lastPlayDate: null,
    completed: {},
    totalCorrect: 0,
    totalAnswered: 0,
};

function xpForLevel(level) {
    return level * 50;
}

// ──────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────
export default function AstroQuiz({ open, onClose }) {
    const [progress, setProgress] = useState(() => loadProgress() || DEFAULT_PROGRESS);
    const [view, setView] = useState('categories'); // 'categories' | 'quiz' | 'result'
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [sessionCorrect, setSessionCorrect] = useState(0);
    const [sessionTotal, setSessionTotal] = useState(0);
    const [shake, setShake] = useState(false);

    // Save progress on change
    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    // Streak logic
    useEffect(() => {
        const today = new Date().toDateString();
        if (progress.lastPlayDate) {
            const lastDate = new Date(progress.lastPlayDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate.toDateString() !== today && lastDate.toDateString() !== yesterday.toDateString()) {
                setProgress((p) => ({ ...p, streak: 0 }));
            }
        }
    }, []);

    const startCategory = useCallback((cat) => {
        setCurrentCategory(cat);
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setSessionCorrect(0);
        setSessionTotal(0);
        setView('quiz');
    }, []);

    const handleAnswer = useCallback((idx) => {
        if (showFeedback) return;
        setSelectedAnswer(idx);
        setShowFeedback(true);

        const isCorrect = idx === currentCategory.questions[currentQ].answer;
        const today = new Date().toDateString();

        if (isCorrect) {
            setSessionCorrect((c) => c + 1);
            setProgress((p) => {
                const newXP = p.xp + 10;
                const nextLevelXP = xpForLevel(p.level);
                const levelUp = newXP >= nextLevelXP;
                return {
                    ...p,
                    xp: levelUp ? newXP - nextLevelXP : newXP,
                    level: levelUp ? p.level + 1 : p.level,
                    totalCorrect: p.totalCorrect + 1,
                    totalAnswered: p.totalAnswered + 1,
                    streak: p.lastPlayDate !== today ? p.streak + 1 : p.streak,
                    lastPlayDate: today,
                };
            });
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setProgress((p) => ({
                ...p,
                totalAnswered: p.totalAnswered + 1,
                lastPlayDate: today,
            }));
        }
        setSessionTotal((t) => t + 1);
    }, [showFeedback, currentCategory, currentQ]);

    const nextQuestion = useCallback(() => {
        if (currentQ + 1 >= currentCategory.questions.length) {
            // Mark category as completed
            setProgress((p) => ({
                ...p,
                completed: { ...p.completed, [currentCategory.id]: true },
            }));
            setView('result');
        } else {
            setCurrentQ((q) => q + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        }
    }, [currentQ, currentCategory]);

    if (!open) return null;

    const xpProgress = (progress.xp / xpForLevel(progress.level)) * 100;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative z-10 w-[520px] max-w-[95vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{
                    background: 'linear-gradient(135deg, rgba(12,12,30,0.98), rgba(20,15,45,0.98))',
                    border: '1px solid rgba(126,184,247,0.15)',
                }}
            >
                {/* Header with XP & Streak */}
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={view === 'categories' ? onClose : () => setView('categories')}
                            className="text-white/50 hover:text-white text-lg"
                        >
                            {view === 'categories' ? '×' : '←'}
                        </button>
                        <h2 className="text-lg font-bold text-white">🎓 AstroQuiz</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Streak */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg">🔥</span>
                            <span className="text-sm font-bold text-orange-400">{progress.streak}</span>
                        </div>
                        {/* Level */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-cosmos-accent">Lv.{progress.level}</span>
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="px-5 py-2 bg-white/5">
                    <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                        <span>⭐ {progress.xp} / {xpForLevel(progress.level)} XP</span>
                        <span>{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${xpProgress}%`,
                                background: 'linear-gradient(90deg, #7eb8f7, #5c6bc0)',
                            }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {view === 'categories' && (
                        <CategoriesView
                            categories={CATEGORIES}
                            completed={progress.completed}
                            onStart={startCategory}
                            totalCorrect={progress.totalCorrect}
                            totalAnswered={progress.totalAnswered}
                        />
                    )}
                    {view === 'quiz' && currentCategory && (
                        <QuizView
                            category={currentCategory}
                            questionIndex={currentQ}
                            selectedAnswer={selectedAnswer}
                            showFeedback={showFeedback}
                            onAnswer={handleAnswer}
                            onNext={nextQuestion}
                            shake={shake}
                        />
                    )}
                    {view === 'result' && (
                        <ResultView
                            correct={sessionCorrect}
                            total={sessionTotal}
                            category={currentCategory}
                            onBack={() => setView('categories')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// CATEGORIES VIEW
// ──────────────────────────────────────────────────────
function CategoriesView({ categories, completed, onStart, totalCorrect, totalAnswered }) {
    return (
        <div className="space-y-3">
            {/* Stats row */}
            <div className="flex gap-3 mb-4">
                <StatCard emoji="✅" value={totalCorrect} label="Correct" />
                <StatCard emoji="📝" value={totalAnswered} label="Answered" />
                <StatCard emoji="🎯" value={totalAnswered > 0 ? `${Math.round(totalCorrect / totalAnswered * 100)}%` : '—'} label="Accuracy" />
            </div>

            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onStart(cat)}
                    className="w-full rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}08)`,
                        border: `1px solid ${cat.color}30`,
                    }}
                >
                    <span className="text-3xl">{cat.emoji}</span>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                            {completed[cat.id] && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">✓ Done</span>
                            )}
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5">{cat.description}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{cat.questions.length} questions</p>
                    </div>
                    <span className="text-white/30 text-lg">→</span>
                </button>
            ))}
        </div>
    );
}

function StatCard({ emoji, value, label }) {
    return (
        <div className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
            <div className="text-lg">{emoji}</div>
            <div className="text-sm font-bold text-white">{value}</div>
            <div className="text-[9px] text-white/40">{label}</div>
        </div>
    );
}

// ──────────────────────────────────────────────────────
// QUIZ VIEW
// ──────────────────────────────────────────────────────
function QuizView({ category, questionIndex, selectedAnswer, showFeedback, onAnswer, onNext, shake }) {
    const question = category.questions[questionIndex];
    const total = category.questions.length;
    const isCorrect = selectedAnswer === question.answer;

    return (
        <div className="space-y-5">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${((questionIndex + 1) / total) * 100}%`,
                            background: category.color,
                        }}
                    />
                </div>
                <span className="text-xs text-white/40 whitespace-nowrap">{questionIndex + 1}/{total}</span>
            </div>

            {/* Question */}
            <div className={`transition-transform ${shake ? 'animate-shake' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white/50" style={{ background: `${category.color}20` }}>
                        {category.name}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{question.q}</h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
                {question.options.map((opt, idx) => {
                    let style = 'bg-white/5 border-white/10 hover:bg-white/10';
                    if (showFeedback) {
                        if (idx === question.answer) {
                            style = 'bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30';
                        } else if (idx === selectedAnswer && !isCorrect) {
                            style = 'bg-red-500/20 border-red-500/50 ring-2 ring-red-500/30';
                        } else {
                            style = 'bg-white/3 border-white/5 opacity-50';
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => onAnswer(idx)}
                            disabled={showFeedback}
                            className={`w-full px-4 py-3 rounded-xl border text-left transition-all ${style} ${!showFeedback ? 'active:scale-[0.98]' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white/10 text-white/60">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-sm text-white">{opt}</span>
                                {showFeedback && idx === question.answer && (
                                    <span className="ml-auto text-green-400">✓</span>
                                )}
                                {showFeedback && idx === selectedAnswer && !isCorrect && idx !== question.answer && (
                                    <span className="ml-auto text-red-400">✗</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {showFeedback && (
                <div
                    className={`rounded-xl p-4 border ${isCorrect
                            ? 'bg-green-500/10 border-green-500/20'
                            : 'bg-orange-500/10 border-orange-500/20'
                        }`}
                    style={{ animation: 'fade-in 0.3s ease-out' }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{isCorrect ? '🎉' : '💡'}</span>
                        <span className={`text-sm font-bold ${isCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                            {isCorrect ? '+10 XP — Correct!' : 'Not quite!'}
                        </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{question.fact}</p>
                </div>
            )}

            {/* Next button */}
            {showFeedback && (
                <button
                    onClick={onNext}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                        background: `linear-gradient(135deg, ${category.color}30, ${category.color}15)`,
                        color: category.color,
                        border: `1px solid ${category.color}30`,
                    }}
                >
                    {questionIndex + 1 < total ? 'Continue →' : 'See Results 🏆'}
                </button>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────
// RESULT VIEW
// ──────────────────────────────────────────────────────
function ResultView({ correct, total, category, onBack }) {
    const pct = Math.round((correct / total) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;

    return (
        <div className="text-center space-y-5 py-4">
            {/* Stars */}
            <div className="text-5xl" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                {stars >= 3 ? '🌟🌟🌟' : stars >= 2 ? '⭐⭐' : stars >= 1 ? '⭐' : '💪'}
            </div>

            <div>
                <h3 className="text-xl font-bold text-white">
                    {pct >= 90 ? 'Perfect!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort!' : 'Keep learning!'}
                </h3>
                <p className="text-sm text-white/50 mt-1">
                    {correct}/{total} correct ({pct}%)
                </p>
            </div>

            {/* XP earned */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cosmos-accent/10">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-bold text-cosmos-accent">+{correct * 10} XP earned</span>
            </div>

            {/* Category badge */}
            <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-sm text-white/60">{category.name} completed!</span>
            </div>

            <button
                onClick={onBack}
                className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-all"
            >
                Back to Categories
            </button>
        </div>
    );
}
