import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

const MOON_TEXTURES = {
  color4k: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.jpg',
  color8k: 'https://www.solarsystemscope.com/textures/download/8k_moon.jpg',
  color2k: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  displacement: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.jpg',
};

const LunarFlyover = ({ open, onClose }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const moonRef = useRef(null);
  const clockRef = useRef(null);
  const animationIdRef = useRef(null);
  const texturesRef = useRef({});
  const starsRef = useRef(null);

  // Use STATE only for UI display (buttons, HUD text)
  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hudData, setHudData] = useState({ altitude: 107, lat: 0, lon: 0, speed: 1680 });

  // Use REFS for values read inside the animation loop — avoids re-renders
  const autopilotRef = useRef(true);
  const pausedRef = useRef(false);
  const altitudeRef = useRef(107);
  const hudUpdateTimer = useRef(0);

  const controlsRef = useRef({
    manualRotation: new THREE.Euler(0, 0, 0),
    mouseDown: false,
    previousMousePosition: { x: 0, y: 0 },
    targetAltitude: 107,
  });

  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // Sync state → ref when buttons are clicked
  useEffect(() => { autopilotRef.current = isAutopilot; }, [isAutopilot]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  // ─── Main effect: scene lifecycle tied ONLY to `open` ───
  useEffect(() => {
    if (!open) return;
    if (!containerRef.current) return;

    const _isMobile = isMobileRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // ── Clock ──
    const clock = new THREE.Clock();
    clockRef.current = clock;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 0, 107);
    cameraRef.current = camera;

    // ── Renderer ──
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

    // ── Moon ──
    const segments = _isMobile ? 64 : 256;
    const moonGeometry = new THREE.SphereGeometry(100, segments, segments);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.95,
      metalness: 0.0,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    if (!_isMobile) {
      moon.castShadow = true;
      moon.receiveShadow = true;
    }
    scene.add(moon);
    moonRef.current = moon;
    texturesRef.current.moonMaterial = moonMaterial;

    // ── Lighting ──
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    const earthshineLight = new THREE.DirectionalLight(0x4488cc, 0.15);
    earthshineLight.position.set(-150, -50, -150);
    scene.add(earthshineLight);

    // ── Stars ──
    const starCount = _isMobile ? 1000 : 3000;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 500 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.cos(phi);
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // ── Textures (progressive) ──
    const textureLoader = new THREE.TextureLoader();
    const loadTex = (url, cb) => {
      textureLoader.load(url, (tex) => {
        tex.anisotropy = renderer.capabilities.maxAnisotropy || 1;
        cb(tex);
      }, undefined, (err) => console.warn('Texture load failed:', url, err));
    };

    loadTex(MOON_TEXTURES.color2k, (tex) => { moonMaterial.map = tex; moonMaterial.needsUpdate = true; });
    loadTex(MOON_TEXTURES.color4k, (tex) => { moonMaterial.map = tex; moonMaterial.needsUpdate = true; });
    if (!_isMobile) {
      loadTex(MOON_TEXTURES.color8k, (tex) => { moonMaterial.map = tex; moonMaterial.needsUpdate = true; });
    }
    loadTex(MOON_TEXTURES.displacement, (tex) => {
      moonMaterial.displacementMap = tex;
      moonMaterial.displacementScale = _isMobile ? 1.5 : 2.5;
      moonMaterial.needsUpdate = true;
    });

    // ── Resize handler ──
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Controls ──
    const handleMouseDown = (e) => {
      controlsRef.current.mouseDown = true;
      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
      if (!controlsRef.current.mouseDown || autopilotRef.current) return;
      const deltaX = e.clientX - controlsRef.current.previousMousePosition.x;
      const deltaY = e.clientY - controlsRef.current.previousMousePosition.y;
      controlsRef.current.manualRotation.y += deltaX * 0.003;
      controlsRef.current.manualRotation.x += deltaY * 0.003;
      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = () => { controlsRef.current.mouseDown = false; };
    const handleWheel = (e) => {
      if (autopilotRef.current) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.5 : -0.5;
      controlsRef.current.targetAltitude = Math.max(103, Math.min(115, controlsRef.current.targetAltitude + delta));
    };
    const handleKeyDown = (e) => {
      const sp = 0.02;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': controlsRef.current.manualRotation.x -= sp; break;
        case 'ArrowDown': case 's': case 'S': controlsRef.current.manualRotation.x += sp; break;
        case 'ArrowLeft': case 'a': case 'A': controlsRef.current.manualRotation.y -= sp; break;
        case 'ArrowRight': case 'd': case 'D': controlsRef.current.manualRotation.y += sp; break;
        case ' ': e.preventDefault(); setIsPaused(p => !p); break;
        default: break;
      }
    };

    // Touch controls for mobile
    let lastTouchX = 0, lastTouchY = 0;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        controlsRef.current.mouseDown = true;
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && controlsRef.current.mouseDown && !autopilotRef.current) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        controlsRef.current.manualRotation.y += deltaX * 0.003;
        controlsRef.current.manualRotation.x += deltaY * 0.003;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };
    const handleTouchEnd = () => { controlsRef.current.mouseDown = false; };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // ── Animation loop (pure ref-based — no state dependencies) ──
    let lastPauseTime = 0;
    let accumulatedPauseTime = 0;
    let wasPaused = false;

    const animateLoop = () => {
      animationIdRef.current = requestAnimationFrame(animateLoop);

      const paused = pausedRef.current;

      // Track pause time so animation resumes smoothly
      if (paused && !wasPaused) {
        lastPauseTime = clock.getElapsedTime();
        wasPaused = true;
        return;
      }
      if (!paused && wasPaused) {
        accumulatedPauseTime += clock.getElapsedTime() - lastPauseTime;
        wasPaused = false;
      }
      if (paused) {
        renderer.render(scene, camera);
        return;
      }

      const rawTime = clock.getElapsedTime();
      const time = rawTime - accumulatedPauseTime;

      const orbitSpeed = 0.015;
      const angle = time * orbitSpeed;
      const isAuto = autopilotRef.current;

      if (isAuto) {
        const altitudeVariation = 5 + Math.sin(time * 0.3) * 3 + Math.sin(time * 0.7) * 1.5;
        const newAltitude = 107 + altitudeVariation;
        altitudeRef.current = Math.round((newAltitude - 100) * 100) / 100;

        camera.position.x = Math.cos(angle) * newAltitude;
        camera.position.z = Math.sin(angle) * newAltitude;
        camera.position.y = Math.sin(time * 0.2) * 8;

        const lookAheadAngle = angle + 0.15;
        const lookTarget = new THREE.Vector3(
          Math.cos(lookAheadAngle) * 100,
          Math.sin(time * 0.2 + 0.3) * 5,
          Math.sin(lookAheadAngle) * 100
        );
        camera.lookAt(lookTarget);
        camera.rotation.z = Math.sin(time * 0.4) * 0.05;
      } else {
        const altitudeDelta = controlsRef.current.targetAltitude - altitudeRef.current;
        const newAltitude = altitudeRef.current + altitudeDelta * 0.05;
        altitudeRef.current = Math.round(newAltitude * 100) / 100;

        const distance = newAltitude;
        const phi = Math.PI / 2 - controlsRef.current.manualRotation.x;
        const theta = controlsRef.current.manualRotation.y;

        camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
        camera.position.y = distance * Math.cos(phi);
        camera.position.z = distance * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0);
      }

      // Compute coordinates from camera position
      const camDir = camera.position.clone().normalize();
      const lat = THREE.MathUtils.radToDeg(Math.asin(camDir.y));
      const lon = THREE.MathUtils.radToDeg(Math.atan2(camDir.z, camDir.x));

      // Throttle HUD state updates to ~10fps (every ~100ms) to avoid re-render spam
      hudUpdateTimer.current += 1;
      if (hudUpdateTimer.current >= 6) {
        hudUpdateTimer.current = 0;
        setHudData({
          altitude: altitudeRef.current,
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lon * 100) / 100,
          speed: 1680,
        });
      }

      renderer.render(scene, camera);
    };

    animateLoop();

    // ── Cleanup ──
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

      if (renderer) {
        renderer.forceContextLoss();
        renderer.dispose();
      }

      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      // Dispose loaded textures
      Object.values(texturesRef.current).forEach((t) => {
        if (t && t.dispose) t.dispose();
      });
      texturesRef.current = {};

      if (containerRef.current?.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [open]); // ONLY depends on `open` — no callbacks, no state

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      {/* HUD Overlay */}
      <style>{`
        @keyframes hudPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        .lunar-hud-title {
          animation: hudPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Top-left: Title */}
      <div
        className="lunar-hud-title"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'rgba(126,184,247,0.7)',
          fontWeight: 'bold',
          letterSpacing: '2px',
          zIndex: 51,
        }}
      >
        LUNAR FLYOVER
      </div>

      {/* Top-right: Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          border: 'none',
          background: 'rgba(126,184,247,0.15)',
          color: 'rgba(126,184,247,0.7)',
          fontSize: '20px',
          cursor: 'pointer',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          zIndex: 51,
          touchAction: 'manipulation',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.25)';
          e.target.style.color = 'rgba(126,184,247,0.9)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.15)';
          e.target.style.color = 'rgba(126,184,247,0.7)';
        }}
      >
        ×
      </button>

      {/* Bottom HUD strip */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          zIndex: 51,
          borderTop: '1px solid rgba(126,184,247,0.1)',
        }}
      >
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(126,184,247,0.7)', letterSpacing: '1px' }}>
          ALT {(hudData.altitude * 8.848).toFixed(1)} km
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(126,184,247,0.7)', letterSpacing: '1px' }}>
          LAT {hudData.lat.toFixed(2)}° LON {hudData.lon.toFixed(2)}°
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(126,184,247,0.7)', letterSpacing: '1px' }}>
          ORBITAL VEL {hudData.speed} m/s
        </div>
      </div>

      {/* Autopilot & Pause controls */}
      <div
        style={{
          position: 'fixed',
          bottom: '70px',
          right: '24px',
          display: 'flex',
          gap: '12px',
          zIndex: 51,
        }}
      >
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '8px 12px',
            border: '1px solid rgba(126,184,247,0.3)',
            background: isPaused ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)',
            color: 'rgba(126,184,247,0.7)',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
          }}
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        <button
          onClick={() => setIsAutopilot((prev) => !prev)}
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '8px 12px',
            border: '1px solid rgba(126,184,247,0.3)',
            background: isAutopilot ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)',
            color: 'rgba(126,184,247,0.7)',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
          }}
        >
          {isAutopilot ? 'AUTO ON' : 'MANUAL'}
        </button>
      </div>
    </div>
  );
};

export default LunarFlyover;
