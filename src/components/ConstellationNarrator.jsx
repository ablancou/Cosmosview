import React, { useState, useEffect, useRef, useCallback } from 'react';

/* Inline icon components (no lucide-react dependency) */
const X = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const Play = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const Pause = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);
const Volume2 = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
);
const Zap = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);

// Constellation database with detailed stories
const CONSTELLATION_DATABASE = {
  Ori: {
    title: 'Orion the Hunter',
    emoji: '🏹',
    origin: 'Greek Mythology',
    story: 'Orion was a mighty hunter in Greek mythology, famous for his strength and prowess. He was placed in the sky by Zeus after his death, forever pursuing the Pleiades across the winter night. His distinctive belt of three bright stars has guided navigators and stargazers for millennia.',
    funFact: 'The Orion Nebula (M42) in Orion\'s sword is one of the nearest and brightest nebulae, active with star formation.',
    bestSeason: 'Winter (December to March)',
    mainStars: ['Betelgeuse', 'Rigel', 'Bellatrix', 'Alnitak', 'Alnilam', 'Mintaka']
  },
  UMa: {
    title: 'Ursa Major',
    emoji: '🐻',
    origin: 'Greek Mythology',
    story: 'Ursa Major, the Great Bear, represents Callisto, a nymph who was transformed into a bear by Zeus to hide her from Hera\'s jealousy. Her son Arcas nearly hunted her, but Zeus intervened by placing them both in the sky. The Big Dipper asterism within Ursa Major serves as one of the most recognizable star patterns.',
    funFact: 'The two outer stars of the Big Dipper\'s cup point directly toward Polaris, the North Star, making it invaluable for navigation.',
    bestSeason: 'Spring (March to June)',
    mainStars: ['Dubhe', 'Merak', 'Alkaid', 'Alioth', 'Mizar', 'Alcor']
  },
  CMa: {
    title: 'Canis Major',
    emoji: '🐕',
    origin: 'Greek Mythology',
    story: 'Canis Major is Orion\'s faithful hunting dog, placed in the heavens to accompany his master eternally. In some versions, this dog belonged to Actaeon or was a gift from Artemis. It represents loyalty and the bond between hunter and hound across the cosmos.',
    funFact: 'Sirius, the brightest star in Canis Major and the entire night sky, has fascinated civilizations from Egypt to China for thousands of years.',
    bestSeason: 'Winter (December to March)',
    mainStars: ['Sirius', 'Adhara', 'Wezen', 'Procyon']
  },
  Gem: {
    title: 'Gemini the Twins',
    emoji: '👯',
    origin: 'Greek Mythology',
    story: 'Gemini represents Castor and Pollux, the twin sons of Leda. One was mortal, the other immortal, yet they shared an unbreakable bond. When Castor died, Pollux begged Zeus to let him share his immortality with his brother, creating the eternal symbol of brotherly love.',
    funFact: 'The bright stars Castor and Pollux mark the heads of the twins, with Pollux being slightly brighter than Castor.',
    bestSeason: 'Winter (January to March)',
    mainStars: ['Castor', 'Pollux', 'Tejat', 'Mebsuta']
  },
  Leo: {
    title: 'Leo the Lion',
    emoji: '🦁',
    origin: 'Greek Mythology',
    story: 'Leo represents the fearsome Nemean Lion, a creature with impenetrable hide that terrorized the Greek region of Nemea. Heracles was tasked with slaying it as his first labor, ultimately defeating the beast and wearing its skin as armor. The constellation commemorates this triumph of strength and cunning.',
    funFact: 'The bright star Regulus marks the lion\'s heart and forms the base of the backwards question mark asterism known as the Sickle.',
    bestSeason: 'Spring (March to May)',
    mainStars: ['Regulus', 'Denebola', 'Algieba', 'Zosma']
  },
  Cyg: {
    title: 'Cygnus the Swan',
    emoji: '🦢',
    origin: 'Greek Mythology',
    story: 'Cygnus takes multiple forms in mythology. One tale tells of Cycnus, a friend of Phaethon who grieved so deeply after his friend\'s death that the gods transformed him into a swan. Another version features Cycnus transformed for his devotion to love and loss. The constellation represents grace, transformation, and the power of loyalty.',
    funFact: 'Cygnus flies along the Milky Way and contains Deneb, a bright blue supergiant star that forms one corner of the Summer Triangle asterism.',
    bestSeason: 'Summer (June to September)',
    mainStars: ['Deneb', 'Sadr', 'Gienah', 'Albireo']
  },
  Lyr: {
    title: 'Lyra the Lyre',
    emoji: '🎵',
    origin: 'Greek Mythology',
    story: 'Lyra represents the magical lyre created by Hermes and given to Apollo. This instrument was passed to Orpheus, the legendary musician whose melodies could move stones and tame wild beasts. The lyre ended up in the sky as a memorial to Orpheus\'s extraordinary gift and tragic love story.',
    funFact: 'Vega, the brightest star in Lyra, is one of the nearest bright stars to Earth at just 25 light-years away.',
    bestSeason: 'Summer (June to September)',
    mainStars: ['Vega', 'Epsilon Lyrae', 'Sheliak', 'Sulafat']
  },
  Sco: {
    title: 'Scorpius the Scorpion',
    emoji: '🦂',
    origin: 'Greek Mythology',
    story: 'Scorpius represents the scorpion sent by Gaia or Artemis to sting Orion after he boasted of his hunting prowess. Some versions say Scorpius stung him, while others claim he drove Orion into the sea. The eternal chase continues in the sky as Scorpius rises when Orion sets, forever pursuing its foe.',
    funFact: 'Antares, the red supergiant heart of Scorpius, is so enormous that if placed where our sun is, its surface would extend past Jupiter\'s orbit.',
    bestSeason: 'Summer (June to September)',
    mainStars: ['Antares', 'Larawag', 'Acrab', 'Shaula']
  },
  Sgr: {
    title: 'Sagittarius the Archer',
    emoji: '🏹',
    origin: 'Greek Mythology',
    story: 'Sagittarius represents a centaur archer, though unlike the wild centaurs, this one is wise and noble. Some myths identify him as Chiron, the renowned teacher of heroes, while others see him as a different, more civilized centaur. The archer points his bow toward Scorpius in eternal pursuit across the summer sky.',
    funFact: 'Sagittarius contains Sagittarius A*, a supermassive black hole at the center of our Milky Way galaxy, millions of times more massive than our sun.',
    bestSeason: 'Summer (June to September)',
    mainStars: ['Kaus Australis', 'Kaus Borealis', 'Nunki', 'Alnasl']
  },
  And: {
    title: 'Andromeda the Chained Maiden',
    emoji: '👰',
    origin: 'Greek Mythology',
    story: 'Andromeda was a princess whose mother Cassiopeia angered Poseidon with her boasting. As punishment, Andromeda was chained to a rock as a sacrifice to a sea monster. Perseus rescued her, slaying the beast and winning her hand in marriage. The constellation celebrates her valor and rescue.',
    funFact: 'The Andromeda Galaxy (M31) is the nearest large galaxy to the Milky Way and visible to the naked eye, containing over a trillion stars.',
    bestSeason: 'Autumn (September to November)',
    mainStars: ['Alpheratz', 'Mirach', 'Almach', 'Delta Andromedae']
  },
  Cas: {
    title: 'Cassiopeia the Queen',
    emoji: '👑',
    origin: 'Greek Mythology',
    story: 'Cassiopeia was the vain queen of Aethiopia who boasted of her beauty surpassing the Nereids. Poseidon punished her by placing her in the sky, forced to circle the pole star eternally, sometimes hanging upside down. Her constellation is a reminder of the dangers of excessive pride.',
    funFact: 'Cassiopeia forms a distinctive W or M shape in the sky, making it one of the most recognizable constellations, visible year-round in the Northern Hemisphere.',
    bestSeason: 'Autumn and Winter (September to March)',
    mainStars: ['Schedar', 'Caph', 'Gamma Cassiopeiae', 'Ruchbah']
  },
  Per: {
    title: 'Perseus the Hero',
    emoji: '⚔️',
    origin: 'Greek Mythology',
    story: 'Perseus was a legendary hero famous for slaying Medusa, the Gorgon monster with snakes for hair whose gaze could turn anyone to stone. Using his wits and divine gifts, Perseus decapitated Medusa and later used her head as a powerful weapon. His constellation honors his courage and cunning against impossible odds.',
    funFact: 'Perseus contains the famous Algol star system, whose brightness varies regularly, earning it the nickname "Demon Star" in ancient times.',
    bestSeason: 'Autumn and Winter (September to March)',
    mainStars: ['Mirfak', 'Algol', 'Atik', 'Misam']
  },
  Peg: {
    title: 'Pegasus the Winged Horse',
    emoji: '🐴',
    origin: 'Greek Mythology',
    story: 'Pegasus was a divine winged horse born from the blood of Medusa after Perseus slew her. The magnificent creature could fly faster than the wind and carried heroes across the world. Eventually, the gods immortalized Pegasus in the stars, where he soars eternally through the autumn sky.',
    funFact: 'The Great Square of Pegasus, formed by four bright stars, is one of the largest asterisms in the night sky and marks the body of the flying horse.',
    bestSeason: 'Autumn (September to November)',
    mainStars: ['Enif', 'Scheat', 'Markab', 'Algenib']
  },
  Tau: {
    title: 'Taurus the Bull',
    emoji: '🐂',
    origin: 'Greek Mythology',
    story: 'Taurus represents the white bull that Zeus transformed into to abduct the Phoenician princess Europa. Captivated by his beauty, she rode upon his back across the sea to Crete. The constellation immortalizes this dramatic transformation and the abduction that changed history.',
    funFact: 'Taurus contains the Pleiades star cluster, also known as the Seven Sisters, one of the most beautiful and well-known star clusters visible to the naked eye.',
    bestSeason: 'Winter (December to March)',
    mainStars: ['Aldebaran', 'Alnath', 'Alcyone', 'Atlas']
  },
  Vir: {
    title: 'Virgo the Maiden',
    emoji: '🌾',
    origin: 'Greek Mythology',
    story: 'Virgo represents the goddess of agriculture and spring, often identified as Demeter or Persephone. In mythology, when Persephone was abducted by Hades, Demeter\'s grief caused the earth to become barren, creating winter. Virgo\'s return to the spring sky symbolizes the renewal of crops and fertility.',
    funFact: 'Virgo is the second largest constellation and contains the Virgo Cluster, a collection of thousands of galaxies visible through telescopes.',
    bestSeason: 'Spring (March to May)',
    mainStars: ['Spica', 'Porrima', 'Vindemiatrix', 'Mu Virginis']
  },
  Aql: {
    title: 'Aquila the Eagle',
    emoji: '🦅',
    origin: 'Greek Mythology',
    story: 'Aquila represents the eagle of Zeus, employed by the king of gods to fetch the shepherd boy Ganymede to Olympus. In other versions, the eagle is associated with other divine missions. The constellation symbolizes power, swiftness, and the connection between heaven and earth.',
    funFact: 'Altair, the brightest star in Aquila, is one of the nearest bright stars to Earth and forms one corner of the Summer Triangle asterism.',
    bestSeason: 'Summer (June to September)',
    mainStars: ['Altair', 'Alshain', 'Tarazed', 'Deneb el Okab']
  },
  Boo: {
    title: 'Boötes the Herdsman',
    emoji: '👨‍🌾',
    origin: 'Greek Mythology',
    story: 'Boötes represents a herdsman or farmer who invented the plow and agriculture, blessing humanity with the ability to cultivate crops. In some tales, he is Icarius, who was rewarded by Demeter for his hospitality. The constellation honors the gift of agricultural knowledge to mankind.',
    funFact: 'Arcturus, the brightest star in Boötes, is the fourth brightest star in the entire night sky and lies at the end of the arc formed by the Big Dipper\'s handle.',
    bestSeason: 'Spring (April to June)',
    mainStars: ['Arcturus', 'Nekkar', 'Izar', 'Muphrid']
  },
  CrB: {
    title: 'Corona Borealis the Northern Crown',
    emoji: '👑',
    origin: 'Greek Mythology',
    story: 'Corona Borealis represents the crown given to Ariadne by Dionysus as a wedding gift. Ariadne had helped the hero Theseus navigate the labyrinth of the Minotaur with her thread, but was abandoned by him. Dionysus consoled her and made her his bride, placing her crown in the sky as an eternal symbol of their union.',
    funFact: 'The Blaze Star, Coronae Borealis, can suddenly increase in brightness by up to 200 times, earning it the nickname "Blaze Star" due to its unpredictable nova outbursts.',
    bestSeason: 'Spring and Summer (May to July)',
    mainStars: ['Alphecca', 'Nusakan', 'Theta Coronae Borealis']
  },
  Her: {
    title: 'Hercules the Hero',
    emoji: '💪',
    origin: 'Greek Mythology',
    story: 'Hercules represents the greatest hero of Greek mythology, famous for his superhuman strength and his twelve labors. These impossible tasks included slaying the Nemean Lion, capturing the Golden Hind, and obtaining the Golden Apples of the Hesperides. The constellation honors his legacy of courage and perseverance.',
    funFact: 'Hercules contains M13, the Great Hercules Cluster, one of the most spectacular globular star clusters visible from Earth, containing around 300,000 stars.',
    bestSeason: 'Summer (June to August)',
    mainStars: ['Ras Algethi', 'Kornephoros', 'Sarin', 'Tau Herculis']
  },
  UMi: {
    title: 'Ursa Minor the Little Bear',
    emoji: '🐻',
    origin: 'Greek Mythology',
    story: 'Ursa Minor represents the little bear, variously identified as Arcas (the son of Callisto and Zeus) or as a separate creature. Placed in the sky near his mother Ursa Major, this constellation serves as a celestial marker. The constellation holds immense practical importance as the home of Polaris, the North Star.',
    funFact: 'Polaris, the brightest star in Ursa Minor, sits almost directly above Earth\'s North Pole, making it invaluable for navigation throughout human history.',
    bestSeason: 'Year-round in Northern Hemisphere',
    mainStars: ['Polaris', 'Yildun', 'Pherkad', 'Kochab']
  }
};

const ConstellationNarrator = ({ constellation, open, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState('story');
  const [speechRate, setSpeechRate] = useState(1);
  const [highlightedSentence, setHighlightedSentence] = useState(0);
  const [supportsSpeechSynthesis, setSupportsSpeechSynthesis] = useState(false);
  const utteranceRef = useRef(null);
  const recognizedSentencesRef = useRef([]);

  // Check for SpeechSynthesis support
  useEffect(() => {
    setSupportsSpeechSynthesis('speechSynthesis' in window);
  }, []);

  // Parse text into sentences
  const getSentences = useCallback((text) => {
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [text];
  }, []);

  // Handle speech boundary events
  const handleBoundary = useCallback((event) => {
    if (event.charIndex !== undefined) {
      const currentText = currentSection === 'story'
        ? constellationData.story
        : constellationData.funFact;
      const sentences = getSentences(currentText);

      let charCount = 0;
      for (let i = 0; i < sentences.length; i++) {
        if (charCount <= event.charIndex && event.charIndex < charCount + sentences[i].length) {
          setHighlightedSentence(i);
          break;
        }
        charCount += sentences[i].length;
      }
    }
  }, [currentSection, constellation]);

  const constellationData = CONSTELLATION_DATABASE[constellation];

  if (!constellationData) {
    return null;
  }

  const speak = useCallback((text, section) => {
    if (!supportsSpeechSynthesis) return;

    window.speechSynthesis.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = speechRate;
    utteranceRef.current.pitch = 1;
    utteranceRef.current.volume = 1;

    // Try to use English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (englishVoice) {
      utteranceRef.current.voice = englishVoice;
    }

    utteranceRef.current.onstart = () => setIsPlaying(true);
    utteranceRef.current.onend = () => {
      setIsPlaying(false);
      setHighlightedSentence(0);
    };
    utteranceRef.current.onerror = () => {
      setIsPlaying(false);
      setHighlightedSentence(0);
    };
    utteranceRef.current.onboundary = handleBoundary;

    window.speechSynthesis.speak(utteranceRef.current);
  }, [speechRate, supportsSpeechSynthesis, handleBoundary]);

  const handlePlay = useCallback(() => {
    const textToSpeak = currentSection === 'story'
      ? constellationData.story
      : constellationData.funFact;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      speak(textToSpeak, currentSection);
    }
  }, [isPlaying, currentSection, speak, constellationData]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setHighlightedSentence(0);
  }, []);

  const handleClose = useCallback(() => {
    handleStop();
    onClose();
  }, [handleStop, onClose]);

  const handleSectionChange = useCallback((section) => {
    handleStop();
    setCurrentSection(section);
  }, [handleStop]);

  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setSpeechRate(newRate);

    if (isPlaying && utteranceRef.current) {
      const currentText = currentSection === 'story'
        ? constellationData.story
        : constellationData.funFact;

      const position = window.speechSynthesis.paused ? 'paused' : 'speaking';
      handleStop();

      if (position === 'speaking') {
        setTimeout(() => speak(currentText, currentSection), 100);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Close when open becomes false
  useEffect(() => {
    if (!open && isPlaying) {
      handleStop();
    }
  }, [open, isPlaying, handleStop]);

  if (!open) return null;

  const currentText = currentSection === 'story'
    ? constellationData.story
    : constellationData.funFact;

  const sentences = getSentences(currentText);

  return (
    <div className="fixed bottom-0 right-0 z-50 animate-slideUp">
      <div className="glass-panel cosmos-gradient-subtle m-4 rounded-xl w-96 shadow-2xl backdrop-blur-xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{constellationData.emoji}</span>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {constellationData.title}
              </h3>
              <p className="text-xs text-white/60">
                {constellationData.origin}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close narrator"
          >
            <X size={18} className="text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4">
          {/* Story/Fun Fact Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSectionChange('story')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                currentSection === 'story'
                  ? 'bg-cosmos-blue/30 text-white border border-cosmos-blue/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Story
            </button>
            <button
              onClick={() => handleSectionChange('funFact')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                currentSection === 'funFact'
                  ? 'bg-cosmos-blue/30 text-white border border-cosmos-blue/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Zap size={14} className="inline mr-1" />
              Fun Fact
            </button>
          </div>

          {/* Text Display with Highlighting */}
          <div className="bg-white/5 rounded-lg p-3 min-h-24 text-sm text-white/90 leading-relaxed">
            {supportsSpeechSynthesis ? (
              <div className="space-y-2">
                {sentences.map((sentence, idx) => (
                  <span
                    key={idx}
                    className={`transition-all duration-200 ${
                      isPlaying && highlightedSentence === idx
                        ? 'bg-cosmos-blue/40 px-2 py-1 rounded'
                        : ''
                    }`}
                  >
                    {sentence}{' '}
                  </span>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-xs text-cosmos-blue/70 mb-2">
                  Speech Synthesis not available
                </p>
                {currentText}
              </div>
            )}
          </div>

          {/* Playback Controls */}
          {supportsSpeechSynthesis && (
            <div className="space-y-3">
              {/* Play/Pause/Stop Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handlePlay}
                  disabled={!supportsSpeechSynthesis}
                  className="flex-1 bg-cosmos-blue/30 hover:bg-cosmos-blue/50 disabled:opacity-50 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={16} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Play
                    </>
                  )}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg transition-colors font-medium text-sm"
                >
                  Stop
                </button>
              </div>

              {/* Rate Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Speed</span>
                  <span className="text-cosmos-blue/80 font-medium">
                    {(speechRate * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={speechRate}
                  onChange={handleRateChange}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cosmos-blue"
                />
              </div>

              {/* Visual Feedback */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1 h-6">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-cosmos-blue rounded-full animate-pulse"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          height: `${16 + i * 8}px`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-cosmos-blue/70 ml-2">Speaking...</span>
                </div>
              )}
            </div>
          )}

          {/* Star Info */}
          <div className="bg-white/5 rounded-lg p-3 text-xs">
            <p className="text-white/60 mb-2">Main Stars:</p>
            <div className="flex flex-wrap gap-2">
              {constellationData.mainStars.map((star, idx) => (
                <span
                  key={idx}
                  className="bg-cosmos-blue/20 text-cosmos-blue/90 px-2 py-1 rounded text-xs"
                >
                  {star}
                </span>
              ))}
            </div>
          </div>

          {/* Best Season */}
          <div className="bg-white/5 rounded-lg p-3 text-xs flex items-center gap-2">
            <Volume2 size={14} className="text-cosmos-blue/70" />
            <div>
              <p className="text-white/60">Best Season:</p>
              <p className="text-white/90 font-medium">{constellationData.bestSeason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstellationNarrator;
