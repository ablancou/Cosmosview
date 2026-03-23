import React from 'react';
import useAppStore from '../store/useAppStore';

/**
 * DSOInfoCard — Deep Sky Object information card.
 * Shows NASA/ESA imagery, type, distance, constellation, magnitude,
 * size, and a fun fact for Messier & notable NGC objects.
 * Triggered when the user clicks a DSO in the sky view.
 */

// ═══════════════════════════════════════════════════════
// IMAGES — NASA/ESA/Wikimedia public-domain thumbnails
// ═══════════════════════════════════════════════════════
const DSO_IMAGES = {
    M1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/480px-Crab_Nebula.jpg',
    M8: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Lagoon_Nebula_from_ESO.jpg/480px-Lagoon_Nebula_from_ESO.jpg',
    M13: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/M13_from_an_8%22_SCT.jpg/480px-M13_from_an_8%22_SCT.jpg',
    M16: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Eagle_Nebula_from_ESO.jpg/480px-Eagle_Nebula_from_ESO.jpg',
    M17: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/The_Omega_Nebula.jpg/480px-The_Omega_Nebula.jpg',
    M20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Trifid.nebula.arp.750pix.jpg/480px-Trifid.nebula.arp.750pix.jpg',
    M27: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dumbbell_Nebula_M27.jpg/480px-Dumbbell_Nebula_M27.jpg',
    M31: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Andromeda_Galaxy_%28with_h-alpha%29.jpg/480px-Andromeda_Galaxy_%28with_h-alpha%29.jpg',
    M33: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg/480px-VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg',
    M42: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/480px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
    M45: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/480px-Pleiades_large.jpg',
    M51: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/480px-Messier51_sRGB.jpg',
    M57: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/M57_The_Ring_Nebula.JPG/480px-M57_The_Ring_Nebula.JPG',
    M63: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Messier63_-_SDSS_DR14_%28panorama%29.jpg/480px-Messier63_-_SDSS_DR14_%28panorama%29.jpg',
    M64: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Blackeyegalaxy.jpg/480px-Blackeyegalaxy.jpg',
    M74: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Messier_74_by_HST.jpg/480px-Messier_74_by_HST.jpg',
    M81: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Messier_81_HST.jpg/480px-Messier_81_HST.jpg',
    M82: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/M82_HST_ACS_2006-14-a-large_web.jpg/480px-M82_HST_ACS_2006-14-a-large_web.jpg',
    M83: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Messier_83.jpg/480px-Messier_83.jpg',
    M87: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/M87_jet.jpg/480px-M87_jet.jpg',
    M97: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/M97_-_Owl_Nebula.jpg/480px-M97_-_Owl_Nebula.jpg',
    M101: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M101_hires_STScI-PRC2006-10a.jpg/480px-M101_hires_STScI-PRC2006-10a.jpg',
    M104: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg/480px-M104_ngc4594_sombrero_galaxy_hi-res.jpg',
    NGC3372: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Carina_Nebula_by_ESO.jpg/480px-Carina_Nebula_by_ESO.jpg',
    NGC7000: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/North_America_nebula_7000.jpg/480px-North_America_nebula_7000.jpg',
    NGC5139: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Omega_Centauri_by_ESO.jpg/480px-Omega_Centauri_by_ESO.jpg',
};

// ═══════════════════════════════════════════════════════
// DETAILED INFO for popular DSOs
// ═══════════════════════════════════════════════════════
const DSO_INFO = {
    M1: { dist: '6,500 ly', size: '11 × 7 arcmin', mag: '8.4', constellation: 'Taurus', fact: 'This expanding cloud of gas is the remnant of a supernova explosion observed by Chinese astronomers in 1054 AD. At its center spins a pulsar rotating 30 times per second.' },
    M8: { dist: '4,100 ly', size: '90 × 40 arcmin', mag: '6.0', constellation: 'Sagittarius', fact: 'One of the brightest star-forming regions in our galaxy. The nebula contains several Bok globules — dark clouds that are collapsing to form new stars.' },
    M13: { dist: '22,200 ly', size: '20 arcmin', mag: '5.8', constellation: 'Hercules', fact: 'Contains about 300,000 stars packed into a sphere just 145 light-years across. In 1974, the Arecibo message was beamed toward this cluster.' },
    M16: { dist: '7,000 ly', size: '7 arcmin', mag: '6.0', constellation: 'Serpens', fact: 'Home to the iconic "Pillars of Creation" — towering columns of gas and dust where new stars are being born, famously photographed by Hubble.' },
    M17: { dist: '5,000 ly', size: '11 arcmin', mag: '6.0', constellation: 'Sagittarius', fact: 'One of the brightest and most massive star-forming regions in our galaxy. Its horseshoe shape gives it the nickname "Omega" or "Swan" Nebula.' },
    M20: { dist: '5,200 ly', size: '28 arcmin', mag: '6.3', constellation: 'Sagittarius', fact: 'A rare combination of three types of nebula in one: an emission nebula (red), a reflection nebula (blue), and a dark nebula (the dividing lanes).' },
    M27: { dist: '1,360 ly', size: '8 × 5.7 arcmin', mag: '7.5', constellation: 'Vulpecula', fact: 'The first planetary nebula ever discovered (1764). It shows what our Sun will look like in about 5 billion years when it sheds its outer layers.' },
    M31: { dist: '2.5 million ly', size: '190 × 60 arcmin', mag: '3.4', constellation: 'Andromeda', fact: 'The nearest major galaxy to the Milky Way, containing about 1 trillion stars. It is approaching us at 110 km/s and will collide with our galaxy in ~4.5 billion years.' },
    M33: { dist: '2.7 million ly', size: '68 × 42 arcmin', mag: '5.7', constellation: 'Triangulum', fact: 'The third-largest galaxy in our Local Group. It contains the enormous NGC 604 nebula, one of the largest known star-forming regions at 1,500 light-years across.' },
    M42: { dist: '1,344 ly', size: '85 × 60 arcmin', mag: '4.0', constellation: 'Orion', fact: 'The closest large star-forming nursery to Earth. Over 700 young stars have been found here, some with protoplanetary disks that may form planets.' },
    M45: { dist: '444 ly', size: '110 arcmin', mag: '1.6', constellation: 'Taurus', fact: 'Known since antiquity, the Pleiades are a young cluster (~100 million years old) of hot blue stars surrounded by a reflection nebula from a passing dust cloud.' },
    M51: { dist: '23 million ly', size: '11 × 7 arcmin', mag: '8.4', constellation: 'Canes Venatici', fact: 'The classic face-on spiral galaxy interacting with its smaller companion NGC 5195. This was the first galaxy where spiral structure was observed (1845).' },
    M57: { dist: '2,283 ly', size: '1.4 × 1.0 arcmin', mag: '8.8', constellation: 'Lyra', fact: 'The iconic "Ring Nebula" — a shell of ionized gas expelled by a dying star. The central white dwarf has a surface temperature of about 120,000°C.' },
    M63: { dist: '37 million ly', size: '12.6 × 7.2 arcmin', mag: '8.6', constellation: 'Canes Venatici', fact: 'Named for its swirling, petal-like spiral arms. It was one of the first galaxies to have its spiral nature identified.' },
    M64: { dist: '17 million ly', size: '10 × 5.4 arcmin', mag: '8.5', constellation: 'Coma Berenices', fact: 'The dramatic dark band of dust gives this galaxy its "black eye." Remarkably, the outer regions rotate in the opposite direction to the inner disk.' },
    M74: { dist: '32 million ly', size: '10.5 × 9.5 arcmin', mag: '9.4', constellation: 'Pisces', fact: 'Called the "Phantom Galaxy" for its low surface brightness. Its nearly perfect face-on spiral structure makes it a textbook example of a grand design spiral.' },
    M81: { dist: '12 million ly', size: '26.9 × 14.1 arcmin', mag: '6.9', constellation: 'Ursa Major', fact: 'One of the brightest galaxies visible from Earth. Its gravitational interaction with the nearby Cigar Galaxy (M82) has triggered a starburst in M82.' },
    M82: { dist: '12 million ly', size: '11.2 × 4.3 arcmin', mag: '8.4', constellation: 'Ursa Major', fact: 'This "starburst" galaxy is forming stars 10x faster than typical galaxies. It ejects enormous plumes of hot gas from its center at 1,000+ km/s.' },
    M83: { dist: '15 million ly', size: '12.9 × 11.5 arcmin', mag: '7.5', constellation: 'Hydra', fact: 'Called the "Southern Pinwheel," it has produced six observed supernovae — more than any other galaxy. It\'s one of the closest barred spirals to Earth.' },
    M87: { dist: '53 million ly', size: '8.3 × 6.6 arcmin', mag: '8.6', constellation: 'Virgo', fact: 'A supergiant elliptical galaxy at the center of the Virgo Cluster. In 2019, the Event Horizon Telescope captured the first image of a black hole in its core.' },
    M97: { dist: '2,600 ly', size: '3.4 × 3.3 arcmin', mag: '9.9', constellation: 'Ursa Major', fact: 'Named for the two dark "eyes" in its disk that resemble an owl\'s face. The central star has exhausted its nuclear fuel and is slowly fading.' },
    M101: { dist: '21 million ly', size: '28.8 × 26.9 arcmin', mag: '7.9', constellation: 'Ursa Major', fact: 'One of the largest spiral galaxies known, spanning 170,000 light-years across — about 70% larger than our Milky Way.' },
    M104: { dist: '29 million ly', size: '8.7 × 3.5 arcmin', mag: '8.0', constellation: 'Virgo', fact: 'The striking dust lane and luminous bulge give it a hat-like appearance. At its center lies a supermassive black hole worth 1 billion solar masses.' },
    NGC3372: { dist: '8,500 ly', size: '120 × 120 arcmin', mag: '1.0', constellation: 'Carina', fact: 'One of the largest and brightest nebulae in the sky. It contains Eta Carinae, a massive binary star system that may go supernova in the near future.' },
    NGC7000: { dist: '2,590 ly', size: '120 × 100 arcmin', mag: '4.0', constellation: 'Cygnus', fact: 'Its shape resembles the continent of North America, including a bright "Gulf of Mexico" region. It\'s actually part of the same hydrogen cloud as the Pelican Nebula.' },
    NGC5139: { dist: '15,800 ly', size: '36 arcmin', mag: '3.7', constellation: 'Centaurus', fact: 'The largest and brightest globular cluster in the Milky Way with 10 million stars. Some astronomers believe it may be the remnant core of a dwarf galaxy.' },
};

const TYPE_NAMES = {
    EN: 'Emission Nebula',
    PN: 'Planetary Nebula',
    RN: 'Reflection Nebula',
    SNR: 'Supernova Remnant',
    GX: 'Galaxy',
    OC: 'Open Cluster',
    GC: 'Globular Cluster',
    DN: 'Dark Nebula',
};

const TYPE_EMOJIS = {
    EN: '🔴', PN: '🟢', RN: '🔵', SNR: '🟠', GX: '🌀', OC: '✨', GC: '⭐', DN: '🌑',
};

export default function DSOInfoCard() {
    const selectedDSO = useAppStore((s) => s.selectedDSO);
    const clearSelectedDSO = useAppStore((s) => s.clearSelectedDSO);

    if (!selectedDSO) return null;

    const { id, name, ra, dec, type } = selectedDSO;
    const info = DSO_INFO[id] || {};
    const image = DSO_IMAGES[id];
    const typeName = TYPE_NAMES[type] || type;
    const emoji = TYPE_EMOJIS[type] || '🔭';

    return (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-4 z-30 w-[calc(100%-2rem)] sm:w-[340px] glass-panel overflow-hidden animate-slideUp"
            style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Header image */}
            {image ? (
                <div className="w-full h-44 overflow-hidden relative">
                    <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white drop-shadow-lg">{name}</h3>
                            <p className="text-[10px] text-white/70">{id} • {typeName}</p>
                        </div>
                        <button onClick={clearSelectedDSO}
                            className="text-white/60 hover:text-white text-xl transition-colors" aria-label="Close">×</button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-28 flex flex-col items-center justify-center relative"
                    style={{ background: 'linear-gradient(135deg, rgba(30,40,60,0.9), rgba(20,25,40,0.95))' }}>
                    <span className="text-4xl mb-1">{emoji}</span>
                    <h3 className="text-base font-bold text-cosmos-text">{name}</h3>
                    <p className="text-[10px] text-cosmos-muted">{id} • {typeName}</p>
                    <button onClick={clearSelectedDSO}
                        className="absolute top-2 right-3 text-cosmos-muted hover:text-cosmos-text text-xl transition-colors">×</button>
                </div>
            )}

            <div className="p-4 space-y-3">
                {/* Data grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {info.dist && <DataCell label="Distance" value={info.dist} />}
                    {info.mag && <DataCell label="Magnitude" value={info.mag} />}
                    {info.size && <DataCell label="Apparent Size" value={info.size} />}
                    {info.constellation && <DataCell label="Constellation" value={info.constellation} />}
                    <DataCell label="RA" value={`${ra.toFixed(2)}h`} />
                    <DataCell label="Dec" value={`${dec > 0 ? '+' : ''}${dec.toFixed(1)}°`} />
                </div>

                {/* Fun fact */}
                {info.fact && (
                    <p className="text-xs text-cosmos-muted/80 leading-relaxed border-t border-cosmos-border/20 pt-2">
                        💡 {info.fact}
                    </p>
                )}

                {/* Credit */}
                <p className="text-[9px] text-cosmos-muted/40">
                    {image ? 'Image: NASA/ESA/Hubble • Public Domain' : `${typeName} in ${info.constellation || 'the night sky'}`}
                </p>
            </div>
        </div>
    );
}

function DataCell({ label, value }) {
    return (
        <div className="rounded px-2.5 py-1.5 bg-cosmos-border/15">
            <div className="text-[9px] text-cosmos-muted uppercase tracking-wider">{label}</div>
            <div className="text-sm font-mono text-cosmos-text">{value}</div>
        </div>
    );
}
