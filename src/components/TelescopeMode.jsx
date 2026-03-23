import React, { useState, useMemo, useCallback } from 'react';
import useAppStore from '../store/useAppStore';

/**
 * Telescope Mode — Deep-sky object viewer for Orbital Dome PWA
 *
 * Provides a simulated telescope eyepiece view of famous deep-sky objects
 * (nebulae, galaxies, star clusters). Features real astronomical data,
 * interactive magnification & aperture selection, and visual renderings
 * that approximate what observers would see through various telescopes.
 *
 * Props:
 *  - open: boolean (modal visibility)
 *  - onClose: function (close handler)
 *  - targetObject: optional pre-selected object ID (e.g. 'M42')
 */

// ==============================================================================
// DEEP-SKY OBJECT CATALOG
// ==============================================================================
const DSO_CATALOG = [
  {
    id: 'M1',
    name: 'Crab Nebula',
    type: 'nebula',
    constellation: 'Taurus',
    ra: 83.63, // degrees
    dec: 22.01,
    mag: 8.4,
    size: '6x4 arcmin',
    distance: '6500 ly',
    description: 'Remnant of a supernova explosion observed by Chinese astronomers in 1054 AD. Contains a rapidly spinning neutron star.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Crab_Nebula.jpg',
    colorPrimary: '#ff4444',
    colorSecondary: '#ffaa44',
  },
  {
    id: 'M8',
    name: 'Lagoon Nebula',
    type: 'nebula',
    constellation: 'Sagittarius',
    ra: 270.97,
    dec: -24.38,
    mag: 5.8,
    size: '90x40 arcmin',
    distance: '4000-6000 ly',
    description: 'Giant interstellar cloud and H II region. A stellar nursery where new stars are actively forming.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Lagoon_nebula.jpg',
    colorPrimary: '#ff6688',
    colorSecondary: '#ff99cc',
  },
  {
    id: 'M13',
    name: 'Great Globular Cluster',
    type: 'cluster',
    constellation: 'Hercules',
    ra: 250.42,
    dec: 36.46,
    mag: 5.8,
    size: '20 arcmin',
    distance: '25100 ly',
    description: 'One of the most impressive globular clusters in the Northern Hemisphere. Contains ~300,000 stars.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/M13_Hercules_Globular_Cluster.jpg',
    colorPrimary: '#ffddaa',
    colorSecondary: '#ffffaa',
  },
  {
    id: 'M16',
    name: 'Eagle Nebula',
    type: 'nebula',
    constellation: 'Serpens',
    ra: 274.70,
    dec: -13.81,
    mag: 6.4,
    size: '70x55 arcmin',
    distance: '7000 ly',
    description: 'Famous for the "Pillars of Creation" — towering columns of gas and dust sculpted by stellar winds.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Eagle_Nebula_Spitzer.jpg',
    colorPrimary: '#9966ff',
    colorSecondary: '#cc99ff',
  },
  {
    id: 'M20',
    name: 'Trifid Nebula',
    type: 'nebula',
    constellation: 'Sagittarius',
    ra: 270.52,
    dec: -23.02,
    mag: 6.3,
    size: '28x28 arcmin',
    distance: '5200 ly',
    description: 'Divided into three lobes by dark dust bands. Shows beautiful red, blue, and dark nebulosity.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Trifid_Nebula.jpg',
    colorPrimary: '#ff5577',
    colorSecondary: '#6699ff',
  },
  {
    id: 'M27',
    name: 'Dumbbell Nebula',
    type: 'nebula',
    constellation: 'Vulpecula',
    ra: 298.57,
    dec: 22.72,
    mag: 7.5,
    size: '8x5.6 arcmin',
    distance: '1300 ly',
    description: 'Planetary nebula with distinctive dumbbell shape. Ejected from a dying star about 9,800 years ago.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/M27_Dumbbell_Nebula_by_HST.jpg',
    colorPrimary: '#44ddff',
    colorSecondary: '#88ffff',
  },
  {
    id: 'M31',
    name: 'Andromeda Galaxy',
    type: 'galaxy',
    constellation: 'Andromeda',
    ra: 10.68,
    dec: 41.27,
    mag: 3.4,
    size: '220x60 arcmin',
    distance: '2.5 million ly',
    description: 'Largest galaxy in the Local Group. Contains ~1 trillion stars. Will merge with the Milky Way in ~5 billion years.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/M31_Andromeda.jpg',
    colorPrimary: '#ffccaa',
    colorSecondary: '#ffeecc',
  },
  {
    id: 'M33',
    name: 'Triangulum Galaxy',
    type: 'galaxy',
    constellation: 'Triangulum',
    ra: 23.46,
    dec: 30.66,
    mag: 5.7,
    size: '73x45 arcmin',
    distance: '3 million ly',
    description: 'Third-largest galaxy in the Local Group. A spiral galaxy with prominent star-forming regions.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Messier33_SDSS.jpg',
    colorPrimary: '#ffddcc',
    colorSecondary: '#ffffdd',
  },
  {
    id: 'M42',
    name: 'Orion Nebula',
    type: 'nebula',
    constellation: 'Orion',
    ra: 83.82,
    dec: -5.39,
    mag: 4.0,
    size: '85x60 arcmin',
    distance: '1300 ly',
    description: 'Brightest emission nebula visible from Earth. A stellar nursery with four young stars (the Trapezium) at its core.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Orion_Nebula_-_Hubble_2006_full_res_edit.jpg',
    colorPrimary: '#ff6688',
    colorSecondary: '#44ddff',
  },
  {
    id: 'M45',
    name: 'Pleiades',
    type: 'cluster',
    constellation: 'Taurus',
    ra: 56.87,
    dec: 24.11,
    mag: 1.6,
    size: '120 arcmin',
    distance: '440 ly',
    description: 'Open cluster of young blue stars. Named for the seven sisters in Greek mythology; ~500 stars visible in telescopes.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Pleiades_large.jpg',
    colorPrimary: '#aaddff',
    colorSecondary: '#ddffff',
  },
  {
    id: 'M51',
    name: 'Whirlpool Galaxy',
    type: 'galaxy',
    constellation: 'Canes Venatici',
    ra: 202.24,
    dec: 47.19,
    mag: 8.4,
    size: '11x8 arcmin',
    distance: '23 million ly',
    description: 'Classic grand-design spiral galaxy. Interacting with companion galaxy NGC 5195, triggering intense star formation.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Messier_51_final.jpg',
    colorPrimary: '#ffccaa',
    colorSecondary: '#ffddaa',
  },
  {
    id: 'M57',
    name: 'Ring Nebula',
    type: 'nebula',
    constellation: 'Lyra',
    ra: 283.47,
    dec: 33.02,
    mag: 8.8,
    size: '1.4x1.0 arcmin',
    distance: '2300 ly',
    description: 'Planetary nebula with beautiful ring structure. Gas ejected from a dying white dwarf, glowing from UV radiation.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/M57.jpg',
    colorPrimary: '#44ccff',
    colorSecondary: '#88ddff',
  },
  {
    id: 'M81',
    name: 'Bode\'s Galaxy',
    type: 'galaxy',
    constellation: 'Ursa Major',
    ra: 148.89,
    dec: 69.37,
    mag: 6.9,
    size: '26.9x14.3 arcmin',
    distance: '12 million ly',
    description: 'Spiral galaxy notable for its superwind — a large-scale outflow driven by star formation and supernovae.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Messier_81_SDSS.jpg',
    colorPrimary: '#ffddaa',
    colorSecondary: '#ffffcc',
  },
  {
    id: 'M82',
    name: 'Cigar Galaxy',
    type: 'galaxy',
    constellation: 'Ursa Major',
    ra: 148.97,
    dec: 69.68,
    mag: 8.4,
    size: '11.2x4.3 arcmin',
    distance: '12 million ly',
    description: 'Starburst galaxy with intense star formation and powerful galactic winds ejecting material across space.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Messier_82_HST_WFPC2_1999-04-20.jpg',
    colorPrimary: '#ffbbaa',
    colorSecondary: '#ffddcc',
  },
  {
    id: 'M101',
    name: 'Pinwheel Galaxy',
    type: 'galaxy',
    constellation: 'Ursa Major',
    ra: 210.80,
    dec: 54.35,
    mag: 7.9,
    size: '22x20 arcmin',
    distance: '21 million ly',
    description: 'Nearly face-on spiral galaxy with prominent star-forming regions. One of the largest spirals known.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/M101_hires_STScI-PRC2006-10.jpg',
    colorPrimary: '#ffddcc',
    colorSecondary: '#ffffdd',
  },
  {
    id: 'M104',
    name: 'Sombrero Galaxy',
    type: 'galaxy',
    constellation: 'Virgo',
    ra: 189.86,
    dec: -11.62,
    mag: 8.0,
    size: '9x4 arcmin',
    distance: '28 million ly',
    description: 'Edge-on spiral galaxy with a prominent dark dust lane. Resembles a wide-brimmed hat.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Sombrero_Galaxy_Hubble_Heritage.jpg',
    colorPrimary: '#ffccaa',
    colorSecondary: '#ffeecc',
  },
  {
    id: 'NGC2024',
    name: 'Flame Nebula',
    type: 'nebula',
    constellation: 'Orion',
    ra: 86.39,
    dec: -1.42,
    mag: 10.0,
    size: '30x30 arcmin',
    distance: '1500 ly',
    description: 'Emission nebula adjacent to the star Alnitak. Shaped by stellar winds from nearby massive stars.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/NGC2024.jpg',
    colorPrimary: '#ff7744',
    colorSecondary: '#ffaa77',
  },
  {
    id: 'NGC7000',
    name: 'North America Nebula',
    type: 'nebula',
    constellation: 'Cygnus',
    ra: 320.86,
    dec: 44.34,
    mag: 6.0,
    size: '120x100 arcmin',
    distance: '2000 ly',
    description: 'Emission nebula shaped like the North American continent. Best visible in dark skies using long exposures.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/NGC7000_Hubble.jpg',
    colorPrimary: '#ff6688',
    colorSecondary: '#ff99bb',
  },
  {
    id: 'NGC224',
    name: 'Helix Nebula',
    type: 'nebula',
    constellation: 'Aquarius',
    ra: 336.13,
    dec: -27.71,
    mag: 7.3,
    size: '16x28 arcmin',
    distance: '700 ly',
    description: 'Planetary nebula resembling a helix or eye. One of the closest planetary nebulae to Earth.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Helix_nebula.jpg',
    colorPrimary: '#44ddff',
    colorSecondary: '#88ffff',
  },
];

// ==============================================================================
// EYEPIECE VIEW COMPONENT
// ==============================================================================
function EyepieceView({ object, magnification, aperture, longExposure }) {
  if (!object) {
    return (
      <div className="relative w-96 h-96 rounded-full border-8 border-gray-900 bg-black shadow-2xl flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="text-gray-600 text-sm">Select an object to begin</div>
        </div>
      </div>
    );
  }

  // FOV in arcminutes (simplified)
  const baseFOV = 100; // base 50x magnification = 1.6°
  const fov = baseFOV / (magnification / 50);

  // Aperture affects brightness and detail
  const apertureMap = { '4"': 0.6, '8"': 0.85, '12"': 1.0 };
  const brightness = apertureMap[aperture] || 0.85;

  // Long exposure mode shows more color/detail
  const showDetails = longExposure;

  return (
    <div className="relative w-96 h-96 rounded-full border-8 border-gray-900 bg-black shadow-2xl flex items-center justify-center overflow-hidden">
      {/* Subtle crosshair */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
      >
        <line x1="200" y1="180" x2="200" y2="220" stroke="#33ff33" strokeWidth="0.5" opacity="0.3" />
        <line x1="180" y1="200" x2="220" y2="200" stroke="#33ff33" strokeWidth="0.5" opacity="0.3" />
        <circle cx="200" cy="200" r="80" fill="none" stroke="#33ff33" strokeWidth="0.5" opacity="0.2" />
      </svg>

      {/* Object rendering based on type */}
      {object.type === 'nebula' && (
        <NebulaRender
          object={object}
          brightness={brightness}
          showDetails={showDetails}
        />
      )}
      {object.type === 'galaxy' && (
        <GalaxyRender
          object={object}
          brightness={brightness}
          showDetails={showDetails}
        />
      )}
      {object.type === 'cluster' && (
        <ClusterRender
          object={object}
          brightness={brightness}
          showDetails={showDetails}
        />
      )}

      {/* Telescope specs overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-400 opacity-60 font-mono">
        <div>{aperture} f/8 • {magnification}x</div>
        <div>FOV: {fov.toFixed(1)}°</div>
      </div>
    </div>
  );
}

function NebulaRender({ object, brightness, showDetails }) {
  const opacity = 0.3 + brightness * 0.5;
  const blurIntensity = showDetails ? 'blur(20px)' : 'blur(30px)';

  return (
    <>
      {/* Primary color core */}
      <div
        className="absolute"
        style={{
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle, ${object.colorPrimary} 0%, transparent 70%)`,
          opacity: opacity,
          filter: blurIntensity,
          borderRadius: '50%',
        }}
      />
      {/* Secondary halo */}
      <div
        className="absolute"
        style={{
          width: '160px',
          height: '160px',
          background: `radial-gradient(circle, ${object.colorSecondary} 0%, transparent 60%)`,
          opacity: opacity * 0.5,
          filter: `blur(${showDetails ? '25px' : '35px'})`,
          borderRadius: '50%',
        }}
      />
      {/* Fine detail (long exposure) */}
      {showDetails && (
        <div
          className="absolute"
          style={{
            width: '140px',
            height: '140px',
            background: `conic-gradient(from 0deg, ${object.colorPrimary}, ${object.colorSecondary}, ${object.colorPrimary})`,
            opacity: 0.15,
            filter: 'blur(15px)',
            borderRadius: '50%',
          }}
        />
      )}
    </>
  );
}

function GalaxyRender({ object, brightness, showDetails }) {
  const opacity = 0.25 + brightness * 0.4;

  return (
    <>
      {/* Galactic core */}
      <div
        className="absolute"
        style={{
          width: '90px',
          height: '90px',
          background: `radial-gradient(circle, ${object.colorPrimary} 0%, ${object.colorSecondary} 50%, transparent 100%)`,
          opacity: opacity,
          filter: 'blur(12px)',
          borderRadius: '50%',
        }}
      />
      {/* Outer arms */}
      <div
        className="absolute"
        style={{
          width: '150px',
          height: '80px',
          background: `ellipse-gradient`,
          background: `linear-gradient(90deg, transparent 0%, ${object.colorSecondary} 30%, ${object.colorPrimary} 50%, ${object.colorSecondary} 70%, transparent 100%)`,
          opacity: opacity * 0.3,
          filter: 'blur(20px)',
        }}
      />
      {/* Detail structure */}
      {showDetails && (
        <div
          className="absolute"
          style={{
            width: '140px',
            height: '85px',
            border: `1px solid ${object.colorPrimary}`,
            opacity: 0.1,
            filter: 'blur(3px)',
            borderRadius: '50%',
            transform: 'skewX(-20deg)',
          }}
        />
      )}
    </>
  );
}

function ClusterRender({ object, brightness, showDetails }) {
  const starCount = showDetails ? 40 : 20;
  const stars = [];

  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2;
    const radius = 50 + Math.random() * 40;
    const x = 200 + Math.cos(angle) * radius + (Math.random() - 0.5) * 20;
    const y = 200 + Math.sin(angle) * radius + (Math.random() - 0.5) * 20;
    const size = Math.random() * 1.5 + 0.5;

    stars.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r={size}
        fill="#aaddff"
        opacity={0.4 + brightness * 0.4}
      />
    );
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
      {/* Background nebulosity (faint) */}
      <circle
        cx="200"
        cy="200"
        r="90"
        fill="#aaddff"
        opacity={0.05}
      />
      {/* Stars */}
      {stars}
    </svg>
  );
}

// ==============================================================================
// OBJECT SELECTOR
// ==============================================================================
function ObjectSelector({ objects, selectedId, onSelect, filterType, onFilterChange }) {
  const filtered = filterType === 'All'
    ? objects
    : objects.filter((obj) => obj.type === filterType.toLowerCase());

  const types = ['All', 'Nebulae', 'Galaxies', 'Clusters'];

  return (
    <div className="space-y-4">
      {/* Type filters */}
      <div className="flex gap-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filterType === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Object list */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {filtered.map((obj) => (
          <button
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedId === obj.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {obj.id}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==============================================================================
// INFO PANEL
// ==============================================================================
function InfoPanel({ object }) {
  if (!object) {
    return (
      <div className="text-gray-400 text-sm">
        No object selected. Choose one from the catalog above.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <h3 className="text-xl font-bold text-white">{object.name}</h3>
        <p className="text-gray-400">Catalog: {object.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-500">Type</p>
          <p className="text-white capitalize">{object.type}</p>
        </div>
        <div>
          <p className="text-gray-500">Constellation</p>
          <p className="text-white">{object.constellation}</p>
        </div>
        <div>
          <p className="text-gray-500">Magnitude</p>
          <p className="text-white">{object.mag}</p>
        </div>
        <div>
          <p className="text-gray-500">Angular Size</p>
          <p className="text-white">{object.size}</p>
        </div>
        <div>
          <p className="text-gray-500">Distance</p>
          <p className="text-white">{object.distance}</p>
        </div>
        <div>
          <p className="text-gray-500">Coordinates</p>
          <p className="text-white">{object.ra.toFixed(2)}°, {object.dec.toFixed(2)}°</p>
        </div>
      </div>

      <div>
        <p className="text-gray-500 text-xs mb-2">Description</p>
        <p className="text-gray-300 text-xs leading-relaxed">
          {object.description}
        </p>
      </div>
    </div>
  );
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
export default function TelescopeMode({ open, onClose, targetObject }) {
  const [selectedId, setSelectedId] = useState(targetObject || 'M42');
  const [filterType, setFilterType] = useState('All');
  const [magnification, setMagnification] = useState(100);
  const [aperture, setAperture] = useState('8"');
  const [longExposure, setLongExposure] = useState(false);

  const selectedObject = useMemo(() => {
    return DSO_CATALOG.find((obj) => obj.id === selectedId);
  }, [selectedId]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const handleFilterChange = useCallback((type) => {
    setFilterType(type);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-900/80 hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main container */}
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col lg:flex-row gap-6">
        {/* Left: Eyepiece viewer */}
        <div className="flex flex-col items-center lg:flex-shrink-0">
          <EyepieceView
            object={selectedObject}
            magnification={magnification}
            aperture={aperture}
            longExposure={longExposure}
          />
        </div>

        {/* Right: Controls and info */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-900/60 backdrop-blur-md rounded-xl p-6 border border-gray-700/50 space-y-6">
          {/* Header */}
          <h2 className="text-2xl font-bold text-white">Telescope Mode</h2>

          {/* Object selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Deep-Sky Object Catalog</h3>
            <ObjectSelector
              objects={DSO_CATALOG}
              selectedId={selectedId}
              onSelect={handleSelect}
              filterType={filterType}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Telescope controls */}
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-300">Telescope Configuration</h3>

            {/* Magnification */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Magnification</label>
                <span className="text-white font-mono text-sm">{magnification}x</span>
              </div>
              <input
                type="range"
                min="50"
                max="400"
                step="10"
                value={magnification}
                onChange={(e) => setMagnification(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50x</span>
                <span>400x</span>
              </div>
            </div>

            {/* Aperture */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Primary Aperture</label>
              <div className="flex gap-2">
                {['4"', '8"', '12"'].map((ap) => (
                  <button
                    key={ap}
                    onClick={() => setAperture(ap)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      aperture === ap
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>

            {/* Long exposure toggle */}
            <div className="flex items-center justify-between pt-2">
              <label className="text-xs text-gray-400">Long Exposure Mode</label>
              <button
                onClick={() => setLongExposure(!longExposure)}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                  longExposure ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform m-0.5 ${
                    longExposure ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info panel */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Object Information</h3>
            <div className="bg-gray-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <InfoPanel object={selectedObject} />
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
            <p>
              Telescope simulation renders objects as they might appear through
              various eyepieces. Visual accuracy depends on magnification, aperture,
              and atmospheric conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
