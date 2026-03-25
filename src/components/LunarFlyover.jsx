import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

const MOON_TEXTURES = {
  color4k: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.jpg',
  color8k: 'https://www.solarsystemscope.com/textures/download/8k_moon.jpg',
  color2k: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  displacement: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.jpg',
};

// Moon physical constants
const MOON_RADIUS_KM = 1737.4;
const MOON_GM = 4902.8; // km³/s²
const UNIT_TO_KM = MOON_RADIUS_KM / 100; // 1 unit = 17.374 km

// Zoom levels: 0 = close flyover, 1 = full moon view
const MIN_ORBIT = 106;  // ~104 km above surface
const MAX_ORBIT = 400;  // ~5,212 km above surface
const DEFAULT_ORBIT = 180; // ~1,390 km — shows full moon clearly

// Orbit presets
const ORBIT_PRESETS = {
  equatorial: { label: 'Equatorial', inclination: 0.05, description: 'Near-equatorial orbit (~3°)' },
  polar: { label: 'Polar', inclination: Math.PI / 2 * 0.9, description: 'Near-polar orbit (~81°)' },
  inclined: { label: 'Inclined 45°', inclination: Math.PI / 4, description: 'Mid-inclination orbit' },
  apollo: { label: 'Apollo-style', inclination: 0.18, description: 'Apollo CSM orbit (~10°)' },
};

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

function computeOrbitalVelocity(distanceUnits) {
  const r_km = distanceUnits * UNIT_TO_KM;
  return Math.sqrt(MOON_GM / r_km) * 1000; // m/s
}

function computeAltitudeKm(distanceUnits) {
  return (distanceUnits - 100) * UNIT_TO_KM;
}

const LunarFlyover = ({ open, onClose }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const moonRef = useRef(null);
  const clockRef = useRef(null);
  const animationIdRef = useRef(null);
  const texturesRef = useRef({});

  // UI state
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hudData, setHudData] = useState({
    altitude: computeAltitudeKm(DEFAULT_ORBIT),
    lat: 0, lon: 0,
    speed: computeOrbitalVelocity(DEFAULT_ORBIT),
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [orbitType, setOrbitType] = useState('equatorial');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showTopography, setShowTopography] = useState(true);
  const [showEarthshine, setShowEarthshine] = useState(true);
  const [showStars, setShowStars] = useState(true);

  // Refs for animation loop (no re-render triggers)
  const autopilotRef = useRef(true);
  const pausedRef = useRef(false);
  const orbitDistRef = useRef(DEFAULT_ORBIT);
  const targetOrbitDistRef = useRef(DEFAULT_ORBIT);
  const orbitTypeRef = useRef('equatorial');
  const speedRef = useRef(1);
  const hudUpdateTimer = useRef(0);
  const showTopographyRef = useRef(true);
  const showEarthshineRef = useRef(true);
  const showStarsRef = useRef(true);
  const earthshineLightRef = useRef(null);
  const starsObjRef = useRef(null);
  const displacementLoadedRef = useRef(false);

  const controlsRef = useRef({
    manualRotation: new THREE.Euler(0, 0, 0),
    mouseDown: false,
    previousMousePosition: { x: 0, y: 0 },
    targetAltitude: DEFAULT_ORBIT,
  });

  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // Sync state → refs
  useEffect(() => { autopilotRef.current = isAutopilot; }, [isAutopilot]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { orbitTypeRef.current = orbitType; }, [orbitType]);
  useEffect(() => { speedRef.current = speedMultiplier; }, [speedMultiplier]);
  useEffect(() => { showTopographyRef.current = showTopography; }, [showTopography]);
  useEffect(() => { showEarthshineRef.current = showEarthshine; }, [showEarthshine]);
  useEffect(() => { showStarsRef.current = showStars; }, [showStars]);

  // Zoom handlers (called from buttons — modify the ref directly)
  const handleZoomIn = () => {
    targetOrbitDistRef.current = Math.max(MIN_ORBIT, targetOrbitDistRef.current - 20);
  };
  const handleZoomOut = () => {
    targetOrbitDistRef.current = Math.min(MAX_ORBIT, targetOrbitDistRef.current + 20);
  };

  // ─── Main scene lifecycle ───
  useEffect(() => {
    if (!open) return;
    if (!containerRef.current) return;

    const _isMobile = isMobileRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Reset refs on open
    orbitDistRef.current = DEFAULT_ORBIT;
    targetOrbitDistRef.current = DEFAULT_ORBIT;

    const clock = new THREE.Clock();
    clockRef.current = clock;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera — starts at DEFAULT_ORBIT showing full moon
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(0, 0, DEFAULT_ORBIT);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !_isMobile,
      precision: _isMobile ? 'mediump' : 'highp',
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, _isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !_isMobile;
    if (!_isMobile) renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Moon
    const segments = _isMobile ? 64 : 256;
    const moonGeometry = new THREE.SphereGeometry(100, segments, segments);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.95,
      metalness: 0.0,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    if (!_isMobile) { moon.castShadow = true; moon.receiveShadow = true; }
    scene.add(moon);
    moonRef.current = moon;
    texturesRef.current.moonMaterial = moonMaterial;

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffd699, 2.5);
    sunLight.position.set(150, 100, 150);
    sunLight.castShadow = !_isMobile;
    if (!_isMobile) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.far = 500;
      sunLight.shadow.camera.left = -200;
      sunLight.shadow.camera.right = 200;
      sunLight.shadow.camera.top = 200;
      sunLight.shadow.camera.bottom = -200;
    }
    scene.add(sunLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.05));

    const earthshine = new THREE.DirectionalLight(0x4488cc, 0.15);
    earthshine.position.set(-150, -50, -150);
    scene.add(earthshine);
    earthshineLightRef.current = earthshine;

    // Stars
    const starCount = _isMobile ? 1000 : 3000;
    const starsGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 500 + Math.random() * 200;
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI;
      starPos[i] = r * Math.sin(p) * Math.cos(t);
      starPos[i + 1] = r * Math.cos(p);
      starPos[i + 2] = r * Math.sin(p) * Math.sin(t);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
    starsObjRef.current = stars;

    // Textures
    const texLoader = new THREE.TextureLoader();
    const loadTex = (url, cb) => {
      texLoader.load(url, (tex) => {
        tex.anisotropy = renderer.capabilities.maxAnisotropy || 1;
        cb(tex);
      }, undefined, (err) => console.warn('Texture fail:', url, err));
    };
    loadTex(MOON_TEXTURES.color2k, (t) => { moonMaterial.map = t; moonMaterial.needsUpdate = true; });
    loadTex(MOON_TEXTURES.color4k, (t) => { moonMaterial.map = t; moonMaterial.needsUpdate = true; });
    if (!_isMobile) {
      loadTex(MOON_TEXTURES.color8k, (t) => { moonMaterial.map = t; moonMaterial.needsUpdate = true; });
    }
    loadTex(MOON_TEXTURES.displacement, (t) => {
      texturesRef.current.displacementTex = t;
      displacementLoadedRef.current = true;
      if (showTopographyRef.current) {
        moonMaterial.displacementMap = t;
        moonMaterial.displacementScale = _isMobile ? 1.5 : 2.5;
        moonMaterial.needsUpdate = true;
      }
    });

    // Resize
    const handleResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Controls ──
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 8 : -8;
      targetOrbitDistRef.current = Math.max(MIN_ORBIT, Math.min(MAX_ORBIT, targetOrbitDistRef.current + delta));
    };

    // Pinch-to-zoom
    let lastPinchDist = 0;
    const onTouchStartPinch = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMovePinch = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (lastPinchDist - dist) * 0.5;
        targetOrbitDistRef.current = Math.max(MIN_ORBIT, Math.min(MAX_ORBIT, targetOrbitDistRef.current + delta));
        lastPinchDist = dist;
      }
    };

    // Mouse drag (manual mode)
    const handleMouseDown = (e) => {
      controlsRef.current.mouseDown = true;
      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
      if (!controlsRef.current.mouseDown || autopilotRef.current) return;
      const dx = e.clientX - controlsRef.current.previousMousePosition.x;
      const dy = e.clientY - controlsRef.current.previousMousePosition.y;
      controlsRef.current.manualRotation.y += dx * 0.003;
      controlsRef.current.manualRotation.x += dy * 0.003;
      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { controlsRef.current.mouseDown = false; };

    // Touch drag (manual mode)
    let lastTouchX = 0, lastTouchY = 0;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        controlsRef.current.mouseDown = true;
      }
      onTouchStartPinch(e);
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        onTouchMovePinch(e);
        return;
      }
      if (e.touches.length === 1 && controlsRef.current.mouseDown && !autopilotRef.current) {
        const dx = e.touches[0].clientX - lastTouchX;
        const dy = e.touches[0].clientY - lastTouchY;
        controlsRef.current.manualRotation.y += dx * 0.003;
        controlsRef.current.manualRotation.x += dy * 0.003;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };
    const handleTouchEnd = () => { controlsRef.current.mouseDown = false; };

    const handleKeyDown = (e) => {
      const sp = 0.02;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': controlsRef.current.manualRotation.x -= sp; break;
        case 'ArrowDown': case 's': case 'S': controlsRef.current.manualRotation.x += sp; break;
        case 'ArrowLeft': case 'a': case 'A': controlsRef.current.manualRotation.y -= sp; break;
        case 'ArrowRight': case 'd': case 'D': controlsRef.current.manualRotation.y += sp; break;
        case '+': case '=': targetOrbitDistRef.current = Math.max(MIN_ORBIT, targetOrbitDistRef.current - 15); break;
        case '-': case '_': targetOrbitDistRef.current = Math.min(MAX_ORBIT, targetOrbitDistRef.current + 15); break;
        case ' ': e.preventDefault(); setIsPaused(p => !p); break;
        default: break;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ── Animation loop ──
    let lastPauseTime = 0;
    let accumulatedPauseTime = 0;
    let wasPaused = false;

    const animateLoop = () => {
      animationIdRef.current = requestAnimationFrame(animateLoop);

      // Toggle refs for dynamic options
      if (earthshineLightRef.current) {
        earthshineLightRef.current.intensity = showEarthshineRef.current ? 0.15 : 0;
      }
      if (starsObjRef.current) {
        starsObjRef.current.visible = showStarsRef.current;
      }
      if (texturesRef.current.moonMaterial && displacementLoadedRef.current) {
        const mat = texturesRef.current.moonMaterial;
        if (showTopographyRef.current && !mat.displacementMap && texturesRef.current.displacementTex) {
          mat.displacementMap = texturesRef.current.displacementTex;
          mat.displacementScale = _isMobile ? 1.5 : 2.5;
          mat.needsUpdate = true;
        } else if (!showTopographyRef.current && mat.displacementMap) {
          mat.displacementMap = null;
          mat.displacementScale = 0;
          mat.needsUpdate = true;
        }
      }

      const paused = pausedRef.current;
      if (paused && !wasPaused) { lastPauseTime = clock.getElapsedTime(); wasPaused = true; }
      if (!paused && wasPaused) { accumulatedPauseTime += clock.getElapsedTime() - lastPauseTime; wasPaused = false; }
      if (paused) { renderer.render(scene, camera); return; }

      const rawTime = clock.getElapsedTime();
      const time = (rawTime - accumulatedPauseTime) * speedRef.current;

      // Smooth zoom interpolation
      orbitDistRef.current += (targetOrbitDistRef.current - orbitDistRef.current) * 0.08;
      const baseDist = orbitDistRef.current;

      const orbitSpeed = 0.015;
      const angle = time * orbitSpeed;
      const preset = ORBIT_PRESETS[orbitTypeRef.current] || ORBIT_PRESETS.equatorial;
      const incl = preset.inclination;
      const isAuto = autopilotRef.current;

      let currentDist = baseDist;

      if (isAuto) {
        // Gentle altitude undulation (proportional to how close we are)
        const undulationScale = Math.max(0, (baseDist - MIN_ORBIT) * 0.03);
        const altVar = Math.sin(time * 0.3) * undulationScale + Math.sin(time * 0.7) * undulationScale * 0.5;
        currentDist = baseDist + altVar;

        // Inclined orbit path
        const x = Math.cos(angle) * currentDist;
        const z = Math.sin(angle) * currentDist;
        const y = Math.sin(angle) * Math.sin(incl) * currentDist * 0.3;

        camera.position.set(x, y, z);

        // Look ahead along orbit
        const lookAngle = angle + 0.12;
        const lookTarget = new THREE.Vector3(
          Math.cos(lookAngle) * 100,
          Math.sin(lookAngle) * Math.sin(incl) * 100 * 0.3,
          Math.sin(lookAngle) * 100
        );
        camera.lookAt(lookTarget);
        camera.rotation.z = Math.sin(time * 0.4) * 0.03;
      } else {
        currentDist = baseDist;
        const phi = Math.PI / 2 - controlsRef.current.manualRotation.x;
        const theta = controlsRef.current.manualRotation.y;
        camera.position.x = currentDist * Math.sin(phi) * Math.cos(theta);
        camera.position.y = currentDist * Math.cos(phi);
        camera.position.z = currentDist * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0);
      }

      // HUD data (throttled ~10fps)
      hudUpdateTimer.current += 1;
      if (hudUpdateTimer.current >= 6) {
        hudUpdateTimer.current = 0;
        const camDir = camera.position.clone().normalize();
        const lat = THREE.MathUtils.radToDeg(Math.asin(camDir.y));
        const lon = THREE.MathUtils.radToDeg(Math.atan2(camDir.z, camDir.x));
        setHudData({
          altitude: computeAltitudeKm(currentDist),
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lon * 100) / 100,
          speed: Math.round(computeOrbitalVelocity(currentDist)),
        });
      }

      renderer.render(scene, camera);
    };

    animateLoop();

    // Cleanup
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      if (renderer) { renderer.forceContextLoss(); renderer.dispose(); }
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      Object.values(texturesRef.current).forEach((t) => { if (t && t.dispose) t.dispose(); });
      texturesRef.current = {};
      if (containerRef.current?.firstChild) containerRef.current.removeChild(containerRef.current.firstChild);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const btnStyle = (active = false) => ({
    fontFamily: 'monospace',
    fontSize: '11px',
    padding: '8px 12px',
    border: '1px solid rgba(126,184,247,0.3)',
    background: active ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)',
    color: 'rgba(126,184,247,0.8)',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  });

  const zoomBtnStyle = {
    width: '44px',
    height: '44px',
    border: '1px solid rgba(126,184,247,0.3)',
    background: 'rgba(0,0,0,0.6)',
    color: 'rgba(126,184,247,0.9)',
    fontSize: '22px',
    fontFamily: 'monospace',
    cursor: 'pointer',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const hudFont = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: 'rgba(126,184,247,0.7)',
    letterSpacing: '1px',
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 50, overflow: 'hidden', background: '#000000',
      }}
    >
      <style>{`
        @keyframes hudPulse { 0%,100%{opacity:0.7} 50%{opacity:0.9} }
        .lf-hud-title { animation: hudPulse 3s ease-in-out infinite; }
        .lf-panel { background: rgba(0,0,0,0.85); border: 1px solid rgba(126,184,247,0.2); border-radius: 8px; color: rgba(200,220,255,0.9); font-family: monospace; font-size: 12px; line-height: 1.6; }
        .lf-panel h3 { color: rgba(126,184,247,0.9); font-size: 13px; margin: 0 0 8px 0; letter-spacing: 1px; }
        .lf-panel p { margin: 4px 0; }
        .lf-toggle { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(126,184,247,0.08); cursor: pointer; }
        .lf-toggle:last-child { border-bottom: none; }
        .lf-dot { width: 8px; height: 8px; border-radius: 50%; }
        .lf-section { margin-bottom: 14px; }
        .lf-section-title { color: rgba(126,184,247,0.6); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
      `}</style>

      {/* ── Top-left: Title ── */}
      <div className="lf-hud-title" style={{ position:'fixed', top:'24px', left:'24px', fontFamily:'monospace', fontSize:'12px', color:'rgba(126,184,247,0.7)', fontWeight:'bold', letterSpacing:'2px', zIndex:51 }}>
        LUNAR FLYOVER
      </div>

      {/* ── Top-right: Close + Info + Menu buttons ── */}
      <div style={{ position:'fixed', top:'20px', right:'20px', display:'flex', gap:'8px', zIndex:52 }}>
        {/* Science Info */}
        <button
          onClick={() => { setShowInfo(v => !v); setShowMenu(false); }}
          style={{ ...zoomBtnStyle, width:'40px', height:'40px', fontSize:'18px', fontWeight:'bold', background: showInfo ? 'rgba(126,184,247,0.25)' : 'rgba(0,0,0,0.6)' }}
        >?</button>

        {/* Menu */}
        <button
          onClick={() => { setShowMenu(v => !v); setShowInfo(false); }}
          style={{ ...zoomBtnStyle, width:'40px', height:'40px', fontSize:'16px', background: showMenu ? 'rgba(126,184,247,0.25)' : 'rgba(0,0,0,0.6)' }}
        >☰</button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ ...zoomBtnStyle, width:'40px', height:'40px', fontSize:'20px' }}
        >×</button>
      </div>

      {/* ── Science Info Panel ── */}
      {showInfo && (
        <div className="lf-panel" style={{ position:'fixed', top:'70px', right:'20px', width: isMobileRef.current ? 'calc(100% - 40px)' : '360px', maxHeight:'calc(100vh - 160px)', overflowY:'auto', padding:'16px', zIndex:52 }}>
          <h3>ABOUT THIS SIMULATION</h3>
          <p style={{ color:'rgba(200,220,255,0.7)', marginBottom:'12px' }}>
            You are orbiting the Moon in a scientifically accurate simulation. All data displayed is computed from real physical models.
          </p>

          <div className="lf-section">
            <div className="lf-section-title">Surface Imagery</div>
            <p>Color maps from <strong style={{color:'rgba(126,184,247,0.9)'}}>NASA LROC</strong> (Lunar Reconnaissance Orbiter Camera) Wide Angle Camera global mosaic — real photographs of the lunar surface stitched from orbit at ~100m/pixel resolution.</p>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Topography</div>
            <p>Elevation data from <strong style={{color:'rgba(126,184,247,0.9)'}}>LOLA</strong> (Lunar Orbiter Laser Altimeter) Digital Elevation Model. LOLA fired laser pulses from orbit measuring surface height with sub-meter accuracy across 6.5 billion data points.</p>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Orbital Velocity</div>
            <p>Computed using <strong style={{color:'rgba(126,184,247,0.9)'}}>Keplerian mechanics</strong>: v = √(GM/r) where GM<sub>Moon</sub> = 4,902.8 km³/s². At 100 km altitude, real orbital velocity is ~1,633 m/s — matching Apollo Command Module data.</p>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Coordinates</div>
            <p><strong style={{color:'rgba(126,184,247,0.9)'}}>Selenographic coordinates</strong> — the IAU standard coordinate system for the Moon. Latitude measures north/south of the lunar equator; longitude measures east/west from the prime meridian (center of the near side facing Earth).</p>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Earthshine</div>
            <p>The subtle <strong style={{color:'#4488cc'}}>blue-tinted light</strong> illuminating the dark side is <em>Earthshine</em> — sunlight reflected off Earth's oceans and atmosphere onto the Moon. First explained by Leonardo da Vinci in 1510.</p>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Altitude</div>
            <p>Height above the mean lunar radius of <strong style={{color:'rgba(126,184,247,0.9)'}}>1,737.4 km</strong>. The Lunar Reconnaissance Orbiter orbits at ~50 km; Apollo Command Modules orbited at ~110 km.</p>
          </div>

          <div style={{ marginTop:'12px', padding:'10px', background:'rgba(126,184,247,0.05)', borderRadius:'4px', color:'rgba(200,220,255,0.5)', fontSize:'10px' }}>
            Data sources: NASA SVS CGI Moon Kit • LRO/LOLA • GSFC
          </div>
        </div>
      )}

      {/* ── Settings Menu Panel ── */}
      {showMenu && (
        <div className="lf-panel" style={{ position:'fixed', top:'70px', right:'20px', width: isMobileRef.current ? 'calc(100% - 40px)' : '280px', maxHeight:'calc(100vh - 160px)', overflowY:'auto', padding:'16px', zIndex:52 }}>
          <h3>SETTINGS</h3>

          <div className="lf-section">
            <div className="lf-section-title">Orbit Type</div>
            {Object.entries(ORBIT_PRESETS).map(([key, val]) => (
              <div key={key} className="lf-toggle" onClick={() => setOrbitType(key)} style={{ opacity: orbitType === key ? 1 : 0.5 }}>
                <span>{val.label}</span>
                <div className="lf-dot" style={{ background: orbitType === key ? 'rgba(126,184,247,0.9)' : 'rgba(126,184,247,0.2)' }} />
              </div>
            ))}
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Speed</div>
            <div style={{ display:'flex', gap:'6px' }}>
              {SPEED_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setSpeedMultiplier(opt.value)} style={btnStyle(speedMultiplier === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Visual Options</div>
            <div className="lf-toggle" onClick={() => setShowTopography(v => !v)}>
              <span>Topography (LOLA)</span>
              <div className="lf-dot" style={{ background: showTopography ? '#5b9cf5' : 'rgba(126,184,247,0.2)' }} />
            </div>
            <div className="lf-toggle" onClick={() => setShowEarthshine(v => !v)}>
              <span>Earthshine</span>
              <div className="lf-dot" style={{ background: showEarthshine ? '#4488cc' : 'rgba(126,184,247,0.2)' }} />
            </div>
            <div className="lf-toggle" onClick={() => setShowStars(v => !v)}>
              <span>Star Field</span>
              <div className="lf-dot" style={{ background: showStars ? '#ffffff' : 'rgba(126,184,247,0.2)' }} />
            </div>
          </div>

          <div className="lf-section">
            <div className="lf-section-title">Mode</div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button onClick={() => setIsAutopilot(true)} style={btnStyle(isAutopilot)}>Autopilot</button>
              <button onClick={() => setIsAutopilot(false)} style={btnStyle(!isAutopilot)}>Manual</button>
            </div>
            {!isAutopilot && (
              <p style={{ color:'rgba(200,220,255,0.4)', fontSize:'10px', marginTop:'6px' }}>
                {isMobileRef.current ? 'Drag to rotate' : 'Drag or WASD to rotate'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Zoom Controls (right side, vertical) ── */}
      <div style={{ position:'fixed', right:'20px', top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:'8px', zIndex:51 }}>
        <button onClick={handleZoomIn} style={zoomBtnStyle}>+</button>
        <button onClick={handleZoomOut} style={zoomBtnStyle}>−</button>
      </div>

      {/* ── Pause button (bottom-left on mobile, bottom-right on desktop) ── */}
      <div style={{ position:'fixed', bottom:'70px', left: isMobileRef.current ? '20px' : 'auto', right: isMobileRef.current ? 'auto' : '20px', zIndex:51 }}>
        <button onClick={() => setIsPaused(p => !p)} style={btnStyle(isPaused)}>
          {isPaused ? '▶ RESUME' : '❚❚ PAUSE'}
        </button>
      </div>

      {/* ── Bottom HUD strip ── */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, height:'54px',
        background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'space-between', alignItems:'center',
        paddingLeft:'20px', paddingRight:'20px', zIndex:51,
        borderTop:'1px solid rgba(126,184,247,0.1)',
      }}>
        <div style={hudFont}>ALT {hudData.altitude.toFixed(1)} km</div>
        <div style={hudFont}>LAT {hudData.lat.toFixed(2)}° LON {hudData.lon.toFixed(2)}°</div>
        <div style={{...hudFont, display: isMobileRef.current ? 'none' : 'block'}}>
          v = {hudData.speed.toLocaleString()} m/s
        </div>
        <div style={hudFont}>
          {ORBIT_PRESETS[orbitType]?.label || 'Equatorial'}
        </div>
      </div>
    </div>
  );
};

export default LunarFlyover;
